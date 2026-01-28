# AgencyBoost Multi-Tenant Architecture & AWS Deployment Plan

## Table of Contents
1. [Overview](#overview)
2. [Multi-Tenant Architecture](#multi-tenant-architecture)
3. [Master Admin System](#master-admin-system)
4. [Development Workflow](#development-workflow)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [AWS Infrastructure](#aws-infrastructure)
7. [Database Strategy](#database-strategy)
8. [Environment Configuration](#environment-configuration)
9. [Implementation Phases](#implementation-phases)
10. [Security Considerations](#security-considerations)

---

## Overview

This document outlines the plan to transform AgencyBoost from a single-tenant application into a multi-tenant SaaS platform with:
- **Database-per-tenant isolation** for maximum data security
- **Master Admin capabilities** for tenant management and impersonation
- **CI/CD pipeline** from Replit → AWS Staging → AWS Production
- **Identical staging and production environments** for reliable testing

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DEVELOPMENT ENVIRONMENT                         │
│                              (Replit)                                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │
│  │   Frontend  │    │   Backend   │    │  Dev DB     │                 │
│  │   (React)   │◄──▶│  (Express)  │◄──▶│ (PostgreSQL)│                 │
│  └─────────────┘    └─────────────┘    └─────────────┘                 │
└─────────────────────────────────────────────────────────────────────────┘
                                │
                                │ git push (GitHub)
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         VERSION CONTROL (GitHub)                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │
│  │   develop   │───▶│   staging   │───▶│    main     │                 │
│  │   branch    │    │   branch    │    │   branch    │                 │
│  └─────────────┘    └─────────────┘    └─────────────┘                 │
└─────────────────────────────────────────────────────────────────────────┘
                                │                │
                    Auto Deploy │                │ Manual Promote
                                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              AWS CLOUD                                   │
│                                                                         │
│  ┌─────────────────────────────┐    ┌─────────────────────────────┐   │
│  │        STAGING ENV          │    │       PRODUCTION ENV        │   │
│  │  staging.agencyboost.com    │    │    app.agencyboost.com      │   │
│  │                             │    │                             │   │
│  │  ┌───────┐    ┌───────┐    │    │  ┌───────┐    ┌───────┐    │   │
│  │  │  ECS  │    │  RDS  │    │    │  │  ECS  │    │  RDS  │    │   │
│  │  │Cluster│    │Staging│    │    │  │Cluster│    │ Prod  │    │   │
│  │  └───────┘    └───────┘    │    │  └───────┘    └───────┘    │   │
│  └─────────────────────────────┘    └─────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    SHARED SERVICES                               │   │
│  │  ┌─────┐  ┌──────┐  ┌────────┐  ┌─────────┐  ┌───────────┐     │   │
│  │  │ ECR │  │  S3  │  │Route 53│  │   ALB   │  │ Secrets   │     │   │
│  │  │     │  │      │  │  DNS   │  │         │  │ Manager   │     │   │
│  │  └─────┘  └──────┘  └────────┘  └─────────┘  └───────────┘     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Multi-Tenant Architecture

### Tenant Isolation Strategy: Database-per-Tenant

Each tenant (agency) gets their own isolated PostgreSQL database. This approach provides:

| Benefit | Description |
|---------|-------------|
| **Complete Data Isolation** | No risk of data leakage between tenants |
| **Independent Backups** | Backup/restore individual tenants |
| **Performance Isolation** | One tenant's load doesn't affect others |
| **Compliance Ready** | Easy to meet data residency requirements |
| **Easy Offboarding** | Simple to export or delete tenant data |

### Tenant Database Naming Convention

```
agencyboost_tenant_{tenant_slug}

Examples:
- agencyboost_tenant_acme_marketing
- agencyboost_tenant_creative_agency
- agencyboost_tenant_digital_pros
```

### Central Tenant Registry

A **master database** stores all tenant metadata:

```sql
-- Master Database Schema
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    custom_domain VARCHAR(255),
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    database_name VARCHAR(255) NOT NULL,
    database_host VARCHAR(255) NOT NULL,
    subscription_status VARCHAR(50) DEFAULT 'trial',
    subscription_plan VARCHAR(50) DEFAULT 'starter',
    max_users INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    settings JSONB DEFAULT '{}'
);

CREATE TABLE master_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'super_admin',
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

CREATE TABLE tenant_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    master_admin_id UUID REFERENCES master_admins(id),
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Tenant Resolution Flow

```
1. Request arrives at *.agencyboost.com
                    │
2. Extract subdomain from Host header
   (e.g., "acme" from "acme.agencyboost.com")
                    │
3. Query master database for tenant by subdomain
                    │
4. Get tenant's database connection string
                    │
5. Create/reuse database connection pool for tenant
                    │
6. All subsequent queries use tenant's database
```

### Tenant Connection Pool Manager

```typescript
// server/lib/tenant-manager.ts

interface TenantConnection {
  tenantId: string;
  pool: Pool;
  lastAccessed: Date;
}

class TenantConnectionManager {
  private connections: Map<string, TenantConnection> = new Map();
  
  async getConnection(tenantSlug: string): Promise<Pool> {
    // Check cache
    if (this.connections.has(tenantSlug)) {
      const conn = this.connections.get(tenantSlug)!;
      conn.lastAccessed = new Date();
      return conn.pool;
    }
    
    // Lookup tenant in master database
    const tenant = await this.lookupTenant(tenantSlug);
    
    // Create new connection pool
    const pool = new Pool({
      host: tenant.databaseHost,
      database: tenant.databaseName,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: 10
    });
    
    this.connections.set(tenantSlug, {
      tenantId: tenant.id,
      pool,
      lastAccessed: new Date()
    });
    
    return pool;
  }
  
  // Cleanup idle connections periodically
  async cleanupIdleConnections() {
    const threshold = 30 * 60 * 1000; // 30 minutes
    const now = new Date();
    
    for (const [slug, conn] of this.connections) {
      if (now.getTime() - conn.lastAccessed.getTime() > threshold) {
        await conn.pool.end();
        this.connections.delete(slug);
      }
    }
  }
}
```

---

## Master Admin System

### Master Admin Features

1. **Tenant Management Dashboard**
   - View all tenants with status, plan, user count
   - Create new tenants (provisions database automatically)
   - Suspend/reactivate tenants
   - Delete tenants (with data export option)

2. **Tenant Impersonation**
   - Login as any user in any tenant
   - Audit trail of all impersonation sessions
   - Visual indicator when impersonating

3. **System Analytics**
   - Cross-tenant usage statistics
   - Revenue and subscription metrics
   - System health monitoring

### Master Admin Authentication

Master admins have a **separate login flow** from regular tenant users:

```
https://admin.agencyboost.com  →  Master Admin Login
https://acme.agencyboost.com   →  Tenant User Login
```

### Impersonation Flow

```
1. Master Admin clicks "Login as User" on tenant dashboard
                    │
2. System creates impersonation session:
   - Original master admin ID stored
   - Target tenant + user recorded
   - Audit log entry created
                    │
3. Session cookie set with:
   - impersonating: true
   - originalAdminId: {masterAdminId}
   - tenantId: {tenantId}
   - userId: {targetUserId}
                    │
4. Redirect to tenant application
   - Yellow banner: "Impersonating: John Doe (ACME Agency)"
   - "End Session" button to return to master admin
                    │
5. All actions logged with master admin attribution
```

### Master Admin API Routes

```typescript
// Master Admin Routes (admin.agencyboost.com)

POST   /api/master/auth/login          // Master admin login
POST   /api/master/auth/logout         // Master admin logout
GET    /api/master/auth/me             // Current master admin

GET    /api/master/tenants             // List all tenants
POST   /api/master/tenants             // Create new tenant
GET    /api/master/tenants/:id         // Get tenant details
PUT    /api/master/tenants/:id         // Update tenant
DELETE /api/master/tenants/:id         // Delete tenant
POST   /api/master/tenants/:id/suspend // Suspend tenant
POST   /api/master/tenants/:id/activate// Reactivate tenant

POST   /api/master/tenants/:id/impersonate/:userId  // Start impersonation
POST   /api/master/impersonation/end                // End impersonation

GET    /api/master/analytics/overview  // System-wide analytics
GET    /api/master/analytics/revenue   // Revenue metrics
```

---

## Development Workflow

### Branch Strategy

```
main (production)
  │
  └── staging (pre-production testing)
        │
        └── develop (active development)
              │
              ├── feature/multi-tenant
              ├── feature/master-admin
              └── fix/bug-123
```

### Daily Development Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     YOUR DAILY WORKFLOW                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. DEVELOP IN REPLIT                                               │
│     • Write code, test locally                                      │
│     • Replit's dev database for testing                             │
│     • Hot reload for instant feedback                               │
│                                                                      │
│  2. COMMIT & PUSH TO GITHUB                                         │
│     $ git add .                                                     │
│     $ git commit -m "feat: add tenant provisioning"                 │
│     $ git push origin develop                                       │
│                                                                      │
│  3. CREATE PR: develop → staging                                    │
│     • GitHub Actions runs tests                                     │
│     • Code review (optional)                                        │
│     • Merge triggers staging deploy                                 │
│                                                                      │
│  4. TEST ON STAGING                                                 │
│     • https://staging.agencyboost.com                               │
│     • Same infrastructure as production                             │
│     • Test with staging data                                        │
│                                                                      │
│  5. PROMOTE TO PRODUCTION                                           │
│     • Create PR: staging → main                                     │
│     • Merge triggers production deploy                              │
│     • Monitor for issues                                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml

name: Deploy AgencyBoost

on:
  push:
    branches:
      - staging
      - main

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: agencyboost

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build application
        run: npm run build
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
      
      - name: Determine environment
        id: env
        run: |
          if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            echo "environment=production" >> $GITHUB_OUTPUT
            echo "ecs_cluster=agencyboost-prod" >> $GITHUB_OUTPUT
            echo "ecs_service=agencyboost-prod-service" >> $GITHUB_OUTPUT
          else
            echo "environment=staging" >> $GITHUB_OUTPUT
            echo "ecs_cluster=agencyboost-staging" >> $GITHUB_OUTPUT
            echo "ecs_service=agencyboost-staging-service" >> $GITHUB_OUTPUT
          fi
      
      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:${{ steps.env.outputs.environment }}-latest .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:${{ steps.env.outputs.environment }}-latest
      
      - name: Run database migrations
        env:
          DATABASE_URL: ${{ steps.env.outputs.environment == 'production' && secrets.PROD_DATABASE_URL || secrets.STAGING_DATABASE_URL }}
        run: npm run db:migrate
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster ${{ steps.env.outputs.ecs_cluster }} \
            --service ${{ steps.env.outputs.ecs_service }} \
            --force-new-deployment
      
      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster ${{ steps.env.outputs.ecs_cluster }} \
            --services ${{ steps.env.outputs.ecs_service }}
      
      - name: Notify on success
        if: success()
        run: |
          echo "Deployed to ${{ steps.env.outputs.environment }}"
      
      - name: Notify on failure
        if: failure()
        run: |
          echo "Deployment to ${{ steps.env.outputs.environment }} failed"
```

### Dockerfile

```dockerfile
# Dockerfile

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start application
CMD ["node", "dist/server/index.js"]
```

---

## AWS Infrastructure

### Architecture Components

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              VPC                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Public Subnets                               │   │
│  │  ┌─────────────┐                      ┌─────────────┐           │   │
│  │  │     ALB     │──────────────────────│     ALB     │           │   │
│  │  │  (Staging)  │                      │   (Prod)    │           │   │
│  │  └─────────────┘                      └─────────────┘           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                           │                        │                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Private Subnets                              │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │   │
│  │  │  ECS Tasks  │    │  ECS Tasks  │    │  ECS Tasks  │          │   │
│  │  │  (Staging)  │    │   (Prod)    │    │   (Prod)    │          │   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘          │   │
│  │         │                  │                   │                 │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │                 RDS PostgreSQL                          │    │   │
│  │  │  ┌───────────────┐         ┌───────────────┐           │    │   │
│  │  │  │ Master DB     │         │ Master DB     │           │    │   │
│  │  │  │ (Staging)     │         │ (Production)  │           │    │   │
│  │  │  ├───────────────┤         ├───────────────┤           │    │   │
│  │  │  │ Tenant DBs    │         │ Tenant DBs    │           │    │   │
│  │  │  │ ├─ tenant_a   │         │ ├─ tenant_a   │           │    │   │
│  │  │  │ ├─ tenant_b   │         │ ├─ tenant_b   │           │    │   │
│  │  │  │ └─ tenant_c   │         │ └─ tenant_c   │           │    │   │
│  │  │  └───────────────┘         └───────────────┘           │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘

External Services:
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Route 53   │  │     S3      │  │     ECR     │  │  Secrets    │
│    DNS      │  │   Storage   │  │   Images    │  │  Manager    │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

### AWS Services Used

| Service | Purpose | Staging | Production |
|---------|---------|---------|------------|
| **ECS Fargate** | Container orchestration | 1-2 tasks | 2-4 tasks (auto-scale) |
| **RDS PostgreSQL** | Database (Multi-AZ) | db.t3.medium | db.r5.large |
| **ALB** | Load balancer | 1 | 1 |
| **ECR** | Container registry | Shared | Shared |
| **S3** | File storage | Separate bucket | Separate bucket |
| **Route 53** | DNS | Wildcard subdomain | Wildcard subdomain |
| **ACM** | SSL certificates | Wildcard cert | Wildcard cert |
| **Secrets Manager** | Credentials | Environment-specific | Environment-specific |
| **CloudWatch** | Logging & monitoring | Full | Full |

### Terraform Infrastructure (Simplified)

```hcl
# infrastructure/main.tf

provider "aws" {
  region = "us-east-1"
}

# Variables
variable "environment" {
  type = string
}

# VPC
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"

  name = "agencyboost-${var.environment}"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = var.environment == "staging"
}

# RDS PostgreSQL
module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "6.0.0"

  identifier = "agencyboost-${var.environment}"

  engine               = "postgres"
  engine_version       = "15"
  instance_class       = var.environment == "production" ? "db.r5.large" : "db.t3.medium"
  allocated_storage    = var.environment == "production" ? 100 : 20

  db_name  = "agencyboost_master"
  username = "agencyboost_admin"
  port     = 5432

  multi_az               = var.environment == "production"
  vpc_security_group_ids = [module.security_group_rds.security_group_id]
  subnet_ids             = module.vpc.private_subnets

  backup_retention_period = var.environment == "production" ? 30 : 7
  deletion_protection     = var.environment == "production"
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "agencyboost-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# ECS Service
resource "aws_ecs_service" "app" {
  name            = "agencyboost-${var.environment}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.environment == "production" ? 2 : 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = module.vpc.private_subnets
    security_groups = [module.security_group_ecs.security_group_id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "agencyboost"
    container_port   = 5000
  }
}

# Application Load Balancer
resource "aws_lb" "app" {
  name               = "agencyboost-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [module.security_group_alb.security_group_id]
  subnets            = module.vpc.public_subnets
}

# S3 Bucket for file storage
resource "aws_s3_bucket" "files" {
  bucket = "agencyboost-${var.environment}-files"
}

# Route 53 Wildcard DNS
resource "aws_route53_record" "wildcard" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.environment == "production" ? "*.app" : "*.staging"
  type    = "A"

  alias {
    name                   = aws_lb.app.dns_name
    zone_id                = aws_lb.app.zone_id
    evaluate_target_health = true
  }
}
```

---

## Database Strategy

### Database Provisioning for New Tenants

When a new tenant signs up:

```typescript
// server/lib/tenant-provisioning.ts

async function provisionTenant(tenantData: NewTenantInput): Promise<Tenant> {
  const tenantSlug = generateSlug(tenantData.companyName);
  const databaseName = `agencyboost_tenant_${tenantSlug}`;
  
  // 1. Create tenant database
  await masterDb.query(`CREATE DATABASE ${databaseName}`);
  
  // 2. Run migrations on new database
  const tenantDb = new Pool({
    host: process.env.RDS_HOST,
    database: databaseName,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
  
  await runMigrations(tenantDb);
  
  // 3. Create initial admin user
  await createInitialAdminUser(tenantDb, tenantData.adminEmail);
  
  // 4. Register tenant in master database
  const [tenant] = await masterDb.insert(tenants).values({
    name: tenantData.companyName,
    slug: tenantSlug,
    subdomain: tenantSlug,
    databaseName: databaseName,
    databaseHost: process.env.RDS_HOST,
    subscriptionPlan: tenantData.plan || 'trial',
  }).returning();
  
  // 5. Send welcome email
  await sendWelcomeEmail(tenantData.adminEmail, tenant);
  
  return tenant;
}
```

### Database Migrations Strategy

```
For Multi-Tenant Migrations:

1. Update migration files in /drizzle folder

2. Staging Deployment:
   - GitHub Action runs migrations on master DB
   - Separate job iterates all tenant DBs and runs migrations

3. Production Deployment:
   - Same process with production databases
   - Migrations run in parallel for speed
   - Failed migrations logged and retried
```

### Migration Script

```typescript
// scripts/migrate-all-tenants.ts

async function migrateAllTenants() {
  // Get all tenants from master database
  const allTenants = await masterDb.select().from(tenants);
  
  console.log(`Migrating ${allTenants.length} tenant databases...`);
  
  const results = await Promise.allSettled(
    allTenants.map(async (tenant) => {
      const tenantDb = new Pool({
        host: tenant.databaseHost,
        database: tenant.databaseName,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      });
      
      try {
        await runMigrations(tenantDb);
        console.log(`Migrated: ${tenant.slug}`);
        return { tenant: tenant.slug, success: true };
      } catch (error) {
        console.error(`Failed: ${tenant.slug}`, error);
        return { tenant: tenant.slug, success: false, error };
      } finally {
        await tenantDb.end();
      }
    })
  );
  
  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
  const failed = results.filter(r => r.status === 'rejected' || !r.value.success);
  
  console.log(`\nMigration complete: ${successful.length} succeeded, ${failed.length} failed`);
}
```

---

## Environment Configuration

### Environment Variables by Stage

| Variable | Replit (Dev) | AWS Staging | AWS Production |
|----------|--------------|-------------|----------------|
| `NODE_ENV` | development | staging | production |
| `DATABASE_URL` | Replit Postgres | RDS Staging | RDS Production |
| `MASTER_DB_URL` | Same as above | RDS Master Staging | RDS Master Prod |
| `AWS_REGION` | - | us-east-1 | us-east-1 |
| `S3_BUCKET` | Object Storage | staging-bucket | prod-bucket |
| `DOMAIN` | *.repl.co | *.staging.agencyboost.com | *.agencyboost.com |
| `GOOGLE_CLIENT_ID` | Dev credentials | Staging OAuth | Prod OAuth |
| `OPENAI_API_KEY` | Dev key | Staging key | Prod key |

### Secrets Management

```yaml
# AWS Secrets Manager Structure

/agencyboost/staging/database:
  host: staging-rds.xxxxx.us-east-1.rds.amazonaws.com
  port: 5432
  username: agencyboost_admin
  password: ********

/agencyboost/staging/google-oauth:
  client_id: xxxxxx.apps.googleusercontent.com
  client_secret: ********

/agencyboost/production/database:
  host: prod-rds.xxxxx.us-east-1.rds.amazonaws.com
  port: 5432
  username: agencyboost_admin
  password: ********

/agencyboost/production/google-oauth:
  client_id: xxxxxx.apps.googleusercontent.com
  client_secret: ********
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Set up GitHub repository with branch strategy
- [ ] Create Dockerfile and docker-compose for local testing
- [ ] Set up AWS account with proper IAM roles
- [ ] Create Terraform infrastructure code
- [ ] Deploy initial staging environment

### Phase 2: Multi-Tenancy Core (Week 3-4)
- [ ] Create master database schema
- [ ] Implement tenant middleware
- [ ] Build tenant connection manager
- [ ] Add tenant provisioning logic
- [ ] Update all existing queries to use tenant connection

### Phase 3: Master Admin (Week 5-6)
- [ ] Build master admin authentication
- [ ] Create tenant management dashboard
- [ ] Implement impersonation feature
- [ ] Add audit logging
- [ ] Build system analytics

### Phase 4: CI/CD Pipeline (Week 7)
- [ ] Set up GitHub Actions workflows
- [ ] Configure ECR for Docker images
- [ ] Set up ECS services for staging and production
- [ ] Implement database migration automation
- [ ] Add monitoring and alerting

### Phase 5: Testing & Launch (Week 8)
- [ ] End-to-end testing on staging
- [ ] Performance testing with multiple tenants
- [ ] Security audit
- [ ] Production deployment
- [ ] Documentation and training

---

## Security Considerations

### Data Isolation
- Each tenant has isolated database
- No cross-tenant queries possible at database level
- Tenant ID validated on every request

### Authentication
- Master admins have separate authentication system
- Tenant users authenticate within their tenant context
- JWT tokens include tenant ID claim

### Impersonation Security
- All impersonation sessions logged
- Impersonation expires after 1 hour
- Cannot impersonate other master admins
- Visual indicator always shown during impersonation

### Network Security
- RDS in private subnets only
- ECS tasks in private subnets
- ALB with WAF protection
- TLS 1.3 for all connections

### Compliance
- Database backups encrypted at rest
- All data encrypted in transit
- Audit logs retained for 1 year
- GDPR-ready tenant data export/deletion

---

## Cost Estimation (Monthly)

| Component | Staging | Production |
|-----------|---------|------------|
| ECS Fargate (2 vCPU, 4GB) | ~$70 | ~$140 (2 instances) |
| RDS PostgreSQL | ~$50 | ~$200 (Multi-AZ) |
| ALB | ~$20 | ~$20 |
| S3 + Transfer | ~$10 | ~$50 |
| Route 53 | ~$5 | ~$5 |
| Secrets Manager | ~$5 | ~$5 |
| CloudWatch | ~$20 | ~$30 |
| **Total** | **~$180/month** | **~$450/month** |

*Costs scale with number of tenants and usage*

---

## Next Steps

1. Review and approve this plan
2. Set up GitHub repository
3. Create AWS account and IAM roles
4. Begin Phase 1 implementation

---

*Document Version: 1.0*
*Last Updated: January 2026*

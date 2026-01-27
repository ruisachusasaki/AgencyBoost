# Sales Module Documentation

## Overview

The Sales module in AgencyBoost CRM is designed to help marketing agencies manage their entire sales process - from creating quotes and proposals to tracking performance and setting revenue targets. It provides tools for building quotes with products and bundles, monitoring sales team performance, and ensuring healthy profit margins.

## Navigation

**Main Location:** Sales (accessible from the sidebar navigation)
**URL:** `/sales`

**Related Settings:** Settings > Sales
**URL:** `/settings/sales`

---

## Module Structure

The Sales module is organized into three main tabs:

| Tab | Icon | Description |
|-----|------|-------------|
| **Quotes** | Quote icon | Create, manage, and track client quotes and proposals |
| **Sales Reports** | Chart icon | View pipeline analytics and sales rep performance |
| **Targets** | Target icon | Set and monitor monthly revenue goals |

---

## Feature Overview

### 1. Quotes Tab
Build professional quotes by combining products and bundles, set desired profit margins, and track quote status through the approval workflow.

**Key Features:**
- Quote Builder with products and bundles
- Automatic margin calculations
- Low margin alerts (configurable threshold)
- Status workflow (Draft → Pending → Approved → Sent → Accepted)
- Client and lead association
- Filtering, sorting, and pagination

📖 **Detailed Documentation:** [docs/sales/QUOTES.md](docs/sales/QUOTES.md)

---

### 2. Sales Reports Tab
Analyze sales performance with four comprehensive report types, each with customizable filters and date ranges.

**Report Types:**
- **Pipeline Report** - Deals by stage with value breakdown
- **Sales Reps Report** - Individual rep performance metrics
- **Opportunity Status Report** - Deals by status
- **Opportunity Value Report** - Revenue analysis

📖 **Detailed Documentation:** [docs/sales/REPORTS.md](docs/sales/REPORTS.md)

---

### 3. Targets Tab
Set monthly revenue targets and track progress toward sales goals.

**Key Features:**
- Create monthly targets by year/month
- Time period filtering (this year, quarter, month)
- Edit and delete existing targets
- Dashboard integration for progress tracking

📖 **Detailed Documentation:** [docs/sales/TARGETS.md](docs/sales/TARGETS.md)

---

## Related Areas

### Sales Settings
Configure sales-specific settings like minimum margin thresholds.

**Location:** Settings > Sales
**URL:** `/settings/sales`

📖 **Detailed Documentation:** [docs/sales/SETTINGS.md](docs/sales/SETTINGS.md)

---

### Pipeline & Deals
Manage deals through pipeline stages from initial contact to closed.

📖 **Detailed Documentation:** [docs/sales/PIPELINE-DEALS.md](docs/sales/PIPELINE-DEALS.md)

---

## Permissions Summary

The Sales module uses hierarchical permissions in the format `module.tab.action`. Here's a quick reference:

### Core Sales Permissions
| Permission Key | Description | Action Type |
|---------------|-------------|-------------|
| `sales.access` | Access the Sales section | view |
| `sales.quotes.view` | See all quotes | view |
| `sales.quotes.create` | Create new quotes | create |
| `sales.quotes.edit` | Modify existing quotes | edit |
| `sales.quotes.delete` | Remove quotes | delete |
| `sales.quotes.approve` | Approve quotes for sending | approve |
| `sales.quotes.send` | Send quotes to clients | manage |
| `sales.reports.view` | Access sales analytics | view |
| `sales.reports.export` | Download sales reports | export |

### Pipeline/Deals Permissions
| Permission Key | Description | Action Type |
|---------------|-------------|-------------|
| `sales.pipeline.view` | See deals in pipeline | view |
| `sales.pipeline.manage` | Move deals between stages | manage |
| `sales.deals.view` | Access deal details | view |
| `sales.deals.create` | Add new deals | create |
| `sales.deals.edit` | Modify deal information | edit |
| `sales.deals.delete` | Remove deals | delete |
| `sales.deals.close` | Mark deals as won/lost | manage |

### Settings Permissions
| Permission Key | Description | Action Type |
|---------------|-------------|-------------|
| `settings.sales.view` | See sales configuration | view |
| `settings.sales.manage` | Configure sales settings | manage |

### Reports Module Permissions
| Permission Key | Description | Action Type |
|---------------|-------------|-------------|
| `reports.sales.view` | Access sales analytics from Reports | view |
| `reports.sales.export` | Download sales data from Reports | export |

---

## Role-Based Access

| Feature | Admin | Manager | Accounting | User |
|---------|-------|---------|------------|------|
| View Quotes | ✅ | ✅ | ✅ | ✅ |
| Create Quotes | ✅ | ✅ | ❌ | ✅ |
| Approve Quotes | ✅ | ✅ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ✅ | ❌ |
| Export Reports | ✅ | ✅ | ✅ | ❌ |
| Manage Targets | ✅ | ✅ | ❌ | ❌ |
| Sales Settings | ✅ | ❌ | ❌ | ❌ |

---

## Quick Links

- [Quotes Documentation](docs/sales/QUOTES.md)
- [Reports Documentation](docs/sales/REPORTS.md)
- [Targets Documentation](docs/sales/TARGETS.md)
- [Settings Documentation](docs/sales/SETTINGS.md)
- [Pipeline & Deals Documentation](docs/sales/PIPELINE-DEALS.md)

---

## Related Documentation

- [Permissions Guide](PERMISSIONS-GUIDE.md) - How to add or modify permissions
- [Products & Bundles](docs/products/README.md) - Managing products used in quotes

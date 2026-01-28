# AgencyBoost Documentation

Welcome to the AgencyBoost CRM documentation. This folder contains all project documentation organized by category.

---

## Documentation Structure

```
docs/
├── README.md              ← You are here (master index)
├── modules/               ← Feature documentation by module
│   └── sales/             ← Sales module docs
├── guides/                ← How-to guides for users
├── qa/                    ← QA checklists and test plans
└── technical/             ← Technical specs and setup guides
```

---

## Modules

Feature documentation for each major area of the application.

### Sales Module
Complete documentation for the Sales features including quotes, reports, and targets.

| Document | Description |
|----------|-------------|
| [Sales Overview](modules/sales/README.md) | Main overview of the Sales module |
| [Quotes](modules/sales/QUOTES.md) | Quote creation, management, and approval workflow |
| [Reports](modules/sales/REPORTS.md) | Sales reports (Pipeline, Sales Reps, Opportunity Status/Value) |
| [Targets](modules/sales/TARGETS.md) | Monthly revenue targets setup and tracking |
| [Settings](modules/sales/SETTINGS.md) | Sales settings (minimum margin threshold) |
| [Pipeline & Deals](modules/sales/PIPELINE-DEALS.md) | Pipeline analytics and deal tracking |

---

## Guides

Step-by-step how-to guides for common tasks.

| Document | Description |
|----------|-------------|
| [Bulk Manage Roles & Permissions](guides/HOW-TO-BULK-MANAGE-ROLES-PERMISSIONS.md) | Export/import CSV to manage permissions in bulk |
| [Permissions Guide](guides/PERMISSIONS-GUIDE.md) | Understanding permissions, scenarios, and implementation |

---

## QA Checklists

Quality assurance test plans for each module.

| Document | Description |
|----------|-------------|
| [Sales QA Checklist](qa/Sales_QA_Items.md) | Complete QA test items for Sales module |

---

## Technical Documentation

Setup guides, architecture decisions, and deployment plans.

| Document | Description |
|----------|-------------|
| [Development Status](technical/AgencyBoost-Development-Status.md) | Current development status and roadmap |
| [Twilio VoIP Setup](technical/twilio-voip-setup.md) | Setting up Twilio for browser-based calling |
| [Multi-Tenant AWS Deployment](technical/MULTI_TENANT_AWS_DEPLOYMENT_PLAN.md) | AWS deployment architecture plan |

---

## Quick Reference

### For New Team Members
1. Start with [replit.md](../replit.md) for project overview
2. Review the [Permissions Guide](guides/PERMISSIONS-GUIDE.md) to understand access control
3. Explore module docs for features you'll work on

### For QA Testing
1. Use QA checklists in the `qa/` folder
2. Each module will have its own QA document
3. Log in with appropriate role accounts to test permissions

### For Adding New Features
1. Check [Permissions Guide](guides/PERMISSIONS-GUIDE.md) for how to add permissions
2. Document new features in `modules/[module-name]/`
3. Create QA checklist in `qa/`

---

## Documentation Standards

When adding new documentation:

1. **Module docs** go in `docs/modules/[module-name]/`
   - Each module folder should have a `README.md` as overview
   - Use UPPERCASE-WITH-DASHES.md for file names

2. **How-to guides** go in `docs/guides/`
   - Use `HOW-TO-[ACTION].md` naming convention
   - Write for non-technical users

3. **QA checklists** go in `docs/qa/`
   - Use `[Module]_QA_Items.md` naming convention
   - Include test tables with Pass/Fail columns

4. **Technical docs** go in `docs/technical/`
   - Setup guides, architecture, deployment plans
   - Can use technical language

---

## Keeping Docs Updated

- Update docs when features change
- Add QA items for new functionality
- Keep permission references current
- Date-stamp major updates

---

*Last updated: January 28, 2026*

# Pipeline & Deals - Detailed Documentation

## Overview

This document describes the Pipeline & Deals permissions and functionality in AgencyBoost CRM. Currently, pipeline functionality is primarily accessed through **Sales Reports** (Pipeline Report) and **Dashboard Widgets**, while deals are tracked as leads that progress to "won" status.

---

## Current Implementation

### Pipeline Report

The Pipeline Report (accessible via Sales > Reports > Pipeline Report) provides analytics on leads organized by pipeline stage. This is a **reporting view**, not a deal management interface.

**What It Shows:**
- Leads grouped by stage (e.g., New, Qualified, Proposal, Closed)
- Total value per stage
- Stage-by-stage conversion funnel
- Aggregated pipeline metrics

**Location:** Sales > Reports tab > Pipeline Report button

📖 See [Reports Documentation](REPORTS.md) for full details on the Pipeline Report.

---

### Dashboard Widgets

Several dashboard widgets provide pipeline-related visibility:

| Widget | Description |
|--------|-------------|
| **Sales Pipeline Overview** | Visual summary of pipeline stages and values |
| **Leads by Pipeline Stage** | Count of leads in each stage |
| **Recent Deals Won** | Latest leads closed as won |

---

### Leads as Deals

In the current system, **leads function as deals**. When a lead progresses through stages and is marked as "won," it's considered a closed deal. 

**Lead Stage Progression:**
- Leads move through pipeline stages
- Final stages include "Won" and "Lost"
- Won leads appear in deal-related reports and widgets

---

## Permissions Reference

The following permissions exist for pipeline and deal functionality:

### Pipeline Permissions

| Permission Key | Description | Current Usage |
|---------------|-------------|---------------|
| `sales.pipeline.view` | See deals in pipeline | Controls access to Pipeline Report, Targets tab |
| `sales.pipeline.manage` | Move deals between stages | Controls ability to manage sales targets |

### Deal Permissions

| Permission Key | Description | Status |
|---------------|-------------|--------|
| `sales.deals.view` | Access deal details | Reserved for future use |
| `sales.deals.create` | Add new deals | Reserved for future use |
| `sales.deals.edit` | Modify deal information | Reserved for future use |
| `sales.deals.delete` | Remove deals | Reserved for future use |
| `sales.deals.close` | Mark deals as won/lost | Reserved for future use |

**Note:** Deal-specific permissions are defined in the system for future functionality. Currently, lead management permissions control the equivalent actions.

---

## How to Track "Deals" Today

### Using Leads

1. **Create a lead** when a new sales opportunity arises
2. **Update the lead's stage** as it progresses (e.g., Qualified → Proposal → Negotiation)
3. **Mark as Won or Lost** when the opportunity closes
4. **View in Pipeline Report** to see all leads organized by stage

### Using Quotes

1. **Create a quote** for qualified leads/clients
2. **Track quote status** through approval workflow
3. **When accepted**, the quote represents a won deal

---

## Viewing Pipeline Data

### Pipeline Report

1. Go to **Sales** in the main navigation
2. Click the **Reports** tab
3. Select **Pipeline Report**
4. Use filters to narrow by date range, sales rep, or source

**What You'll See:**
- Funnel visualization of leads by stage
- Total pipeline value
- Number of leads
- Stage transitions

### Dashboard Widgets

Add pipeline widgets to your dashboard:
1. Go to **Dashboard**
2. Click **Add Widget**
3. Select from:
   - Sales Pipeline Overview
   - Leads by Pipeline Stage
   - Recent Deals Won

---

## Future Enhancements (Planned)

The deal permissions structure supports future dedicated deal management functionality:

### Planned Features
- **Deals as a separate entity** - Independent from leads
- **Deal CRUD operations** - Create, view, edit, delete deals
- **Drag-and-drop pipeline view** - Move deals between stages visually
- **Deal-specific fields** - Expected close date, probability, weighted value
- **Deal activities** - Track meetings, calls, emails per deal
- **Deal quotes association** - Link multiple quotes to a deal

**Note:** These features are not yet implemented. When they are built, the existing permissions will control access.

---

## Current Workflow Summary

```
[Lead Created] → [Stage: New]
       ↓
[Qualify Lead] → [Stage: Qualified]
       ↓
[Create Quote] → [Stage: Proposal Sent]
       ↓
[Negotiate] → [Stage: Negotiation]
       ↓
[Close Lead] → [Stage: Won] or [Stage: Lost]
       ↓
[Appears in] → Pipeline Report, Recent Deals Won Widget
```

---

## Related Features

- [Sales Reports](REPORTS.md) - Pipeline Report analytics
- [Quotes](QUOTES.md) - Proposals for opportunities
- [Targets](TARGETS.md) - Revenue goals (uses `sales.pipeline.manage` permission)
- [Leads](../leads/README.md) - Primary deal tracking mechanism

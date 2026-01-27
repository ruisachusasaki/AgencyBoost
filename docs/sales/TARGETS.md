# Sales Targets - Detailed Documentation

## Overview

Sales Targets allow you to set monthly revenue goals for your sales team. By defining targets, you can track progress toward your goals, measure performance, and stay accountable to your business objectives.

**Location:** Sales > Targets tab
**URL:** `/sales` (Targets tab)

---

## What It Does

The Targets feature helps you:
- Set monthly revenue targets by year and month
- Track actual revenue against goals
- Filter targets by time period
- Edit or remove targets as needed
- Integrate with dashboard widgets for progress tracking

---

## How It Works

### Target Structure

Each target consists of:
- **Year**: The calendar year (e.g., 2024, 2025)
- **Month**: The specific month (January through December)
- **Target Amount**: The revenue goal in dollars

### Dashboard Integration

When you set targets, they integrate with dashboard widgets like "Revenue This Month" to show:
- Current revenue achieved
- Progress toward the monthly target
- Percentage of goal reached

---

## What You Can Do

### View Targets List

The targets table displays:
- Year and month
- Target amount (formatted as currency)
- Action buttons (Edit, Delete)

**Note:** Targets are displayed with the most recent first.

---

### Filter Targets

Use the time period filter to focus on specific targets:

| Filter Option | Shows |
|--------------|-------|
| **All** | Every target ever created |
| **This Year** | All months in the current year |
| **Last Year** | All months in the previous year |
| **Next Year** | All months in the upcoming year |
| **This Quarter** | Current 3-month period |
| **Next Quarter** | Upcoming 3-month period |
| **This Month** | Only the current month's target |

---

### Create a New Target

1. Click the **"Add Target"** button
2. In the dialog that opens:
   - Select the **Year** from the dropdown
   - Select the **Month** from the dropdown
   - Enter the **Target Amount** (numbers only)
3. Click **"Save"** or **"Create Target"**

**Example:**
- Year: 2024
- Month: March
- Target Amount: $50,000

**Permission Required:** `sales.pipeline.manage` (or Sales Manager/Admin role)

---

### Edit an Existing Target

1. Find the target you want to modify
2. Click the **edit (pencil) icon**
3. Update any field:
   - Change the year or month
   - Adjust the target amount
4. Click **"Save"**

**Use Cases:**
- Adjusting goals based on new information
- Correcting data entry errors
- Updating forecasts

**Permission Required:** `sales.pipeline.manage`

---

### Delete a Target

1. Find the target you want to remove
2. Click the **delete (trash) icon**
3. Confirm the deletion

**Warning:** This action cannot be undone. Historical tracking data may be affected.

**Permission Required:** `sales.pipeline.manage`

---

## Target Time Periods Explained

### Quarterly Breakdown

| Quarter | Months |
|---------|--------|
| Q1 | January, February, March |
| Q2 | April, May, June |
| Q3 | July, August, September |
| Q4 | October, November, December |

### This Quarter vs Next Quarter

- **This Quarter**: The current 3-month period based on today's date
- **Next Quarter**: The upcoming 3-month period

**Example (if today is May 15):**
- This Quarter = Q2 (April, May, June)
- Next Quarter = Q3 (July, August, September)

---

## Year Selection

When creating targets, you can select years including:
- Previous year
- Current year
- Next year
- Future years (for long-term planning)

This allows you to plan ahead and set goals for upcoming periods.

---

## Target Amount Guidelines

### What to Include

Your target amount should represent:
- Total revenue expected for the month
- All sales channels combined
- Gross revenue (before expenses)

### Setting Realistic Targets

Consider:
1. **Historical performance** - What did you achieve in previous months?
2. **Seasonal trends** - Are certain months typically higher or lower?
3. **Growth goals** - What percentage increase are you aiming for?
4. **Team capacity** - Do you have the resources to hit the target?

### Example Target Setting

| Month | Last Year | Growth Goal (10%) | New Target |
|-------|-----------|-------------------|------------|
| January | $40,000 | +$4,000 | $44,000 |
| February | $42,000 | +$4,200 | $46,200 |
| March | $48,000 | +$4,800 | $52,800 |

---

## Who Can Manage Targets

### Roles with Access

| Role | View Targets | Create/Edit/Delete |
|------|--------------|-------------------|
| Admin | ✅ | ✅ |
| Sales Manager | ✅ | ✅ |
| Manager | ✅ | ✅ |
| Accounting | ✅ | ❌ |
| User | ✅ | ❌ |

### Permission Details

The `sales.pipeline.manage` permission controls the ability to:
- Create new targets
- Edit existing targets
- Delete targets

The `sales.pipeline.view` permission allows viewing targets without modifying them.

---

## Dashboard Widget Integration

### Revenue This Month Widget

When you have a target set for the current month, the "Revenue This Month" dashboard widget shows:

1. **Current Revenue**: Actual revenue achieved so far
2. **Target Amount**: The goal you set
3. **Progress Bar**: Visual indicator of completion
4. **Percentage**: How close you are to the goal

**Example Display:**
```
Revenue This Month
$32,500 / $50,000 (65%)
████████████░░░░░░░░
```

---

## Permissions Reference

| Action | Permission Key | Who Has It |
|--------|---------------|------------|
| View targets | `sales.pipeline.view` | All roles |
| Create targets | `sales.pipeline.manage` | Admin, Manager, Sales Manager |
| Edit targets | `sales.pipeline.manage` | Admin, Manager, Sales Manager |
| Delete targets | `sales.pipeline.manage` | Admin, Manager, Sales Manager |

---

## Tips & Best Practices

1. **Set annual targets first** - Plan all 12 months at the start of the year
2. **Review quarterly** - Adjust targets based on actual performance
3. **Be realistic** - Stretch goals are good, but unachievable targets demotivate
4. **Track weekly** - Don't wait until month-end to check progress
5. **Celebrate wins** - Acknowledge when targets are met or exceeded

---

## Common Questions

### Can I set the same target for multiple months?

You need to create each month's target individually. This allows for flexibility in setting different amounts for each month based on seasonality or business cycles.

### What happens if I don't set a target for a month?

The dashboard widget will show revenue without a progress indicator. Historical comparisons will have gaps for months without targets.

### Can I set targets for past months?

Yes, you can create targets for any month. This can be useful for:
- Backfilling historical goals for comparison
- Correcting missed entries

### Do targets affect other calculations?

Targets are primarily for reporting and dashboard display. They don't automatically affect quotes, deals, or other sales calculations.

---

## Related Features

- [Sales Reports](REPORTS.md) - Analyze actual performance
- [Dashboard Widgets](../dashboard/README.md) - View progress on your dashboard
- [Pipeline & Deals](PIPELINE-DEALS.md) - Track deals contributing to revenue

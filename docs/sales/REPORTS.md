# Sales Reports - Detailed Documentation

## Overview

Sales Reports provide comprehensive analytics to help you understand your sales performance. The reports section offers four different report types, each with customizable filters to drill down into specific time periods, sales representatives, or lead sources.

**Location:** Sales > Sales Reports tab
**URL:** `/sales` (Reports tab)

---

## What It Does

Sales Reports help you:
- Track deals through your sales pipeline
- Measure individual sales rep performance
- Analyze opportunity statuses and outcomes
- Understand revenue distribution and value
- Identify trends over time
- Export data for further analysis

---

## Report Types

### 1. Pipeline Report

Shows deals organized by pipeline stage with value breakdowns.

**What You'll See:**
- Visual chart of deals by stage
- Count of deals in each stage
- Total value per stage
- Percentage of total pipeline

**Use This To:**
- Identify bottlenecks in your sales process
- See where deals are getting stuck
- Forecast potential revenue
- Balance your pipeline stages

---

### 2. Sales Reps Report

Displays individual performance metrics for each sales team member.

**Metrics Tracked:**

| Metric | Description |
|--------|-------------|
| **Appointments** | Number of meetings scheduled |
| **Pitches** | Presentations or proposals delivered |
| **Closed Deals** | Successfully won deals |
| **Total Leads** | All leads assigned to the rep |
| **Close Rate** | Percentage of leads converted to deals |
| **Avg MRR** | Average Monthly Recurring Revenue per deal |
| **Total Value** | Sum of all closed deal values |

**Sorting Options:**
Click any column header to sort by that metric (ascending or descending).

**Use This To:**
- Compare rep performance
- Identify top performers
- Find coaching opportunities
- Set performance benchmarks

---

### 3. Opportunity Status Report

Breaks down deals by their current status.

**What You'll See:**
- Pie chart or bar chart of deal statuses
- Count per status
- Value per status
- Trends over the selected period

**Common Statuses:**
- New / Open
- Qualified
- Proposal Sent
- Negotiation
- Won
- Lost

**Use This To:**
- Understand win/loss ratios
- Track conversion rates
- Identify where deals fall off
- Measure sales cycle effectiveness

---

### 4. Opportunity Value Report

Analyzes the monetary value of opportunities.

**What You'll See:**
- Value distribution across stages
- Average deal size
- Total pipeline value
- Value by source or rep

**Use This To:**
- Understand revenue potential
- Identify high-value opportunities
- Forecast revenue
- Analyze deal size trends

---

## How It Works

### Filters

All reports share common filter options:

| Filter | Description | Default |
|--------|-------------|---------|
| **Date Range** | Start and end dates for the report | Year to date |
| **Sales Rep** | Filter by specific sales representative | All reps |
| **Lead Source** | Filter by how leads originated | All sources |

### Applying Filters

1. Use the date pickers to select your reporting period
2. Select a sales rep from the dropdown (or "All")
3. Select a lead source from the dropdown (or "All")
4. The report automatically refreshes with new data

### Switching Report Types

1. Use the report type selector
2. Choose: Pipeline, Sales Reps, Opportunity Status, or Opportunity Value
3. Your filters are preserved when switching

---

## What You Can Do

### View Pipeline Report

1. Select "Pipeline" from the report type dropdown
2. Set your date range
3. Optionally filter by rep or source
4. View the visual chart and data table

**Key Insights:**
- Which stages have the most deals
- Where value is concentrated
- Pipeline health at a glance

---

### View Sales Reps Report

1. Select "Sales Reps" from the report type dropdown
2. Set your date range
3. Optionally filter to a specific rep
4. View the performance table

**Sorting the Table:**
- Click any column header to sort
- Click again to reverse order
- Sort indicators show current sort direction

**Key Metrics to Watch:**
- Close rate (efficiency)
- Total value (revenue contribution)
- Avg MRR (deal quality)

---

### View Opportunity Status Report

1. Select "Opportunity Status" from the report type dropdown
2. Set your date range and filters
3. Analyze the status breakdown

**Key Insights:**
- How many deals are in each status
- Conversion rates between statuses
- Lost opportunity analysis

---

### View Opportunity Value Report

1. Select "Opportunity Value" from the report type dropdown
2. Set your date range and filters
3. Analyze value distribution

**Key Insights:**
- Total pipeline value
- Average deal sizes
- High-value opportunity tracking

---

### Export Reports

1. View any report type
2. Click the **"Export"** button
3. Download the data as CSV or Excel

**Permission Required:** `sales.reports.export`

---

## Date Range Options

### Quick Selections

| Option | Description |
|--------|-------------|
| Year to Date | January 1st of current year to today |
| Last 30 Days | Rolling 30-day window |
| Last Quarter | Previous 3-month period |
| This Quarter | Current 3-month period |
| Custom | Pick any start and end date |

### Date Picker

- Click the date field to open the calendar
- Select a date
- The report refreshes automatically

---

## Understanding the Metrics

### Close Rate

```
Close Rate = (Closed Won Deals / Total Leads) × 100
```

**Example:**
- Total Leads: 50
- Closed Won: 15
- Close Rate: 30%

### Average MRR

```
Avg MRR = Total Monthly Recurring Revenue / Number of Deals
```

**Example:**
- Total MRR from 10 deals: $25,000
- Avg MRR: $2,500

### Pipeline Value

```
Pipeline Value = Sum of all deal values in active stages
```

Only includes deals that haven't been won or lost.

---

## Permissions Reference

| Action | Permission Key | Who Has It |
|--------|---------------|------------|
| View reports | `sales.reports.view` | Admin, Manager, Accounting |
| Export reports | `sales.reports.export` | Admin, Manager, Accounting |

**Note:** Users without `sales.reports.view` permission will not see the Reports tab.

---

## Tips & Best Practices

1. **Regular reviews** - Check reports weekly to stay on top of pipeline health
2. **Compare periods** - Use date ranges to compare month-over-month or year-over-year
3. **Filter strategically** - Use rep filters for 1-on-1 reviews
4. **Export for presentations** - Download data for sales meetings
5. **Track trends** - Look for patterns in conversion rates over time

---

## Troubleshooting

### No Data Showing

1. Check your date range - it may be too narrow
2. Verify you have deals/leads in the system
3. Try removing filters to see all data

### Slow Loading

1. Large date ranges take longer to process
2. Try narrowing your date range
3. Remove unnecessary filters

### Unexpected Numbers

1. Verify date range includes the deals you expect
2. Check if filters are excluding data
3. Remember that pipeline reports only show active deals

---

## Related Features

- [Pipeline & Deals](PIPELINE-DEALS.md) - Manage the deals shown in reports
- [Targets](TARGETS.md) - Set goals to measure against
- [Dashboard Widgets](../dashboard/README.md) - Quick sales metrics on your dashboard

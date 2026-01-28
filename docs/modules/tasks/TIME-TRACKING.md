# Time Tracking

## Overview

AgencyBoost provides comprehensive time tracking for tasks, including a global timer, manual time entries, and timesheet views. This helps teams track billable hours, monitor productivity, and analyze time spent on projects.

---

## Key Features

- **Global Timer** - Persistent timer accessible from anywhere
- **Manual Time Entries** - Log time after the fact
- **Timesheet View** - Calendar-based time overview
- **Time Estimates** - Compare estimated vs actual time
- **Time Reports** - Analyze time by client, project, or user

---

## Global Timer

### Location

The global timer appears in the application header, always accessible regardless of which page you're viewing.

### Starting the Timer

1. Click the timer icon in the header
2. Select or search for a task
3. Click **Start**
4. Timer begins counting

**Quick Start from Task:**
1. Open any task detail page
2. Click the **Start Timer** button
3. Timer automatically links to that task

### Stopping the Timer

1. Click the timer in the header
2. Review the elapsed time
3. Click **Stop**
4. Time entry automatically saved to the task

### Timer Controls

| Control | Action |
|---------|--------|
| Start | Begin tracking time |
| Pause | Pause without stopping |
| Resume | Continue after pause |
| Stop | End tracking and save entry |
| Discard | Cancel without saving |

### Active Timer Indicator

When a timer is running:
- Timer icon shows elapsed time
- Subtle animation indicates active state
- Task name displayed (truncated)

---

## Manual Time Entry

### When to Use

- Forgot to start the timer
- Worked offline
- Retroactive time logging
- Adjusting previous entries

### Adding Manual Time

**From Task Detail:**
1. Open the task
2. Click **Add Time** button
3. Enter:
   - Date of work
   - Hours and/or minutes
   - Notes (optional)
4. Click **Save**

**From Timesheet:**
1. Open Timesheet view
2. Click on a date cell
3. Select task
4. Enter duration
5. Save

### Time Entry Fields

| Field | Description | Required |
|-------|-------------|----------|
| Date | When work was performed | Yes |
| Hours | Number of hours | No* |
| Minutes | Number of minutes | No* |
| Notes | Description of work done | No |
| Task | Associated task | Yes |

*At least hours or minutes required

---

## Timesheet View

### Accessing Timesheet

**Location:** Main navigation > Timesheet (or via Tasks dropdown)

### View Options

| View | Description |
|------|-------------|
| Day | Single day detailed view |
| Week | Weekly calendar grid |
| Month | Monthly overview |

### Timesheet Features

- **Color-coded entries** - By project or client
- **Total hours** - Daily and weekly totals
- **User filter** - View your time or all users (with permission)
- **Date navigation** - Move between periods
- **Click to edit** - Modify existing entries

### Editing Time Entries

**For Own Entries:**
1. Click on the time entry
2. Modify hours, minutes, or notes
3. Save changes

**For Other Users' Entries (Admin/Manager):**
1. Filter to show "All Users"
2. Find the entry to edit
3. Click to open edit modal
4. Pencil icon indicates editable cells
5. Make changes and save

---

## Time Estimates

### Setting Estimates

When creating or editing a task:
1. Find **Time Estimate** field
2. Enter estimated duration
3. Choose unit (minutes or hours)
4. Save

### Viewing Estimate vs Actual

On task detail page:
- **Time Estimate** - Original estimate
- **Time Tracked** - Actual logged time
- Visual indicator when over estimate

### Progress Indicators

| Status | Indicator |
|--------|-----------|
| Under estimate | Green progress bar |
| Near estimate (80-100%) | Yellow warning |
| Over estimate | Red, shows overage |

---

## Time Reports

### Available Reports

| Report | Description |
|--------|-------------|
| Time by Task | Hours per task |
| Time by Client | Hours per client |
| Time by Project | Hours per project |
| Time by User | Hours per team member |
| Time by Category | Hours per task category |

### Report Filters

- Date range
- Client
- Project
- Staff member
- Category

### Export Options

- CSV download
- PDF report (where available)

---

## Dashboard Widgets

Time-related dashboard widgets:

| Widget | Description |
|--------|-------------|
| My Time This Week | Personal time summary |
| Team Time Overview | Team-wide time stats |
| Overdue Time Entries | Tasks without recent time |

---

## Time Entry Rules

### Business Rules

- Time entries require a linked task
- Entries cannot be in the future
- Minimum entry: 1 minute
- Maximum single entry: 24 hours

### Approval Workflow (if enabled)

- Time entries may require manager approval
- Pending entries marked differently
- Approved entries locked from editing

---

## Permissions

### View Permissions

| Permission | Description |
|------------|-------------|
| `tasks.time_entries.view_own` | See your time entries |
| `tasks.time_entries.view_all` | See all time entries |

### Edit Permissions

| Permission | Description |
|------------|-------------|
| `tasks.time_entries.create` | Log new time entries |
| `tasks.time_entries.edit_own` | Modify your entries |
| `tasks.time_entries.edit_all` | Modify any entry |
| `tasks.time_entries.delete` | Delete time entries |

### Role-Based Access

| Role | Capabilities |
|------|--------------|
| User | View/edit own time |
| Manager | View team time, edit when needed |
| Admin | Full access to all time entries |

---

## Best Practices

### Accurate Tracking

- Start timer when beginning work
- Add notes for context
- Log time daily, don't batch
- Use estimates for planning

### For Managers

- Review team timesheets weekly
- Address under/over estimates
- Use reports for billing
- Monitor for burnout indicators

### Common Issues

**Timer Didn't Save:**
- Check internet connection
- Refresh and check timesheet
- Re-add manually if needed

**Wrong Task:**
- Edit the time entry
- Change associated task
- Move time if needed

---

*Last updated: January 28, 2026*

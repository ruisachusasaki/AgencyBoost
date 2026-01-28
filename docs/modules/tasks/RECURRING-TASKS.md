# Recurring Tasks

## Overview

Recurring tasks automatically create new task instances on a defined schedule. This is useful for regular maintenance, weekly reports, monthly reviews, and any work that happens on a predictable cycle.

---

## Key Features

- Multiple recurrence patterns (daily, weekly, monthly, yearly)
- Flexible day/date selection
- Automatic task creation
- End date or occurrence limits
- Template-based recurring tasks

---

## Creating Recurring Tasks

### From Task Form

1. Create a new task or edit existing
2. Find the **Recurrence** section
3. Toggle **Make Recurring** on
4. Configure recurrence pattern
5. Save the task

### Recurrence Settings

| Setting | Description |
|---------|-------------|
| Frequency | How often (daily, weekly, monthly, yearly) |
| Interval | Every X periods (every 1 week, every 2 months) |
| Days | Which days (for weekly: Mon, Wed, Fri) |
| Date | Which date (for monthly: 15th, last day) |
| End | When to stop (never, after X occurrences, on date) |

---

## Recurrence Patterns

### Daily

Create task every day or every X days.

| Setting | Example |
|---------|---------|
| Every 1 day | Daily task |
| Every 2 days | Every other day |
| Every 5 days | Every 5 days |

### Weekly

Create task on specific days each week.

| Setting | Example |
|---------|---------|
| Every week on Monday | Weekly Monday task |
| Every week on Mon, Wed, Fri | Three times per week |
| Every 2 weeks on Tuesday | Bi-weekly on Tuesday |

### Monthly

Create task on specific date or day of month.

| Setting | Example |
|---------|---------|
| Day 1 of every month | First of month |
| Day 15 of every month | Mid-month |
| Last day of every month | End of month |
| First Monday of every month | Relative day |
| Every 3 months on day 1 | Quarterly |

### Yearly

Create task on specific date each year.

| Setting | Example |
|---------|---------|
| January 1 every year | Annual task |
| Every 2 years on March 15 | Bi-annual |

---

## End Conditions

### Never End

Recurring task continues indefinitely until manually stopped.

### After X Occurrences

Task recurs a set number of times:
- After 10 occurrences
- After 52 occurrences (weekly for a year)

### On Specific Date

Task stops recurring after a certain date:
- End on December 31, 2026
- End after 6 months from now

---

## How Recurring Tasks Work

### Task Generation

1. System checks for due recurring tasks
2. New task instance created before due date
3. Original task remains as the "template"
4. Each instance is independent once created

### Task Instances

Each generated task:
- Has unique ID
- Links back to recurring template
- Can be edited independently
- Completion doesn't affect future instances

### Generation Timing

Tasks are typically generated:
- Day before the due date
- Or based on lead time setting
- Ensures assignee sees it in time

---

## Managing Recurring Tasks

### Viewing Recurring Tasks

In task list:
- Recurring icon indicates template tasks
- Filter by "Recurring" if available
- See all instances in timeline

### Editing the Series

To change all future occurrences:
1. Open the recurring template task
2. Edit recurrence settings
3. Save changes
4. Future tasks use new settings

**Note:** Already-created instances are not affected.

### Editing Single Instance

To change just one occurrence:
1. Open the specific task instance
2. Edit as normal
3. Changes only affect that instance

### Stopping Recurrence

To stop future tasks:
1. Open the recurring template
2. Disable recurrence or set end date
3. No new instances will be created

### Deleting Recurring Tasks

Options when deleting:
- **This instance only** - Delete single occurrence
- **This and all future** - Stop the series
- **All instances** - Delete entire series (if available)

---

## Recurring Task Best Practices

### When to Use

- Weekly team meetings
- Monthly reports
- Daily standups
- Quarterly reviews
- Annual renewals

### When Not to Use

- One-time tasks
- Unpredictable schedules
- Tasks that vary significantly each time

### Tips

- Set realistic due times
- Include clear instructions
- Assign to appropriate person
- Review and adjust periodically
- Use templates for complex recurring tasks

---

## Examples

### Weekly Status Report

```
Title: Weekly Status Report
Frequency: Weekly
Days: Friday
Time: 4:00 PM
Assignee: Team Lead
End: Never
```

### Monthly Invoice Review

```
Title: Review Monthly Invoices
Frequency: Monthly
Day: 5th of month
Assignee: Accounting
End: Never
```

### Quarterly Business Review

```
Title: Quarterly Business Review
Frequency: Monthly
Interval: Every 3 months
Day: First Monday
Assignee: Director
End: Never
```

---

## Permissions Required

| Action | Permission |
|--------|------------|
| Create recurring tasks | Task create permission |
| Edit recurrence | Task edit permission |
| Stop recurrence | Task edit permission |
| Delete series | Task delete permission |

---

*Last updated: January 28, 2026*

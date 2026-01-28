# Task Settings

## Overview

Task Settings allow administrators to customize the task system by configuring statuses, priorities, categories, team workflows, intake forms, and assignment rules.

---

## Accessing Task Settings

**Location:** Settings > Tasks

**Required Permission:** `settings.tasks.view` or `settings.tasks.manage`

---

## Settings Tabs

| Tab | Description |
|-----|-------------|
| Statuses | Configure task status options |
| Priorities | Configure priority levels |
| Categories | Organize tasks by type |
| Workflows | Team-specific workflows |
| Intake Forms | Task submission forms |
| Assignment Rules | Automatic task routing |

---

## Task Statuses

### Default Statuses

| Status | Color | Description |
|--------|-------|-------------|
| To Do | Gray | Task not started |
| In Progress | Blue | Work is underway |
| Review | Yellow | Awaiting review |
| Done | Green | Task completed |
| Cancelled | Red | Task cancelled |

### Creating a Status

1. Click **+ Add Status**
2. Enter:
   - **Name** - Display name
   - **Value** - Internal identifier
   - **Color** - Status color
   - **Description** - Optional explanation
3. Configure:
   - **Is Default** - Set as default for new tasks
   - **Is Active** - Show in dropdown options
4. Click **Save**

### Status Properties

| Property | Description |
|----------|-------------|
| Name | What users see |
| Value | System identifier (lowercase, no spaces) |
| Color | Visual indicator |
| Sort Order | Display order in lists |
| Is Default | Default for new tasks |
| Is Active | Available for selection |
| Is System | Cannot be deleted (core statuses) |

### Reordering Statuses

Drag and drop to reorder. Order affects:
- Dropdown menu display
- Kanban column order
- Filter option order

---

## Task Priorities

### Default Priorities

| Priority | Color | Icon |
|----------|-------|------|
| Low | Gray | Flag |
| Medium | Blue | Flag |
| High | Orange | Flag |
| Urgent | Red | Alert |

### Creating a Priority

1. Click **+ Add Priority**
2. Enter:
   - **Name** - Display name
   - **Value** - Internal identifier
   - **Color** - Priority color
   - **Icon** - Visual icon
3. Configure:
   - **Is Default** - Set as default for new tasks
   - **Is Active** - Show in dropdown
4. Click **Save**

### Available Icons

- Flag
- Alert Triangle
- Zap
- Star
- Clock
- Shield

---

## Task Categories

### Purpose

Categories help organize tasks by type or department:
- Development
- Design
- Marketing
- Content
- Support
- Administration

### Creating a Category

1. Click **+ Add Category**
2. Enter:
   - **Name** - Category name
   - **Description** - Optional explanation
   - **Color** - Category color
   - **Icon** - Visual indicator
3. Click **Save**

### Category Properties

| Property | Description |
|----------|-------------|
| Name | Display name |
| Description | Category purpose |
| Color | Visual indicator |
| Icon | Category icon |
| Is Active | Available for selection |

---

## Team Workflows

### What Are Workflows?

Workflows are team-specific task configurations that can include:
- Custom status sequences
- Default assignments
- Required fields
- Approval gates

### Creating a Workflow

1. Click **+ Add Workflow**
2. Enter:
   - **Name** - Workflow name
   - **Description** - Purpose
   - **Team** - Associated team/department
3. Configure workflow stages
4. Click **Save**

### Workflow Properties

| Property | Description |
|----------|-------------|
| Name | Workflow identifier |
| Description | Purpose explanation |
| Stages | Ordered status sequence |
| Default Assignee | Auto-assign to |
| Required Fields | Fields that must be filled |

---

## Intake Forms

See [Intake Forms](INTAKE-FORMS.md) for detailed documentation.

### Quick Overview

Intake forms provide structured task submission with:
- Section-based organization
- Multiple question types
- Conditional visibility
- Automatic assignment

**To manage:** Click the **Intake Forms** tab.

---

## Assignment Rules

See [Assignment Rules](ASSIGNMENT-RULES.md) for detailed documentation.

### Quick Overview

Assignment rules automatically route tasks based on:
- Form answers
- Category
- Priority
- Custom conditions

**To manage:** Click the **Assignment Rules** tab.

---

## Import/Export

### Exporting Settings

Export configurations for backup or migration:
1. Click **Export**
2. Select what to export:
   - Statuses
   - Priorities
   - Categories
   - Workflows
3. Download JSON file

### Importing Settings

Import from another system or restore backup:
1. Click **Import**
2. Upload JSON file
3. Review import preview
4. Confirm import

---

## Settings Best Practices

### Statuses

- Keep status list concise (5-7 max)
- Use consistent color coding
- Order reflects typical workflow
- Include "blocked" status if needed

### Priorities

- Limit to 3-5 levels
- Define clear criteria for each
- Ensure team understands urgency levels
- Use sparingly (not everything is urgent)

### Categories

- Align with team/department structure
- Keep list manageable
- Review and consolidate periodically
- Use for filtering and reporting

### Workflows

- Create only when needed
- Document workflow purpose
- Train team on workflow steps
- Review and update regularly

---

## Permissions

| Action | Permission |
|--------|------------|
| View settings | `settings.tasks.view` |
| Create/edit settings | `settings.tasks.manage` |
| Delete settings | `settings.tasks.manage` |
| Manage workflows | `settings.tasks.manage` |
| Manage intake forms | `settings.tasks.manage` |
| Manage assignment rules | `settings.tasks.manage` |

---

*Last updated: January 28, 2026*

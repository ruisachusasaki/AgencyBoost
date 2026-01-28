# Tasks List View

## Overview

The Tasks List view is the main interface for viewing and managing all tasks. It supports table and kanban views, advanced filtering, sorting, bulk actions, and smart lists for saved filters.

---

## Accessing Tasks

**Location:** Main navigation > Tasks

---

## View Modes

### Table View (Default)

Displays tasks in a configurable table with columns:

| Column | Description | Visibility |
|--------|-------------|------------|
| Task Name | Task title with expand/collapse for sub-tasks | Always visible |
| Assignee | Staff member assigned | Configurable |
| Start Date | Task start date | Configurable |
| Due Date | Task deadline | Configurable |
| Status | Current task status | Configurable |
| Priority | Priority level | Configurable |
| Category | Task category | Configurable |
| Tags | Applied tags | Configurable |
| Approval | Approval status | Configurable |
| Client/Lead | Associated client or lead | Configurable |
| Project | Associated project | Configurable |
| Time Estimate | Estimated duration | Configurable |
| Time Tracked | Actual time logged | Configurable |
| Created | Creation date | Configurable |

### Kanban View

Displays tasks as cards organized by status columns. Drag and drop cards between columns to update status.

---

## Column Configuration

Click the columns button to:
- Show/hide columns
- Drag to reorder columns
- Resize columns by dragging column borders
- Column preferences are saved per user

---

## Filtering

### Quick Filters

| Filter | Options |
|--------|---------|
| Search | Text search across task names |
| Status | Filter by task status |
| Assignee | Filter by assigned staff |
| Priority | Filter by priority level |
| Client | Filter by associated client |
| Category | Filter by task category |
| Workflow | Filter by team workflow |
| Time | All, This Week, Next Week, Overdue |

### Show/Hide Toggles

| Toggle | Description |
|--------|-------------|
| Show Completed | Include completed tasks in list |
| Show Cancelled | Include cancelled tasks in list |

### Smart Lists

Smart lists are saved filter combinations:

1. **Creating a Smart List:**
   - Apply desired filters
   - Click "Save as Smart List"
   - Enter name and description
   - Choose visibility (Personal, Shared, Universal)

2. **Visibility Options:**
   - **Personal** - Only you can see and use
   - **Shared** - Visible to selected team members
   - **Universal** - Visible to all users

3. **Managing Smart Lists:**
   - Click on a smart list tab to apply its filters
   - Edit or delete via the dropdown menu
   - Share with other users

---

## Sorting

Click any column header to sort:
- First click: Ascending order (A-Z, oldest first, etc.)
- Second click: Descending order (Z-A, newest first, etc.)
- Arrow indicator shows current sort direction

Sortable fields:
- Task Name
- Assignee
- Due Date
- Status
- Priority
- Client
- Created Date

---

## Task Actions

### Single Task Actions

Click the action menu (three dots) on any task row:

| Action | Description | Permission |
|--------|-------------|------------|
| View | Open task detail page | `tasks.own.view` or `tasks.all.view` |
| Edit | Open edit dialog | `tasks.own.edit` or `tasks.all.edit` |
| Delete | Delete the task | `tasks.own.delete` or `tasks.all.delete` |
| Duplicate | Create a copy of the task | `tasks.own.create` or `tasks.all.create` |

### Bulk Actions

Select multiple tasks using checkboxes:

| Action | Description | Permission |
|--------|-------------|------------|
| Change Status | Update status for all selected | Edit permission |
| Change Assignee | Reassign all selected tasks | Assign permission |
| Change Priority | Update priority for all | Edit permission |
| Delete | Delete all selected tasks | Delete permission |

**Selecting Tasks:**
- Click checkbox on individual rows
- Click header checkbox to select all visible
- Selection persists when scrolling

---

## Creating Tasks

### Quick Create

1. Click the **+ New Task** button
2. Fill in task details:
   - Title (required)
   - Description
   - Assignee
   - Due Date
   - Priority
   - Category
   - Tags
   - Client/Lead
   - Project
   - Time Estimate
3. Click **Create Task**

### Create from Template

1. Click dropdown arrow on **+ New Task** button
2. Select **From Template**
3. Choose a template
4. Modify pre-filled values as needed
5. Click **Create Task**

### Create via Intake Form

If intake forms are configured:
1. Click dropdown arrow on **+ New Task** button
2. Select **Submit Request**
3. Complete the intake form
4. Submit to create task with automatic assignment

---

## Expanding Sub-Tasks

Tasks with sub-tasks show an expand/collapse arrow:
- Click arrow to show nested sub-tasks
- Sub-tasks are indented to show hierarchy
- Expand state is preserved while browsing

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `N` | Open new task dialog |
| `S` | Focus search field |
| `Esc` | Close dialogs |

---

## Permissions Required

| Action | Permission |
|--------|------------|
| View all tasks | `tasks.all.view` |
| View own tasks | `tasks.own.view` |
| View team tasks | `tasks.team.view` |
| Create tasks | `tasks.own.create` or `tasks.all.create` |
| Edit tasks | `tasks.own.edit` or `tasks.all.edit` |
| Delete tasks | `tasks.own.delete` or `tasks.all.delete` |
| Assign to team | `tasks.team.assign` |

---

*Last updated: January 28, 2026*

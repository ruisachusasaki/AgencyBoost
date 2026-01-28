# Task Detail View

## Overview

The Task Detail view provides comprehensive access to all information about a single task, including editing capabilities, time tracking, comments, activities, and file attachments.

---

## Accessing Task Detail

- Click on any task name in the Tasks list
- Direct URL: `/tasks/:taskId`
- Click notification links related to tasks

---

## Page Layout

### Header Section

| Element | Description |
|---------|-------------|
| Back Button | Returns to Tasks list |
| Task Path | Breadcrumb showing parent task hierarchy |
| Task Title | Editable inline (click to edit) |
| Status Badge | Current status with color coding |
| Priority Badge | Current priority with icon |

### Action Buttons

| Button | Description | Permission |
|--------|-------------|------------|
| Edit | Open full edit dialog | Edit permission |
| Delete | Delete the task | Delete permission |
| Save as Template | Create template from task | `tasks.templates.manage` |
| Timer Controls | Start/stop time tracking | Time entry permission |

---

## Task Information Panel

### Basic Details

| Field | Description | Editable |
|-------|-------------|----------|
| Status | Current task status | Yes (dropdown) |
| Priority | Task priority level | Yes (dropdown) |
| Category | Task category | Yes (dropdown) |
| Tags | Applied tags | Yes (multi-select) |

### Assignment & Dates

| Field | Description | Editable |
|-------|-------------|----------|
| Assignee | Staff member assigned | Yes (dropdown) |
| Start Date | When work should begin | Yes (date picker) |
| Due Date | Task deadline | Yes (date picker) |
| Time Estimate | Expected duration | Yes (minutes/hours) |

### Associations

| Field | Description | Editable |
|-------|-------------|----------|
| Client | Associated client | Yes (dropdown) |
| Lead | Associated lead | Yes (dropdown) |
| Project | Associated project | Yes (dropdown) |
| Campaign | Associated campaign | Yes (dropdown) |

---

## Description Card

The description section shows:
- Rich text task description
- Auto-generated description from intake form (if applicable)
- Markdown formatting support

**Editing Description:**
1. Click the Edit icon on the description card
2. Use rich text editor to modify
3. Click Save to update

---

## Sub-Tasks Section

If the task has sub-tasks:
- List of all sub-tasks with status
- Click to expand and view sub-task details
- Add new sub-tasks directly
- Reorder via drag and drop

See [Sub-Tasks & Dependencies](SUB-TASKS.md) for details.

---

## Dependencies Section

Manage task dependencies:
- **Blocking** - Tasks that must complete before this one starts
- **Blocked By** - Tasks waiting on this task to complete

See [Sub-Tasks & Dependencies](SUB-TASKS.md) for details.

---

## Tabs Section

### Comments Tab

- View all task comments
- Add new comments with @mentions
- Reply to existing comments (threaded)
- Emoji reactions
- File attachments in comments
- Highlighted comment when navigating from notification

### Activities Tab

- Timeline of all task changes
- Status changes, assignments, edits
- Time entries logged
- System-generated activity log

### Attachments Tab

- Upload files to the task
- View attached documents and images
- Download or delete attachments
- Inline preview for images

### Intake Submission Tab (if applicable)

If task was created via intake form:
- View all submitted answers
- See form sections and responses
- Read-only view of original submission

---

## Time Tracking

### Global Timer

Use the persistent timer in the header:
1. Select this task as the active task
2. Click Start to begin tracking
3. Click Stop when done
4. Time entry automatically saved

### Manual Time Entry

1. Click "Add Time" button
2. Enter date, hours, minutes
3. Add optional notes
4. Click Save

### Viewing Time Entries

- Total time tracked shown in task details
- Individual entries visible in Activities tab
- Time vs estimate comparison

See [Time Tracking](TIME-TRACKING.md) for complete details.

---

## Status Workflow

### Changing Status

1. Click the Status dropdown in the task details
2. Select new status
3. Status updates immediately
4. Activity log records the change

### Status Transitions

Depending on configuration, some statuses may require:
- Approval before certain transitions
- Specific permissions to change to certain statuses
- Validation (e.g., can't mark complete if sub-tasks incomplete)

---

## Approval Workflow

If task requires approval:
- Approval status displayed: Pending, Approved, Rejected
- Approve/Reject buttons for authorized users
- Approval comments required for rejection
- Activity log tracks approval decisions

---

## Recording Links

For tasks that involve recordings (calls, meetings):
- **Fathom URL** field for meeting recordings
- Clickable link to open recording
- Display in task details

---

## Inline Editing

Many fields can be edited inline without opening the full edit dialog:
- Click on the field value
- Make changes
- Click outside or press Enter to save
- Changes save automatically

---

## Notifications

Task updates trigger notifications:
- Status changes notify assignee
- @mentions notify mentioned users
- Comment replies notify comment author
- Due date approaching sends reminders

---

## Permissions Required

| Action | Permission |
|--------|------------|
| View task | `tasks.own.view` or `tasks.all.view` |
| Edit task | `tasks.own.edit` or `tasks.all.edit` |
| Delete task | `tasks.own.delete` or `tasks.all.delete` |
| Add comments | `tasks.comments.create` |
| View comments | `tasks.comments.view` |
| Log time | `tasks.time_entries.create` |
| Manage templates | `tasks.templates.manage` |

---

*Last updated: January 28, 2026*

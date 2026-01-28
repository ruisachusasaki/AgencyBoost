# Tasks Module QA Checklist

This document provides a comprehensive checklist for QA specialists to verify all Tasks module functionality in AgencyBoost CRM.

**Test Account:** rui@themediaoptimizers.com (Admin role)
**Module Location:** Tasks (main navigation)
**Related Settings:** Settings > Tasks

---

## Pre-Test Setup

- [ ] Log in as Admin user
- [ ] Ensure test data exists (clients, staff, projects)
- [ ] Note the current task statuses, priorities, categories in Settings
- [ ] Clear any browser cache if needed

---

## 1. TASKS LIST VIEW

### 1.1 Tasks List General

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 1.1.1 | Tasks page loads | Click "Tasks" in main navigation | Tasks list displays | |
| 1.1.2 | Table view default | Open Tasks page | Table view shown with columns | |
| 1.1.3 | Columns display | View table | Name, Assignee, Due Date, Status, Priority, Category, Tags columns visible | |
| 1.1.4 | Task rows display | View with existing tasks | All tasks show with correct data | |
| 1.1.5 | Empty state | View with no tasks (if applicable) | Appropriate empty state message shown | |
| 1.1.6 | Status badges | View tasks with different statuses | Color-coded badges display correctly | |
| 1.1.7 | Priority indicators | View tasks with different priorities | Priority icons/colors display correctly | |

### 1.2 View Modes

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 1.2.1 | Switch to Kanban | Click Kanban view toggle | Kanban board displays with status columns | |
| 1.2.2 | Kanban columns | View Kanban board | Each status has its own column | |
| 1.2.3 | Drag card in Kanban | Drag task card to different column | Task status updates | |
| 1.2.4 | Switch to Table | Click Table view toggle | Table view displays | |
| 1.2.5 | View preference saved | Switch view, refresh page | Selected view persists | |

### 1.3 Column Configuration

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 1.3.1 | Open column config | Click columns button | Column configuration panel opens | |
| 1.3.2 | Hide column | Toggle off a visible column | Column hidden from table | |
| 1.3.3 | Show column | Toggle on a hidden column | Column appears in table | |
| 1.3.4 | Reorder columns | Drag column in config | Column order changes in table | |
| 1.3.5 | Resize column | Drag column border in table | Column width changes | |
| 1.3.6 | Preferences saved | Configure columns, refresh | Settings persist | |

### 1.4 Filtering

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 1.4.1 | Search by name | Enter task name in search | Only matching tasks displayed | |
| 1.4.2 | Filter by status | Select status from dropdown | Only tasks with selected status shown | |
| 1.4.3 | Filter by assignee | Select assignee from dropdown | Only tasks assigned to that person shown | |
| 1.4.4 | Filter by priority | Select priority from dropdown | Only tasks with selected priority shown | |
| 1.4.5 | Filter by client | Select client from dropdown | Only tasks for that client shown | |
| 1.4.6 | Filter by category | Select category from dropdown | Only tasks in that category shown | |
| 1.4.7 | Filter by workflow | Select workflow from dropdown | Only tasks in that workflow shown | |
| 1.4.8 | Time filter (This Week) | Select "This Week" | Only tasks due this week shown | |
| 1.4.9 | Show Completed toggle | Enable "Show Completed" | Completed tasks appear in list | |
| 1.4.10 | Show Cancelled toggle | Enable "Show Cancelled" | Cancelled tasks appear in list | |
| 1.4.11 | Combined filters | Apply multiple filters | Results match all criteria | |
| 1.4.12 | Clear filters | Remove all filters | All tasks displayed | |

### 1.5 Sorting

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 1.5.1 | Sort by name (A-Z) | Click Name column header | Tasks sorted alphabetically ascending | |
| 1.5.2 | Sort by name (Z-A) | Click Name column header again | Tasks sorted alphabetically descending | |
| 1.5.3 | Sort by assignee | Click Assignee column header | Tasks sorted by assignee name | |
| 1.5.4 | Sort by due date | Click Due Date column header | Tasks sorted by due date | |
| 1.5.5 | Sort by status | Click Status column header | Tasks sorted by status | |
| 1.5.6 | Sort by priority | Click Priority column header | Tasks sorted by priority | |
| 1.5.7 | Sort indicators | Apply any sort | Arrow/indicator shows direction | |

### 1.6 Bulk Actions

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 1.6.1 | Select single task | Click checkbox on task row | Task selected, checkbox checked | |
| 1.6.2 | Select multiple tasks | Click checkboxes on multiple rows | Multiple tasks selected | |
| 1.6.3 | Select all visible | Click header checkbox | All visible tasks selected | |
| 1.6.4 | Bulk action menu | Select tasks, find bulk action menu | Menu with options appears | |
| 1.6.5 | Bulk status change | Select tasks, change status | All selected tasks updated | |
| 1.6.6 | Bulk assignee change | Select tasks, change assignee | All selected tasks reassigned | |
| 1.6.7 | Bulk priority change | Select tasks, change priority | All selected tasks updated | |
| 1.6.8 | Bulk delete | Select tasks, click delete | Confirmation shown, tasks deleted on confirm | |
| 1.6.9 | Deselect all | Click header checkbox again | All tasks deselected | |

### 1.7 Smart Lists

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 1.7.1 | All Tasks tab | Click "All Tasks" tab | All tasks displayed | |
| 1.7.2 | My Tasks tab | Click "My Tasks" tab | Only assigned tasks shown | |
| 1.7.3 | Save smart list | Apply filters, click Save as Smart List | Save dialog opens | |
| 1.7.4 | Name smart list | Enter name and description | Fields accept input | |
| 1.7.5 | Create personal list | Save with Personal visibility | List appears in tabs | |
| 1.7.6 | Apply smart list | Click saved smart list tab | Filters applied automatically | |
| 1.7.7 | Edit smart list | Open smart list menu, click Edit | Can modify name/filters | |
| 1.7.8 | Share smart list | Change visibility to Shared | Can select users to share with | |
| 1.7.9 | Delete smart list | Click Delete on smart list | List removed after confirm | |

---

## 2. CREATE TASK

### 2.1 Task Creation Dialog

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 2.1.1 | Open create dialog | Click "+ New Task" button | Create task dialog opens | |
| 2.1.2 | Title required | Try to save without title | Validation error shown | |
| 2.1.3 | Enter title | Type task title | Field accepts input | |
| 2.1.4 | Enter description | Type in description field | Rich text editor works | |
| 2.1.5 | Select assignee | Choose from dropdown | Assignee selected | |
| 2.1.6 | Set start date | Pick date from calendar | Date selected | |
| 2.1.7 | Set due date | Pick date from calendar | Date selected | |
| 2.1.8 | Select priority | Choose from dropdown | Priority selected | |
| 2.1.9 | Select category | Choose from dropdown | Category selected | |
| 2.1.10 | Add tags | Select/create tags | Tags applied | |
| 2.1.11 | Select client | Choose from dropdown | Client associated | |
| 2.1.12 | Select project | Choose from dropdown | Project associated | |
| 2.1.13 | Set time estimate | Enter hours/minutes | Estimate saved | |
| 2.1.14 | Save task | Click Create Task | Task created, appears in list | |
| 2.1.15 | Cancel creation | Click Cancel/X | Dialog closes, no task created | |

### 2.2 Create from Template

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 2.2.1 | Open template menu | Click dropdown on "+ New Task" | Template options shown | |
| 2.2.2 | Select template | Choose a template | Form pre-filled with template values | |
| 2.2.3 | Modify pre-filled | Change a template value | Can override template defaults | |
| 2.2.4 | Create from template | Fill remaining fields, save | Task created with template data | |

### 2.3 Create via Intake Form

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 2.3.1 | Open intake form | Click "Submit Request" option | Intake form opens | |
| 2.3.2 | Complete required fields | Fill all required sections | Validation passes | |
| 2.3.3 | Conditional sections | Answer trigger question | Relevant sections appear/hide | |
| 2.3.4 | Submit form | Click Submit | Task created with form data | |
| 2.3.5 | Auto-assignment | Submit matching rule conditions | Task auto-assigned correctly | |

---

## 3. TASK DETAIL VIEW

### 3.1 Task Detail General

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 3.1.1 | Open task detail | Click task name in list | Task detail page opens | |
| 3.1.2 | Back button | Click back arrow | Returns to task list | |
| 3.1.3 | Task path shown | View parent task's child | Breadcrumb hierarchy displayed | |
| 3.1.4 | Title displayed | View task detail | Task title shown prominently | |
| 3.1.5 | Status badge | View task detail | Current status badge visible | |
| 3.1.6 | Priority badge | View task detail | Priority indicator visible | |

### 3.2 Inline Editing

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 3.2.1 | Edit title inline | Click on title | Title becomes editable | |
| 3.2.2 | Save title | Edit title, click away | Title saves automatically | |
| 3.2.3 | Change status | Click status dropdown | Status updates immediately | |
| 3.2.4 | Change priority | Click priority dropdown | Priority updates immediately | |
| 3.2.5 | Change assignee | Click assignee dropdown | Assignee updates | |
| 3.2.6 | Change due date | Click due date picker | Date updates | |
| 3.2.7 | Add/remove tags | Click tag selector | Tags update immediately | |

### 3.3 Description

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 3.3.1 | View description | Open task with description | Description card displays content | |
| 3.3.2 | Edit description | Click edit icon | Rich text editor opens | |
| 3.3.3 | Save description | Edit and save | Description updates | |
| 3.3.4 | Markdown rendering | View formatted description | Markdown renders correctly | |

### 3.4 Task Actions

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 3.4.1 | Edit button | Click Edit button | Full edit dialog opens | |
| 3.4.2 | Delete button | Click Delete button | Confirmation dialog appears | |
| 3.4.3 | Confirm delete | Click Delete in confirmation | Task deleted, redirects to list | |
| 3.4.4 | Save as template | Click Save as Template | Template creation dialog opens | |

---

## 4. SUB-TASKS

### 4.1 Sub-Task Display

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 4.1.1 | Expand parent task | Click expand arrow on parent | Sub-tasks revealed | |
| 4.1.2 | Sub-task indentation | View expanded parent | Sub-tasks indented correctly | |
| 4.1.3 | Sub-task count | View parent task | Shows sub-task count | |
| 4.1.4 | Collapse parent | Click arrow again | Sub-tasks hidden | |

### 4.2 Sub-Task Management

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 4.2.1 | Add sub-task button | Open parent task detail | "Add Sub-Task" button visible | |
| 4.2.2 | Create sub-task | Fill sub-task form | Sub-task created under parent | |
| 4.2.3 | Sub-task appears | After creation | Sub-task shows in list | |
| 4.2.4 | Task path on sub-task | Open sub-task detail | Path shows parent hierarchy | |
| 4.2.5 | Navigate to parent | Click parent in path | Parent task opens | |

### 4.3 Task Dependencies

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 4.3.1 | Dependencies section | Open task detail | Dependencies section visible | |
| 4.3.2 | Add blocking task | Click Add Dependency | Can search and add blocker | |
| 4.3.3 | Blocking indicator | View blocked task | Shows blocked status | |
| 4.3.4 | Remove dependency | Click remove on dependency | Dependency removed | |
| 4.3.5 | Circular prevention | Try to create circular dep | Error message shown | |

---

## 5. TIME TRACKING

### 5.1 Global Timer

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 5.1.1 | Timer visible | View header area | Timer icon/control visible | |
| 5.1.2 | Start timer | Select task, click Start | Timer begins counting | |
| 5.1.3 | Timer displays time | While running | Elapsed time shown | |
| 5.1.4 | Pause timer | Click Pause | Timer pauses, time preserved | |
| 5.1.5 | Resume timer | Click Resume | Timer continues | |
| 5.1.6 | Stop timer | Click Stop | Timer stops, entry saved | |
| 5.1.7 | Time entry created | After stopping | Entry appears on task | |

### 5.2 Manual Time Entry

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 5.2.1 | Add Time button | Open task detail | Add Time button visible | |
| 5.2.2 | Open time dialog | Click Add Time | Time entry dialog opens | |
| 5.2.3 | Enter date | Select date | Date accepted | |
| 5.2.4 | Enter hours | Type hours | Hours accepted | |
| 5.2.5 | Enter minutes | Type minutes | Minutes accepted | |
| 5.2.6 | Enter notes | Type description | Notes saved | |
| 5.2.7 | Save entry | Click Save | Entry created on task | |
| 5.2.8 | Time total updates | After adding | Task time tracked updates | |

### 5.3 Time Display

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 5.3.1 | Time tracked shown | View task with time | Total tracked time displayed | |
| 5.3.2 | Time estimate shown | View task with estimate | Estimate visible | |
| 5.3.3 | Over estimate warning | Track more than estimate | Visual indicator shown | |

---

## 6. COMMENTS

### 6.1 Comments Tab

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 6.1.1 | Comments tab visible | Open task detail | Comments tab in tabs | |
| 6.1.2 | View comments | Click Comments tab | Existing comments displayed | |
| 6.1.3 | Comment input | View Comments tab | Text input area visible | |

### 6.2 Adding Comments

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 6.2.1 | Type comment | Type in comment field | Text appears | |
| 6.2.2 | Submit comment | Click Post/Submit | Comment appears in thread | |
| 6.2.3 | @mention | Type @ and select user | Mention inserted | |
| 6.2.4 | Emoji picker | Click emoji button | Emoji picker opens | |
| 6.2.5 | Add emoji | Select emoji | Emoji added to comment | |

### 6.3 Comment Actions

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 6.3.1 | Edit own comment | Click edit on own comment | Can edit text | |
| 6.3.2 | Delete own comment | Click delete on own comment | Comment removed (with confirm) | |
| 6.3.3 | Reply to comment | Click reply | Reply input opens | |
| 6.3.4 | Threaded replies | Post reply | Reply shows nested | |

---

## 7. ATTACHMENTS

### 7.1 Attachments Tab

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 7.1.1 | Attachments tab | Open task detail | Attachments tab visible | |
| 7.1.2 | View attachments | Click Attachments tab | Existing files listed | |
| 7.1.3 | Upload button | View Attachments | Upload button visible | |

### 7.2 File Operations

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 7.2.1 | Upload file | Click upload, select file | File uploads | |
| 7.2.2 | File in list | After upload | File appears in attachments | |
| 7.2.3 | Download file | Click download on file | File downloads | |
| 7.2.4 | Preview image | Click image attachment | Preview opens | |
| 7.2.5 | Delete file | Click delete on file | File removed (with confirm) | |

---

## 8. TASK TEMPLATES

### 8.1 Template Management

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 8.1.1 | Access templates | Settings > Tasks > Templates | Templates list displays | |
| 8.1.2 | Create template | Click Add Template | Template form opens | |
| 8.1.3 | Fill template form | Enter name, priority, etc. | Fields accept input | |
| 8.1.4 | Save template | Click Save | Template appears in list | |
| 8.1.5 | Edit template | Click Edit on template | Edit form opens | |
| 8.1.6 | Delete template | Click Delete on template | Template removed (with confirm) | |

### 8.2 Save Task as Template

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 8.2.1 | Save as Template button | Open task detail | Button visible | |
| 8.2.2 | Open template dialog | Click Save as Template | Dialog opens | |
| 8.2.3 | Template from task | Enter name, save | Template created with task values | |

---

## 9. TASK SETTINGS

### 9.1 Settings Access

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 9.1.1 | Navigate to Settings | Click Settings in navigation | Settings page loads | |
| 9.1.2 | Find Tasks Settings | Look for Tasks in settings | Tasks settings link visible | |
| 9.1.3 | Open Tasks Settings | Click Tasks settings | Tasks settings page loads | |

### 9.2 Task Statuses

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 9.2.1 | Statuses tab | Click Statuses tab | Status list displayed | |
| 9.2.2 | Add status | Click Add Status | Status form opens | |
| 9.2.3 | Enter status name | Type name | Field accepts input | |
| 9.2.4 | Select color | Choose color | Color selected | |
| 9.2.5 | Save status | Click Save | Status appears in list | |
| 9.2.6 | Edit status | Click Edit on status | Edit form opens | |
| 9.2.7 | Delete status | Click Delete (non-system) | Status removed | |
| 9.2.8 | Reorder statuses | Drag and drop | Order changes | |

### 9.3 Task Priorities

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 9.3.1 | Priorities tab | Click Priorities tab | Priority list displayed | |
| 9.3.2 | Add priority | Click Add Priority | Priority form opens | |
| 9.3.3 | Configure priority | Fill name, color, icon | Fields accept input | |
| 9.3.4 | Save priority | Click Save | Priority appears in list | |
| 9.3.5 | Edit priority | Click Edit | Edit form opens | |
| 9.3.6 | Delete priority | Click Delete | Priority removed | |

### 9.4 Task Categories

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 9.4.1 | Categories tab | Click Categories tab | Category list displayed | |
| 9.4.2 | Add category | Click Add Category | Category form opens | |
| 9.4.3 | Configure category | Fill name, color, icon | Fields accept input | |
| 9.4.4 | Save category | Click Save | Category appears in list | |
| 9.4.5 | Edit category | Click Edit | Edit form opens | |
| 9.4.6 | Delete category | Click Delete | Category removed | |

---

## 10. INTAKE FORMS

### 10.1 Form Management

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 10.1.1 | Intake Forms tab | Click Intake Forms tab | Forms list displayed | |
| 10.1.2 | View form | Click on a form | Form editor opens | |
| 10.1.3 | Preview form | Click Preview | Form preview shows | |
| 10.1.4 | Add section | Click Add Section | New section created | |
| 10.1.5 | Add question | Click Add Question | Question form opens | |
| 10.1.6 | Configure question | Fill question settings | Settings saved | |
| 10.1.7 | Set visibility | Configure section visibility | Conditions saved | |

### 10.2 Assignment Rules

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 10.2.1 | Assignment Rules tab | Click Assignment Rules | Rules list displayed | |
| 10.2.2 | Add rule | Click Add Rule | Rule form opens | |
| 10.2.3 | Configure conditions | Add conditions | Conditions saved | |
| 10.2.4 | Set assignment | Choose staff/role | Assignment configured | |
| 10.2.5 | Save rule | Click Save | Rule appears in list | |
| 10.2.6 | Toggle enabled | Toggle rule on/off | Status changes | |
| 10.2.7 | Delete rule | Click Delete | Rule removed | |

---

## 11. PERMISSION TESTING

### 11.1 Admin Role

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 11.1.1 | Access Tasks module | Navigate to /tasks | Tasks page accessible | |
| 11.1.2 | View all tasks | View task list | All tasks visible | |
| 11.1.3 | Create task | Click New Task | Can create tasks | |
| 11.1.4 | Edit any task | Click edit on any task | Can edit | |
| 11.1.5 | Delete any task | Click delete on task | Can delete | |
| 11.1.6 | Manage templates | Settings > Tasks > Templates | Full access | |
| 11.1.7 | Manage settings | Settings > Tasks | Full access | |

### 11.2 User Role (Test with User account)

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 11.2.1 | Access Tasks | Navigate to /tasks | Tasks page accessible | |
| 11.2.2 | View own tasks | View My Tasks | Own tasks visible | |
| 11.2.3 | View all tasks | View All Tasks | Verify based on permissions | |
| 11.2.4 | Create task | Try to create | Verify based on permissions | |
| 11.2.5 | Edit own task | Try to edit own | Verify based on permissions | |
| 11.2.6 | Edit others' task | Try to edit others' | Verify based on permissions | |
| 11.2.7 | Access settings | Try Settings > Tasks | Verify based on permissions | |

---

## 12. DASHBOARD WIDGETS

### 12.1 Task Widgets

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 12.1.1 | My Tasks widget | Add widget to dashboard | Widget displays your tasks | |
| 12.1.2 | Tasks Due This Week | Add widget | Shows upcoming tasks | |
| 12.1.3 | Overdue Tasks | Add widget | Shows overdue tasks | |
| 12.1.4 | Task Completion Rate | Add widget | Shows completion metrics | |
| 12.1.5 | Tasks by Status | Add widget | Shows status distribution | |
| 12.1.6 | Widget data accuracy | Compare to Tasks page | Numbers match | |

---

## Notes for QA Testers

1. **Test Data:** Create several test tasks with various statuses, priorities, and assignments before testing.

2. **Permission Testing:** Test with different user roles to verify access control works correctly.

3. **Edge Cases to Test:**
   - Very long task names
   - Tasks without assignees
   - Tasks without due dates
   - Deep sub-task nesting (3+ levels)
   - Large number of comments/attachments

4. **Browser Testing:** Test on Chrome, Firefox, and Safari if possible.

5. **Mobile Responsiveness:** Test task list and detail views on mobile viewport.

---

*Last updated: January 28, 2026*

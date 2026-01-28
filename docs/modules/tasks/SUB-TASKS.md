# Sub-Tasks and Dependencies

## Overview

AgencyBoost supports hierarchical task structures through sub-tasks and cross-task dependencies. This allows breaking down complex work into manageable pieces and tracking relationships between tasks.

---

## Sub-Tasks

### What Are Sub-Tasks?

Sub-tasks are child tasks that belong to a parent task. They:
- Inherit the parent's client/project associations
- Can have their own status, assignee, and dates
- Contribute to the parent task's progress
- Can be nested multiple levels deep

### Creating Sub-Tasks

**From Task Detail View:**
1. Open the parent task
2. Scroll to the Sub-Tasks section
3. Click **Add Sub-Task**
4. Enter sub-task details:
   - Title
   - Assignee
   - Due Date
   - Priority
5. Click Create

**From Task List:**
1. Expand the parent task (click arrow)
2. Click **+ Add Sub-Task** below the parent
3. Enter details inline or in dialog

### Viewing Sub-Task Hierarchy

**Task Path:**
- Each task shows its full hierarchy as a breadcrumb
- Example: `Project Setup > Design Phase > Create Mockups`
- Click any parent in the path to navigate up

**Expanded View in List:**
- Parent tasks show expand/collapse arrow
- Sub-tasks appear indented below parent
- Visual indentation shows nesting level

### Sub-Task Progress

Parent tasks can show aggregate progress:
- Count of completed vs total sub-tasks
- Percentage completion
- Visual progress indicator

### Completing Parent Tasks

When marking a parent task complete:
- System checks if sub-tasks are complete
- Warning shown if incomplete sub-tasks exist
- Option to complete parent anyway
- Sub-tasks remain in their current state

---

## Task Dependencies

### What Are Dependencies?

Dependencies define relationships between tasks where one task must complete before another can start:

| Relationship | Description |
|--------------|-------------|
| Blocking | This task blocks other tasks from starting |
| Blocked By | This task cannot start until other tasks complete |

### Creating Dependencies

**From Task Detail View:**
1. Open the task
2. Find the Dependencies section
3. Click **Add Dependency**
4. Search for the related task
5. Select relationship type:
   - "This task blocks..."
   - "This task is blocked by..."
6. Click Add

### Viewing Dependencies

**On Task Detail:**
- Blocking section shows tasks waiting on this one
- Blocked By section shows tasks that must complete first

**In Task List:**
- Dependency icons indicate blocking relationships
- Tooltip shows which tasks are related

### Dependency Indicators

| Icon | Meaning |
|------|---------|
| Lock | Task is blocked by incomplete dependencies |
| Link | Task has dependencies (hover to see) |
| Warning | Dependency conflict or issue |

### Dependency Validation

The system validates dependencies to prevent:
- Circular dependencies (A blocks B, B blocks A)
- Self-references
- Duplicate dependencies

### Blocked Task Behavior

When a task is blocked:
- "Blocked" indicator appears
- Cannot be started until blockers complete
- Assignee notified when blockers complete
- Automatic status update option available

---

## Progress Calculation

### Sub-Task Based Progress

For parent tasks with sub-tasks:
```
Progress = (Completed Sub-Tasks / Total Sub-Tasks) × 100
```

### Status Considerations

- **Done/Completed** sub-tasks count toward progress
- **Cancelled** sub-tasks are excluded from calculation
- **In Progress** sub-tasks count as 0% complete

---

## Best Practices

### When to Use Sub-Tasks

- Breaking large tasks into phases
- Tracking multiple deliverables
- Parallel work by different team members
- Checklists within a task

### When to Use Dependencies

- Sequential workflow requirements
- Handoffs between team members
- Prerequisite tasks that must finish first
- Resource constraints

### Nesting Recommendations

- Limit nesting to 3-4 levels maximum
- Use clear, descriptive titles at each level
- Assign due dates that flow downward
- Set parent due date after all sub-task dates

---

## Permissions

| Action | Permission Required |
|--------|---------------------|
| View sub-tasks | Same as viewing the parent task |
| Create sub-tasks | `tasks.own.create` or `tasks.all.create` |
| Edit sub-tasks | Same as editing tasks |
| Manage dependencies | `tasks.own.edit` or `tasks.all.edit` |

---

*Last updated: January 28, 2026*

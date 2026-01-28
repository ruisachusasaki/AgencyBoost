# Tasks Module Documentation

## Overview

The Tasks module is the central hub for managing all task-related activities in AgencyBoost CRM. It provides comprehensive task management with features like hierarchical sub-tasks, dependencies, templates, intake forms, time tracking, and automation through assignment rules.

---

## Module Navigation

**Location:** Main navigation > Tasks

### Tabs and Views

| Tab/View | Description | Permission Required |
|----------|-------------|---------------------|
| All Tasks | View all tasks in the system | `tasks.all.view` |
| My Tasks | View tasks assigned to current user | `tasks.own.view` |
| Smart Lists | Custom filtered views | `tasks.own.view` |
| Templates | Task templates (under Projects section) | `tasks.templates.view` |

---

## Feature Documentation

| Document | Description |
|----------|-------------|
| [Tasks List](TASKS-LIST.md) | Task list view, filtering, sorting, and bulk actions |
| [Task Detail](TASK-DETAIL.md) | Single task view, editing, and status workflow |
| [Sub-Tasks & Dependencies](SUB-TASKS.md) | Hierarchical sub-tasks and task dependencies |
| [Templates](TEMPLATES.md) | Creating and using task templates |
| [Intake Forms](INTAKE-FORMS.md) | Task intake form builder and submission |
| [Assignment Rules](ASSIGNMENT-RULES.md) | Automatic task assignment configuration |
| [Time Tracking](TIME-TRACKING.md) | Time entries, timesheet view, and global timer |
| [Recurring Tasks](RECURRING-TASKS.md) | Setting up recurring task schedules |
| [Task Settings](SETTINGS.md) | Configuring statuses, priorities, categories, and workflows |

---

## Key Concepts

### Task Hierarchy

Tasks can have a hierarchical structure:
- **Parent Tasks** - Top-level tasks that can contain sub-tasks
- **Sub-Tasks** - Child tasks that belong to a parent task
- **Task Path** - Breadcrumb navigation showing the full hierarchy

### Task Statuses

Default statuses (configurable in Settings):
- **To Do** - Task not started
- **In Progress** - Task being worked on
- **Review** - Task awaiting review
- **Done** - Task completed
- **Cancelled** - Task cancelled

### Task Priorities

Default priorities (configurable in Settings):
- **Low** - Gray, low urgency
- **Medium** - Blue, normal priority
- **High** - Orange, needs attention
- **Urgent** - Red, immediate action required

### Task Categories

Categories help organize tasks by type (configurable in Settings):
- Development, Design, Marketing, Content, etc.
- Each category can have a color and icon

---

## Permissions Structure

The Tasks module uses hierarchical permissions:

### Own Tasks (`tasks.own.*`)
| Permission | Description |
|------------|-------------|
| `tasks.own.view` | View tasks assigned to you |
| `tasks.own.create` | Create tasks for yourself |
| `tasks.own.edit` | Edit your own tasks |
| `tasks.own.delete` | Delete your own tasks |

### Team Tasks (`tasks.team.*`)
| Permission | Description |
|------------|-------------|
| `tasks.team.view` | View tasks of team members |
| `tasks.team.assign` | Assign tasks to team members |

### All Tasks (`tasks.all.*`)
| Permission | Description |
|------------|-------------|
| `tasks.all.view` | View all tasks in the system |
| `tasks.all.create` | Create tasks for anyone |
| `tasks.all.edit` | Edit any task |
| `tasks.all.delete` | Delete any task |

### Comments (`tasks.comments.*`)
| Permission | Description |
|------------|-------------|
| `tasks.comments.view` | View task comments |
| `tasks.comments.create` | Add comments to tasks |
| `tasks.comments.edit` | Edit comments |
| `tasks.comments.delete` | Delete comments |

### Templates (`tasks.templates.*`)
| Permission | Description |
|------------|-------------|
| `tasks.templates.view` | View task templates |
| `tasks.templates.manage` | Create, edit, delete templates |

### Time Entries (`tasks.time_entries.*`)
| Permission | Description |
|------------|-------------|
| `tasks.time_entries.view_own` | View your time entries |
| `tasks.time_entries.view_all` | View all time entries |
| `tasks.time_entries.create` | Log time entries |
| `tasks.time_entries.edit_own` | Edit your time entries |
| `tasks.time_entries.edit_all` | Edit any time entry |
| `tasks.time_entries.delete` | Delete time entries |

---

## Related Settings

Navigate to **Settings > Tasks** to configure:
- Task Statuses - Create and manage status options
- Task Priorities - Configure priority levels
- Task Categories - Organize tasks by type
- Team Workflows - Define team-specific workflows
- Intake Forms - Build task submission forms
- Assignment Rules - Automate task routing

---

## Dashboard Widgets

Tasks-related widgets available for dashboards:

| Widget | Description |
|--------|-------------|
| My Tasks | List of tasks assigned to current user |
| Tasks Due This Week | Upcoming task deadlines |
| Overdue Tasks | Tasks past their due date |
| Task Completion Rate | Task completion metrics |
| Tasks by Status | Status distribution chart |
| Tasks Requiring Approval | Tasks pending approval |

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tasks` | GET | List all tasks (with filters) |
| `/api/tasks` | POST | Create new task |
| `/api/tasks/:id` | GET | Get single task |
| `/api/tasks/:id` | PUT | Update task |
| `/api/tasks/:id` | DELETE | Delete task |
| `/api/tasks/:id/sub-tasks` | GET | Get sub-tasks |
| `/api/task-templates` | GET/POST | Task templates |
| `/api/task-statuses` | GET/POST | Task statuses |
| `/api/task-priorities` | GET/POST | Task priorities |
| `/api/task-categories` | GET/POST | Task categories |
| `/api/task-intake-forms` | GET/POST | Intake forms |
| `/api/task-intake/assignment-rules` | GET/POST | Assignment rules |
| `/api/time-entries` | GET/POST | Time tracking entries |

---

*Last updated: January 28, 2026*

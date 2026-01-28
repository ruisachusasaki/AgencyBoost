# Task Templates

## Overview

Task Templates allow you to save commonly used task configurations for quick reuse. Templates pre-fill task details, reducing data entry and ensuring consistency across similar tasks.

---

## Accessing Templates

**Location:** Projects > Templates tab (or from any task creation dialog)

**Settings Location:** Settings > Tasks > Templates (for management)

---

## Template Structure

A template contains:

| Field | Description | Required |
|-------|-------------|----------|
| Name | Template name for identification | Yes |
| Description | What this template is for | No |
| Priority | Default priority level | No |
| Category | Default task category | No |
| Estimated Duration | Expected time to complete | No |
| Instructions | Detailed task instructions | No |

---

## Creating Templates

### From Settings

1. Navigate to **Settings > Tasks**
2. Click the **Templates** tab
3. Click **+ Add Template**
4. Fill in template details:
   - Template Name
   - Description
   - Default Priority
   - Default Category
   - Time Estimate
   - Instructions
5. Click **Save**

### From Existing Task

1. Open any completed or in-progress task
2. Click **Save as Template** button
3. Enter template name and description
4. Template inherits task's:
   - Priority
   - Category
   - Time estimate
   - Description/instructions
5. Click **Create Template**

---

## Using Templates

### When Creating a Task

1. Click **+ New Task** button
2. Click dropdown arrow and select **From Template**
3. Browse or search available templates
4. Select desired template
5. Task form pre-fills with template values
6. Modify any values as needed
7. Add task-specific details (assignee, dates, client)
8. Click **Create Task**

### Template Fields Applied

When using a template, these fields are pre-filled:
- Task Title (from template name, editable)
- Description
- Priority
- Category
- Time Estimate
- Instructions

---

## Managing Templates

### Editing Templates

1. Go to **Settings > Tasks > Templates**
2. Find the template in the list
3. Click the **Edit** icon
4. Modify template details
5. Click **Save**

**Note:** Editing a template does not affect tasks already created from it.

### Deleting Templates

1. Go to **Settings > Tasks > Templates**
2. Find the template to delete
3. Click the **Delete** icon
4. Confirm deletion

**Note:** Deleting a template does not affect existing tasks.

### Template List View

The template management view shows:
- Template name
- Description
- Default priority
- Category
- Time estimate
- Created date
- Actions (Edit, Delete)

---

## Template Best Practices

### When to Create Templates

- Recurring task types (weekly reports, monthly reviews)
- Standard procedures with consistent steps
- Onboarding or checklist tasks
- Common client requests

### Naming Conventions

Use clear, descriptive names:
- Good: "Client Monthly Report"
- Good: "New Employee Onboarding Checklist"
- Bad: "Report Template 1"
- Bad: "Task"

### Including Instructions

For complex tasks, include:
- Step-by-step process
- Links to resources
- Quality checklist
- Expected deliverables

---

## Templates vs Intake Forms

| Feature | Templates | Intake Forms |
|---------|-----------|--------------|
| Purpose | Quick task creation | Structured request submission |
| User | Staff creating tasks | Anyone submitting requests |
| Customization | Simple field defaults | Complex conditional forms |
| Assignment | Manual | Automatic via rules |
| Best For | Internal task creation | External or cross-team requests |

For intake forms, see [Intake Forms](INTAKE-FORMS.md).

---

## Permissions Required

| Action | Permission |
|--------|------------|
| View templates | `tasks.templates.view` |
| Create templates | `tasks.templates.manage` |
| Edit templates | `tasks.templates.manage` |
| Delete templates | `tasks.templates.manage` |
| Use templates | `tasks.own.create` or `tasks.all.create` |

---

*Last updated: January 28, 2026*

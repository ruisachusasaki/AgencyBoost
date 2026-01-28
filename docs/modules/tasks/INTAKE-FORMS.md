# Task Intake Forms

## Overview

Task Intake Forms provide a structured way for users to submit task requests. Forms can include conditional logic, multiple sections, and automatic task assignment based on answers. This is ideal for cross-team requests where the submitter doesn't need to know who should handle the work.

---

## Key Features

- **Section-based hierarchy** - Organize questions into logical sections
- **Conditional visibility** - Show/hide sections based on previous answers
- **Multiple question types** - Text, numbers, dates, dropdowns, multi-select
- **Automatic assignment** - Route tasks based on form answers
- **Description generation** - Auto-generate task descriptions from answers

---

## Accessing Intake Forms

**To Submit a Request:**
1. Click **+ New Task** dropdown
2. Select **Submit Request**
3. Complete the intake form
4. Submit

**To Manage Forms (Admin):**
1. Navigate to **Settings > Tasks**
2. Click **Intake Forms** tab

---

## Form Structure

### Sections

Forms are organized into sections:
- **Task Basics** - Core information (title, description, dates)
- **Department Selection** - Route to correct team
- **Department-Specific Sections** - Conditional sections based on department

### Questions

Each section contains questions with:
- Question text (what the user sees)
- Internal label (for reference in rules)
- Question type
- Help text (optional)
- Required flag
- Display order

### Question Types

| Type | Description | Use Case |
|------|-------------|----------|
| `single_choice` | Radio buttons, select one | Department selection |
| `multi_choice` | Checkboxes, select multiple | Features needed |
| `text` | Single line text input | Short answers |
| `textarea` | Multi-line text input | Descriptions |
| `number` | Numeric input | Quantities, budgets |
| `date` | Date picker | Deadlines |
| `client` | Client dropdown | Associate with client |
| `department` | Department dropdown | Team routing |
| `url` | URL input | Links, references |

---

## Conditional Visibility

Sections can be shown/hidden based on answers to trigger questions:

### Trigger Questions

Five special questions drive visibility:
1. **Department** - Creative, DevOps, Data
2. **Creative Type** - Design, Video, Content
3. **DevOps Type** - Development, Infrastructure
4. **Data Type** - Analytics, Reporting
5. **Priority Level** - Affects urgency sections

### Visibility Rules

Conditions can be:
- **Simple** - Single trigger question with required values
- **Complex** - Multiple rules with AND/OR logic

Example:
```
Show "Design Requirements" section when:
- department = "Creative" AND creative_type = "Design"
```

---

## Building Intake Forms

### Creating a Form

1. Go to **Settings > Tasks > Intake Forms**
2. Click **+ Create Form**
3. Enter form name and description
4. Click **Create**

### Adding Sections

1. Open the form editor
2. Click **+ Add Section**
3. Enter section name
4. Set visibility conditions (optional)
5. Drag to reorder sections

### Adding Questions

1. Open a section
2. Click **+ Add Question**
3. Configure:
   - Question text
   - Internal label (for rules)
   - Question type
   - Required (yes/no)
   - Help text
4. For choice questions, add options
5. Save

### Setting Visibility Conditions

1. Click on a section's settings
2. Select **Visibility Conditions**
3. Choose trigger question
4. Select required answer values
5. Add additional rules if needed
6. Set logic (AND/OR) for multiple rules

---

## Assignment Rules

Assignment rules automatically route tasks based on form answers.

### Rule Structure

| Field | Description |
|-------|-------------|
| Name | Rule identifier |
| Conditions | Answer-based criteria |
| Assign To | Staff member or role |
| Set Category | Auto-assign category |
| Set Tags | Auto-apply tags |
| Priority | Rule evaluation order |
| Enabled | Active/inactive toggle |

### Creating Assignment Rules

1. Go to **Settings > Tasks > Assignment Rules**
2. Click **+ Add Rule**
3. Configure:
   - Rule name
   - Conditions (question → answer matches)
   - Assignment (staff or role)
   - Category and tags (optional)
   - Priority (lower = evaluated first)
4. Enable the rule
5. Save

### Condition Operators

| Operator | Description |
|----------|-------------|
| equals | Exact match |
| contains | Partial match |
| in | One of multiple values |
| array | Multi-select matching |

### Catch-All Rules

Create a rule with empty conditions to catch requests that don't match other rules. Give it the highest priority number (evaluated last).

---

## Description Generation

Intake forms can auto-generate task descriptions from answers.

### Template Syntax

```markdown
## Request Details

**Department:** {{department}}
**Priority:** {{priority_level}}

{{#if creative_type}}
### Creative Request
- Type: {{creative_type}}
- {{creative_requirements}}
{{/if}}

{{#each selected_features}}
- {{this}}
{{/each}}
```

### Variables

Use `{{variable_name}}` where variable_name is the question's internal label.

### Conditionals

```
{{#if variable_name}}
Content shown if variable has value
{{/if}}
```

### Loops

```
{{#each multi_select_variable}}
- {{this}}
{{/each}}
```

---

## Submitting via Intake Form

### User Experience

1. User clicks **Submit Request**
2. Form displays with sections
3. Answering trigger questions reveals relevant sections
4. User completes all required fields
5. Click **Submit**
6. Task created with:
   - Answers in task description
   - Automatic assignment (if rules match)
   - Category and tags applied
   - Intake submission linked to task

### Viewing Submissions

On the task detail page:
1. Navigate to the **Intake Submission** tab
2. View all submitted answers
3. See original form sections and responses

---

## Current Form Statistics

Based on the default AgencyBoost intake form:
- **23 sections** covering Task Basics, Department Selection, and department-specific sub-sections
- **111 questions** across all sections
- **180 answer options** for choice questions
- **5 trigger questions** driving visibility logic

---

## Best Practices

### Form Design

- Keep forms concise - only ask what's needed
- Use conditional sections to reduce form length
- Provide clear help text
- Order sections logically

### Assignment Rules

- Start with specific rules, add general catch-all last
- Use priority numbers to control evaluation order
- Test rules with sample submissions
- Review unassigned tasks regularly

### Maintenance

- Review form analytics periodically
- Update rules when team structure changes
- Archive unused forms instead of deleting

---

## Permissions Required

| Action | Permission |
|--------|------------|
| Submit intake form | `tasks.own.create` |
| Create/edit forms | `settings.tasks.manage` |
| Create/edit rules | `settings.tasks.manage` |
| View submissions | View task permission |

---

*Last updated: January 28, 2026*

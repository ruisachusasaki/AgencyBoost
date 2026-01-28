# Task Assignment Rules

## Overview

Assignment Rules automatically route tasks to the right person or team based on intake form answers. This eliminates manual triage and ensures requests get to the correct handler immediately.

---

## How Assignment Rules Work

1. User submits a task via intake form
2. System evaluates assignment rules in priority order
3. First matching rule assigns the task
4. If no rules match, task remains unassigned or goes to catch-all

---

## Accessing Assignment Rules

**Location:** Settings > Tasks > Assignment Rules tab

---

## Rule Components

### Rule Properties

| Property | Description |
|----------|-------------|
| Name | Descriptive rule name |
| Priority | Evaluation order (lower = first) |
| Enabled | Active/inactive toggle |
| Conditions | Criteria that must match |
| Assignment | Who gets the task |
| Category | Auto-set category |
| Tags | Auto-apply tags |

### Conditions

Conditions match form answers:

```
When [Question] [Operator] [Value]
```

**Example Conditions:**
- Department equals "Creative"
- Project Type contains "Website"
- Priority Level in ["High", "Urgent"]

### Operators

| Operator | Description | Example |
|----------|-------------|---------|
| equals | Exact value match | department = "DevOps" |
| contains | Partial text match | description contains "urgent" |
| in | One of multiple values | type in ["Bug", "Feature"] |
| array | Multi-select matching | features includes "API" |

### Multiple Conditions

Rules can have multiple conditions with logic:
- **AND** - All conditions must match
- **OR** - Any condition must match

---

## Creating Assignment Rules

### Step 1: Open Rule Editor

1. Navigate to **Settings > Tasks**
2. Click **Assignment Rules** tab
3. Click **+ Add Rule**

### Step 2: Configure Basic Info

| Field | Action |
|-------|--------|
| Name | Enter descriptive name |
| Priority | Set number (lower = evaluated first) |
| Enabled | Toggle on |

### Step 3: Add Conditions

1. Click **Add Condition**
2. Select trigger question from dropdown
3. Choose operator
4. Select or enter value(s)
5. Repeat for additional conditions
6. Set logic (AND/OR) if multiple

### Step 4: Set Assignment

Choose one:
- **Assign to Staff** - Specific person
- **Assign to Role** - Position-based (first available with that role)

### Step 5: Set Auto-Apply Options

| Option | Description |
|--------|-------------|
| Category | Automatically set task category |
| Tags | Automatically apply tags |

### Step 6: Save

Click **Save Rule** to activate.

---

## Rule Priority and Evaluation

### Priority Numbers

- Lower numbers = evaluated first
- Recommended: 10, 20, 30... (allows inserting between)
- First matching rule wins

### Evaluation Order Example

```
Priority 10: If Department = "Sales" → Assign to Sales Manager
Priority 20: If Department = "Creative" AND Type = "Design" → Assign to Designer
Priority 30: If Department = "Creative" → Assign to Creative Director
Priority 100: (No conditions) → Assign to Admin (catch-all)
```

### Catch-All Rules

Create a rule with **no conditions** to catch unmatched requests:
- Set highest priority number (100+)
- Assign to a manager or queue
- Ensures no request goes unassigned

---

## Role-Based Assignment

Instead of assigning to a specific person, assign by role:

1. In assignment section, select **Assign to Role**
2. Choose the role (e.g., "Creative Director")
3. System finds staff with that role and assigns

**Benefits:**
- Handles staff changes automatically
- Distributes work by position
- No need to update rules when personnel change

---

## Testing Rules

### Manual Testing

1. Submit a test task via intake form
2. Check if assignment matches expectation
3. Review in task list

### Debugging Assignment

If a task is assigned incorrectly:
1. Open the task
2. Check intake submission answers
3. Review which rule should have matched
4. Verify rule conditions
5. Check rule priority order

---

## Managing Rules

### Editing Rules

1. Find rule in list
2. Click **Edit** icon
3. Modify settings
4. Save changes

### Enabling/Disabling

Toggle the **Enabled** switch without deleting the rule.

### Deleting Rules

1. Click **Delete** icon
2. Confirm deletion

**Note:** Deleting a rule doesn't affect already-assigned tasks.

### Reordering Priority

1. Edit the rule
2. Change priority number
3. Save

Or use drag-and-drop if available.

---

## Example Rules

### By Department

```
Rule: Route to Sales Team
Conditions: Department equals "Sales"
Assign to: Sales Manager
Priority: 10
```

### By Type and Priority

```
Rule: Urgent Bugs to Senior Dev
Conditions: 
  - Type equals "Bug" AND
  - Priority equals "Urgent"
Assign to: Senior Developer
Priority: 5
```

### Catch-All

```
Rule: Unmatched to Admin
Conditions: (none)
Assign to: Admin
Priority: 100
```

---

## Best Practices

### Rule Design

- Start specific, end general
- Use meaningful rule names
- Leave gaps in priority numbers (10, 20, 30...)
- Test rules after creation

### Maintenance

- Review unassigned tasks regularly
- Update rules when adding new intake options
- Archive or disable obsolete rules
- Document rule logic for team reference

### Performance

- Keep conditions simple
- Avoid overlapping conditions
- Use catch-all sparingly

---

## Permissions Required

| Action | Permission |
|--------|------------|
| View assignment rules | `settings.tasks.view` |
| Create/edit/delete rules | `settings.tasks.manage` |

---

*Last updated: January 28, 2026*

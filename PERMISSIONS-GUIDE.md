# AgencyBoost Permission System Guide

This document explains how the hierarchical permission system works and what to do when adding new features, actions, sub-pages, or modules.

## Permission System Overview

### Structure
AgencyBoost uses a hierarchical permission format with two patterns:

**Three-level (tab/section permissions):**
```
module.tab.action
```
Examples:
- `clients.list.view` - View the clients list
- `tasks.templates.manage` - Manage task templates
- `settings.staff.manage` - Manage staff settings

**Two-level (module-level permissions):**
```
module.action
```
Examples:
- `clients.access` - Access the clients module
- `settings.access` - Access settings page
- `calendar.view` - View calendar (module-level)

### Key Files
| File | Purpose |
|------|---------|
| `shared/permission-templates.ts` | Defines all available permissions with descriptions |
| `shared/role-templates.ts` | Default permissions for Admin, Manager, Accounting, User roles |
| `server/lib/roles-permissions-csv.ts` | CSV export structure for permissions |
| `shared/widget-permissions.ts` | Maps dashboard widgets to required permissions |

### Permission Enforcement Levels
1. **Module-level**: Route wrappers in `App.tsx` using `RequirePermission`
2. **Tab/section visibility**: `useHasPermissions` and `useRolePermissions` hooks
3. **Action-level**: `PermissionGate` component for buttons/actions

### Security Model
- **Default-deny**: Unknown permissions or widgets are denied by default
- **Admin bypass**: Admin role automatically has all permissions
- **OR logic**: Widget permissions use OR logic (any matching permission grants access)

---

## Scenario 1: Adding a New Action to an Existing Sub-Page

**Example**: Adding an "Export" button to the Clients List page

### What Happens
- The sub-page already exists with its base permission (e.g., `clients.list.view`)
- You need a new action permission (e.g., `clients.list.export`)

### Steps Required
1. Add the new permission key to `shared/permission-templates.ts` under the appropriate module/tab
2. **Important**: Use existing action types when possible: `view`, `create`, `edit`, `delete`, `export`, `import`, `manage`, `approve`. If you need a new action type, add it to the `PermissionAction` type definition in permission-templates.ts
3. Add the permission to appropriate roles in `shared/role-templates.ts`
4. Wrap the new action with `PermissionGate` or `useHasPermissions` check
5. (Optional) Add legacy key mapping in `PERMISSION_KEY_MIGRATION_MAP` if replacing old keys

### Prompt to Use
```
Add a new action "[ACTION_NAME]" to the [MODULE_NAME] > [SUB_PAGE_NAME] page.

This requires:
1. Adding permission key "[module].[tab].[action]" to permission-templates.ts
2. Adding the permission to Manager role (and others as appropriate) in role-templates.ts
3. Wrapping the action UI with PermissionGate component

The action should [DESCRIBE WHAT IT DOES].
```

---

## Scenario 2: Adding a New Feature Within a Module

**Example**: Adding a "Health Score Calculator" feature within the Clients module

### What Happens
- The module already exists with established permissions
- You're adding a new functional area (this becomes a new "tab" in the permission structure)
- New permissions may be needed for the feature

### Important Note
In this permission system, **features are modeled as tabs** in the `permission-templates.ts` structure. A "feature" gets its own entry in the module's `tabs` array, even if it doesn't have a separate navigation tab in the UI.

### Steps Required
1. Identify what permissions the feature needs (use existing action types: `view`, `manage`, `create`, `delete`, etc.)
2. Add a new tab entry in `permission-templates.ts` under the module's `tabs` array
3. Update role templates with appropriate access levels
4. Add route protection if the feature has its own page/section
5. Add widget permissions if the feature has dashboard widgets

### Prompt to Use
```
Add a new feature "[FEATURE_NAME]" to the [MODULE_NAME] module.

This feature will [DESCRIBE FUNCTIONALITY].

Model this as a new tab entry in permission-templates.ts:
- Tab name: [feature_name]
- Permissions: view, manage (add create/delete if needed)

Required permissions:
- [module].[feature_name].view - to see the feature
- [module].[feature_name].manage - to modify/configure it

Add these to:
1. permission-templates.ts - add a new tab entry under the [MODULE_NAME] module's tabs array
2. role-templates.ts for Manager and appropriate roles
3. Add route protection in App.tsx if it has its own page
4. Add widget permissions in widget-permissions.ts if it has dashboard widgets
```

---

## Scenario 3: Adding a New Sub-Page to a Module

**Example**: Adding a "Templates" sub-page under Tasks module

### What Happens
- The module exists with its top-level permissions
- You're adding a new navigable tab/section
- Need both view and manage permissions for the sub-page

### Steps Required
1. Add new tab entry in `shared/permission-templates.ts` under the module's `tabs` array
2. Include standard permissions: `view`, `manage` (and others like `create`, `delete` if needed)
3. Add permissions to role templates
4. Add route protection in `App.tsx`
5. Add tab visibility checks using `useHasPermissions`
6. Update CSV export structure if needed

### Prompt to Use
```
Add a new sub-page/tab "[TAB_NAME]" to the [MODULE_NAME] module.

This tab will [DESCRIBE PURPOSE AND CONTENTS].

Create permissions:
- [module].[tab].view - to see the tab
- [module].[tab].manage - to edit content in the tab
- [module].[tab].create - to create new items (if applicable)
- [module].[tab].delete - to delete items (if applicable)

Steps:
1. Add tab definition in permission-templates.ts under [MODULE_NAME] module
2. Add permissions to Manager role in role-templates.ts
3. Add RequirePermission wrapper in App.tsx for the route
4. Add tab visibility check in the module's navigation
5. Update roles-permissions-csv.ts if CSV export is needed
```

---

## Scenario 4: Adding a New Module

**Example**: Adding a new "Campaigns" module

### What Happens
- Creating an entirely new section of the application
- Need full permission structure: module access, tabs, and actions
- Need navigation, routes, and role assignments

### Steps Required
1. Design the permission hierarchy for the entire module
2. Add complete module definition in `shared/permission-templates.ts`
3. Add all permissions to role templates with appropriate access levels
4. Add route protection in `App.tsx` using `RequirePermission`
5. Add navigation items with permission checks
6. Add widget permissions for any dashboard widgets
7. Update CSV export structure
8. Add legacy key mappings if migrating from old permissions

### Prompt to Use
```
Add a new module "[MODULE_NAME]" to the AgencyBoost CRM.

This module will [DESCRIBE PURPOSE AND MAIN FUNCTIONALITY].

Module structure:
- Tabs/sub-pages: [LIST TABS - e.g., List, Templates, Settings]
- Key actions: [LIST ACTIONS - e.g., create, edit, delete, export]

Create the complete permission structure:
1. In permission-templates.ts:
   - Add module entry with modulePermissions for access
   - Add tabs array with all sub-pages and their permissions
   - Follow pattern: [module].[tab].[action]

2. In role-templates.ts:
   - Admin: all permissions (automatic)
   - Manager: view and manage all tabs
   - Accounting: view-only for financial-relevant tabs (if any)
   - User: basic view permissions

3. In App.tsx:
   - Add RequirePermission wrapper for module routes
   - Add navigation with permission checks

4. In widget-permissions.ts:
   - Map any dashboard widgets to their required permissions

5. In roles-permissions-csv.ts:
   - Add module to CSV export structure

Permission naming convention:
- [module].access - module-level access
- [module].[tab].view - view tab content
- [module].[tab].manage - edit/configure tab content
- [module].[tab].create - create new items
- [module].[tab].delete - delete items
- [module].[tab].export - export data
```

---

## Quick Reference: Permission Key Patterns

| Pattern | Use Case | Example |
|---------|----------|---------|
| `[module].access` | Module-level visibility | `campaigns.access` |
| `[module].[tab].view` | View tab/section | `tasks.templates.view` |
| `[module].[tab].manage` | Edit/configure | `settings.staff.manage` |
| `[module].[tab].create` | Create new items | `clients.list.create` |
| `[module].[tab].edit` | Edit existing items | `clients.list.edit` |
| `[module].[tab].delete` | Delete items | `leads.list.delete` |
| `[module].[tab].export` | Export data | `reports.sales.export` |
| `[module].[tab].import` | Import data | `clients.list.import` |
| `[module].[tab].approve` | Approve items | `clients.assets.approve` |

## Available Action Types

The permission system uses these standard action types. **Reuse these whenever possible** instead of creating new ones:

| Action | Description |
|--------|-------------|
| `view` | Read-only access to see content |
| `create` | Create new items |
| `edit` | Modify existing items |
| `delete` | Remove items |
| `manage` | Full control (often combines edit + advanced config) |
| `export` | Export data to files |
| `import` | Import data from files |
| `approve` | Approve items in workflows |

If you need a new action type, add it to the `PermissionAction` type in `shared/permission-templates.ts`.

## Role Permission Hierarchy

| Role | Typical Access Level |
|------|---------------------|
| **Admin** | All permissions (automatic bypass) |
| **Manager** | View + Manage for most features, team oversight |
| **Accounting** | View-only for financial features, full access to financial modules |
| **User** | Basic view permissions, limited actions |

## Backward Compatibility

When changing permission keys:
1. Keep old keys working via `PERMISSION_KEY_MIGRATION_MAP`
2. Map old key → new key in the migration map
3. Both formats will work during transition period
4. Document the change in this guide

---

## Common Mistakes to Avoid

1. **Forgetting role templates**: Always add new permissions to appropriate roles
2. **Missing route protection**: Every new page needs `RequirePermission` wrapper
3. **Inconsistent naming**: Follow `module.tab.action` pattern strictly
4. **Hardcoding role checks**: Use permission checks, not `role === 'Admin'`
5. **Skipping widget permissions**: Dashboard widgets need permission mappings
6. **Breaking backward compatibility**: Use migration map for key changes

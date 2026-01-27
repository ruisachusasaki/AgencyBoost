# How to Bulk Manage Roles & Permissions

This guide shows you how to quickly update permissions for all your roles at once using a simple spreadsheet.

---

## What You Can Do

- **Change permissions** for any role (turn them ON or OFF)
- **Create new roles** by adding a new column
- **Update multiple roles** all at once

## What You Cannot Do

- Add new permissions (the system has a fixed list)
- Delete permissions
- Rename permissions
- Delete existing roles through this process

---

## Step-by-Step Guide

### Step 1: Export Your Current Permissions

1. Go to **Settings** in the main menu
2. Click **Roles & Permissions**
3. Click the **Export** button (usually at the top right)
4. A file called something like `permissions.csv` will download to your computer

**What you'll get:** A spreadsheet file that opens in Excel, Google Sheets, or Numbers.

---

### Step 2: Open the File

Open the downloaded file in your preferred spreadsheet program:
- **Microsoft Excel** - Double-click the file
- **Google Sheets** - Upload to Google Drive, then open with Sheets
- **Apple Numbers** - Double-click the file

You'll see something like this:

| Permission | Admin | Manager | User | Accounting |
|------------|-------|---------|------|------------|
| clients.list.view | TRUE | TRUE | TRUE | TRUE |
| clients.list.create | TRUE | TRUE | FALSE | FALSE |
| clients.list.edit | TRUE | TRUE | FALSE | FALSE |
| clients.list.delete | TRUE | FALSE | FALSE | FALSE |
| sales.quotes.view | TRUE | TRUE | TRUE | TRUE |
| sales.quotes.create | TRUE | TRUE | FALSE | FALSE |
| ... | ... | ... | ... | ... |

**The first column** lists every permission in the system.
**Each additional column** represents a role.
**TRUE** means the role HAS that permission.
**FALSE** means the role does NOT have that permission.

---

### Step 3: Make Your Changes

#### To Change a Permission:

Simply change **TRUE** to **FALSE** (to remove access) or **FALSE** to **TRUE** (to grant access).

**Example:** To give the "User" role permission to create clients:
- Find the row: `clients.list.create`
- Find the "User" column
- Change `FALSE` to `TRUE`

#### To Create a New Role:

1. Add a new column after the last role column
2. Type the role name in the header (first row)
3. Fill in `TRUE` or `FALSE` for each permission

**Example:** Adding a "Sales Team" role:

| Permission | Admin | Manager | User | Accounting | Sales Team |
|------------|-------|---------|------|------------|------------|
| clients.list.view | TRUE | TRUE | TRUE | TRUE | TRUE |
| clients.list.create | TRUE | TRUE | FALSE | FALSE | TRUE |
| sales.quotes.view | TRUE | TRUE | TRUE | TRUE | TRUE |
| sales.quotes.create | TRUE | TRUE | FALSE | FALSE | TRUE |

---

### Step 4: Save Your File

**Important:** Save the file as a CSV file, not as an Excel file (.xlsx).

**In Excel:**
1. File > Save As
2. Choose "CSV (Comma delimited)" from the format dropdown
3. Click Save
4. If asked about keeping the format, click "Yes" or "Keep CSV"

**In Google Sheets:**
1. File > Download
2. Select "Comma-separated values (.csv)"

**In Numbers:**
1. File > Export To > CSV
2. Click Save

---

### Step 5: Upload Your Updated File

1. Go back to **Settings** > **Roles & Permissions**
2. Click the **Import** button
3. Select your updated CSV file
4. Click **Upload** or **Import**

The system will:
- Update all permission settings based on your file
- Create any new roles you added
- Show you a confirmation when complete

---

## Important Rules

### Do NOT Change the Permission Names

The first column contains system permission names. These must stay exactly as they are.

**Wrong:**
| Permission |
|------------|
| View Clients | ← Changed from "clients.list.view"

**Correct:**
| Permission |
|------------|
| clients.list.view | ← Keep exactly as exported

### Do NOT Delete Rows

Every permission in the export must remain in your file. If you delete a row, the import will fail.

### Do NOT Add New Permission Rows

You cannot create new permissions. The system only recognizes the permissions that were exported.

### Use Only TRUE or FALSE

Each cell under a role must contain either `TRUE` or `FALSE` (not yes/no, not 1/0).

---

## Troubleshooting

### "Import failed" or "Invalid file" error

**Check these things:**
- Did you save as CSV format (not Excel .xlsx)?
- Did you accidentally delete or rename any permissions?
- Did you use TRUE/FALSE (not Yes/No or 1/0)?
- Did you accidentally add extra rows at the bottom?

### "Permission not found" error

You may have accidentally changed a permission name in the first column. Re-export a fresh file and start again.

### Changes didn't apply

- Refresh the page after importing
- Log out and log back in
- Check that you uploaded the correct file

### New role didn't appear

- Make sure the role name is in the header row (row 1)
- Make sure the column has TRUE or FALSE values (not blank)

---

## Quick Reference

| I want to... | What to do |
|--------------|------------|
| Give a role more access | Change FALSE to TRUE for that permission |
| Remove access from a role | Change TRUE to FALSE for that permission |
| Create a new role | Add a new column with the role name as header |
| Copy permissions from one role to another | Copy the entire column, paste into new column, change header name |
| See all permissions for a role | Look down that role's column - TRUE = has access |

---

## Tips for Success

1. **Make a backup first** - Before uploading, keep a copy of the original export file

2. **Work in small batches** - If making many changes, do a few at a time and test

3. **Test after importing** - Log in as a user with the changed role to verify the changes work

4. **Use Find & Replace carefully** - If using Find & Replace, make sure you don't accidentally change permission names

5. **Keep it simple** - When creating new roles, start with all FALSE and only add the permissions you need

---

## Need Help?

If you're unsure about a permission, hover over it in the Settings > Roles & Permissions page - many permissions have descriptions explaining what they control.

If you make a mistake, you can always:
1. Export a fresh copy
2. Make your changes again
3. Re-import

Your previous settings will be overwritten with whatever is in your uploaded file.

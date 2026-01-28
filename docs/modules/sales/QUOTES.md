# Quotes - Detailed Documentation

## Overview

The Quotes feature allows you to create professional proposals for clients by combining products and service bundles. Each quote calculates costs automatically, tracks profit margins, and follows a status workflow from creation to acceptance.

**Location:** Sales > Quotes tab
**URL:** `/sales` (Quotes tab)

---

## What It Does

The Quotes system helps you:
- Build itemized quotes with products and bundles
- Calculate total costs and profit margins automatically
- Track quotes through approval and sending workflows
- Associate quotes with clients or leads
- Identify low-margin quotes that need attention
- Manage the full quote lifecycle

---

## How It Works

### Quote Builder

When you create a new quote, you use the Quote Builder dialog which guides you through:

1. **Basic Information**
   - Quote name (required)
   - Select a client OR lead to associate the quote with
   - Enter the client's budget
   - Set your desired profit margin percentage
   - Add optional notes/description

2. **Add Products & Bundles**
   - Search and add individual products
   - Add pre-configured bundles (groups of products)
   - Set quantities for each item
   - For bundles, customize quantities of individual items within

3. **Margin Calculations**
   The system automatically calculates:
   - **Total Cost**: Sum of all product costs × quantities
   - **Profit**: Client budget minus total cost
   - **Actual Margin**: (Profit ÷ Budget) × 100
   - **Target Revenue**: Cost ÷ (1 - Desired Margin%)

4. **Margin Alerts**
   - Quotes below the minimum margin threshold are highlighted
   - The threshold is configurable in Settings > Sales
   - Default minimum margin is 35%

---

## Quote Statuses

Quotes progress through the following statuses:

| Status | Description | What Happens Next |
|--------|-------------|-------------------|
| **Draft** | Quote is being created/edited | Submit for approval |
| **Pending Approval** | Waiting for manager review | Approve or reject |
| **Approved** | Ready to send to client | Send to client |
| **Rejected** | Not approved | Edit and resubmit |
| **Sent** | Delivered to client | Await response |
| **Accepted** | Client agreed to quote | Convert to project |

### Status Workflow Diagram

```
[Draft] → [Pending Approval] → [Approved] → [Sent] → [Accepted]
                    ↓
               [Rejected] → (Edit) → [Draft]
```

---

## What You Can Do

### View Quotes List

The quotes table displays all quotes with:
- Quote name
- Associated client name
- Creation date
- Total cost
- Desired margin percentage
- Current status (with color-coded badges)
- Action buttons (View, Edit, Delete)

**Low Margin Indicator:** Quotes below the minimum margin threshold show a warning icon and are highlighted.

### Filtering Options

| Filter | Options |
|--------|---------|
| **Search** | Search by quote name |
| **Status** | All, Draft, Pending, Approved, Rejected, Sent, Accepted |
| **Client** | Filter by specific client |
| **Created By** | Filter by the user who created the quote |
| **Date Range** | From date / To date |
| **Low Margin Only** | Toggle to show only quotes below threshold |

### Sorting

Click column headers to sort by:
- Quote name (A-Z, Z-A)
- Client name
- Created date (newest/oldest)
- Total cost (highest/lowest)
- Desired margin
- Status

### Pagination

- Choose page size: 10, 20, 50, or 100 items per page
- Navigate between pages

---

## Available Actions

### Creating a Quote

1. Click **"New Quote"** button
2. Fill in the Quote Builder form:
   - Enter quote name
   - Select client or lead
   - Set budget and desired margin
   - Add products/bundles with quantities
3. Review the calculated margins
4. Click **"Create Quote"**

**Permission Required:** `sales.quotes.create`

---

### Viewing a Quote

1. Click the **eye icon** on any quote row
2. View full quote details including:
   - All line items with costs
   - Margin calculations
   - Associated client/lead info
   - Notes and description

**Permission Required:** `sales.quotes.view`

---

### Editing a Quote

1. Click the **edit (pencil) icon** on any quote row
2. Modify any fields in the Quote Builder
3. Click **"Update Quote"**

**Note:** You can only edit quotes in Draft or Rejected status.

**Permission Required:** `sales.quotes.edit`

---

### Deleting a Quote

1. Click the **delete (trash) icon** on any quote row
2. Confirm the deletion in the dialog

**Note:** This action cannot be undone.

**Permission Required:** `sales.quotes.delete`

---

### Approving a Quote

1. Find a quote with "Pending Approval" status
2. Click **"Approve"** in the actions menu
3. Quote status changes to "Approved"

**Permission Required:** `sales.quotes.approve`

---

### Sending a Quote

1. Find an approved quote
2. Click **"Send"** in the actions menu
3. Quote status changes to "Sent"

**Permission Required:** `sales.quotes.send`

---

## Margin Calculations Explained

### How Margin is Calculated

```
Revenue = Client Budget
Profit = Revenue - Total Cost
Actual Margin = (Profit / Revenue) × 100
```

**Example:**
- Client Budget: $10,000
- Total Cost of Products: $6,000
- Profit: $10,000 - $6,000 = $4,000
- Actual Margin: ($4,000 / $10,000) × 100 = 40%

### Target Revenue

If you want to achieve a specific margin, the system calculates what the client budget should be:

```
Target Revenue = Total Cost / (1 - Desired Margin / 100)
```

**Example:**
- Total Cost: $6,000
- Desired Margin: 40%
- Target Revenue: $6,000 / (1 - 0.40) = $10,000

### Minimum Margin Threshold

- Configured in Settings > Sales
- Default: 35%
- Quotes below this threshold are flagged with warnings
- Helps identify potentially unprofitable deals

---

## Products and Bundles

### Individual Products

Products are single items with:
- Name and description
- Cost (your internal cost)
- Category

When added to a quote, you specify:
- Which product
- Quantity needed

### Bundles

Bundles are pre-configured groups of products that are commonly sold together. When you add a bundle:
- All products in the bundle are included
- You can customize quantities of individual items within the bundle
- The total bundle cost is calculated from component products

---

## Permissions Reference

| Action | Permission Key | Who Has It |
|--------|---------------|------------|
| View quotes | `sales.quotes.view` | All roles |
| Create quotes | `sales.quotes.create` | Admin, Manager, User |
| Edit quotes | `sales.quotes.edit` | Admin, Manager, User |
| Delete quotes | `sales.quotes.delete` | Admin, Manager |
| Approve quotes | `sales.quotes.approve` | Admin, Manager |
| Send quotes | `sales.quotes.send` | Admin, Manager |

---

## Tips & Best Practices

1. **Set realistic margins** - Use the minimum margin threshold to prevent unprofitable quotes
2. **Use bundles** - Create bundles for commonly sold service packages to speed up quote creation
3. **Review before sending** - Always verify calculations before sending to clients
4. **Track status** - Use the status workflow to know exactly where each quote stands
5. **Filter low margin** - Regularly review low-margin quotes to identify pricing issues

---

## Related Features

- [Products & Bundles](../products/README.md) - Configure products used in quotes
- [Sales Settings](SETTINGS.md) - Set minimum margin threshold
- [Clients](../clients/README.md) - Client management
- [Leads](../leads/README.md) - Lead management

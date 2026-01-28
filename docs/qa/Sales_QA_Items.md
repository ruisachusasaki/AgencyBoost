# Sales Module QA Checklist

This document provides a comprehensive checklist for QA specialists to verify all Sales module functionality in AgencyBoost CRM.

**Test Account:** rui@themediaoptimizers.com (Admin role)
**Module Location:** Sales (main navigation)
**Related Settings:** Settings > Sales

---

## Pre-Test Setup

- [ ] Log in as Admin user
- [ ] Ensure test data exists (clients, leads, products, bundles)
- [ ] Note the current minimum margin threshold in Settings > Sales
- [ ] Clear any browser cache if needed

---

## 1. QUOTES TAB

### 1.1 Quotes List View

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 1.1.1 | Quotes tab loads | Click "Quotes" tab in Sales | Quotes table displays with columns: Name, Client, Date, Cost, Margin, Status, Actions | |
| 1.1.2 | Empty state | View with no quotes | Appropriate empty state message shown | |
| 1.1.3 | Quotes display | View with existing quotes | All quotes show with correct data | |
| 1.1.4 | Low margin indicator | Find/create quote below threshold | Warning icon and highlight shown on low-margin quotes | |
| 1.1.5 | Status badges | View quotes with different statuses | Color-coded badges for Draft, Pending, Approved, Rejected, Sent, Accepted | |

### 1.2 Quotes Filtering

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 1.2.1 | Search by name | Enter quote name in search field | Only matching quotes displayed | |
| 1.2.2 | Filter by status | Select status from dropdown | Only quotes with selected status shown | |
| 1.2.3 | Filter by client | Select client from dropdown | Only quotes for selected client shown | |
| 1.2.4 | Filter by creator | Select user from "Created By" dropdown | Only quotes created by selected user shown | |
| 1.2.5 | Date range filter (From) | Set start date | Only quotes from that date onward shown | |
| 1.2.6 | Date range filter (To) | Set end date | Only quotes up to that date shown | |
| 1.2.7 | Low margin only toggle | Enable "Low Margin Only" filter | Only quotes below margin threshold shown | |
| 1.2.8 | Combined filters | Apply multiple filters | Results match all filter criteria | |
| 1.2.9 | Clear filters | Remove all filters | All quotes displayed again | |

### 1.3 Quotes Sorting

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 1.3.1 | Sort by name (A-Z) | Click Name column header | Quotes sorted alphabetically ascending | |
| 1.3.2 | Sort by name (Z-A) | Click Name column header again | Quotes sorted alphabetically descending | |
| 1.3.3 | Sort by client | Click Client column header | Quotes sorted by client name | |
| 1.3.4 | Sort by date (newest) | Click Date column header | Newest quotes first | |
| 1.3.5 | Sort by date (oldest) | Click Date column header again | Oldest quotes first | |
| 1.3.6 | Sort by cost | Click Cost column header | Quotes sorted by total cost | |
| 1.3.7 | Sort by margin | Click Margin column header | Quotes sorted by margin percentage | |
| 1.3.8 | Sort by status | Click Status column header | Quotes sorted by status | |
| 1.3.9 | Sort indicators | Apply any sort | Arrow/indicator shows current sort direction | |

### 1.4 Quotes Pagination

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 1.4.1 | Page size 10 | Select 10 from page size dropdown | Maximum 10 quotes per page | |
| 1.4.2 | Page size 20 | Select 20 from page size dropdown | Maximum 20 quotes per page | |
| 1.4.3 | Page size 50 | Select 50 from page size dropdown | Maximum 50 quotes per page | |
| 1.4.4 | Page size 100 | Select 100 from page size dropdown | Maximum 100 quotes per page | |
| 1.4.5 | Next page | Click next page button | Next set of quotes displayed | |
| 1.4.6 | Previous page | Click previous page button | Previous set of quotes displayed | |
| 1.4.7 | Page indicator | Navigate pages | Current page number updates correctly | |

### 1.5 Create Quote

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 1.5.1 | Open Quote Builder | Click "New Quote" button | Quote Builder dialog opens | |
| 1.5.2 | Quote name required | Try to save without name | Validation error shown | |
| 1.5.3 | Enter quote name | Type quote name | Field accepts input | |
| 1.5.4 | Select client | Choose client from dropdown | Client associated with quote | |
| 1.5.5 | Select lead (alternative) | Choose lead from dropdown | Lead associated with quote | |
| 1.5.6 | Enter budget | Type budget amount | Field accepts numeric input | |
| 1.5.7 | Enter desired margin | Type margin percentage | Field accepts numeric input | |
| 1.5.8 | Add description | Type in description field | Text saved to quote | |
| 1.5.9 | Add product | Click "Add Product", select product | Product added to line items | |
| 1.5.10 | Add bundle | Click "Add Bundle", select bundle | Bundle added to line items | |
| 1.5.11 | Set quantity | Change quantity for item | Quantity updates, cost recalculates | |
| 1.5.12 | Bundle custom quantities | Expand bundle, change item quantities | Individual item quantities update | |
| 1.5.13 | Remove item | Click remove/X on line item | Item removed from quote | |
| 1.5.14 | Product search | Type in product search field | Products filtered by search term | |
| 1.5.15 | Save quote | Click "Create Quote" | Quote created, appears in list | |
| 1.5.16 | Cancel creation | Click Cancel/X | Dialog closes, no quote created | |

### 1.6 Margin Calculations

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 1.6.1 | Total cost calculation | Add products with quantities | Total cost = sum of (product cost × quantity) | |
| 1.6.2 | Profit calculation | Set budget and add products | Profit = Budget - Total Cost | |
| 1.6.3 | Actual margin calculation | Set budget and add products | Margin = (Profit / Budget) × 100 | |
| 1.6.4 | Target revenue display | Set desired margin | Shows what budget should be for that margin | |
| 1.6.5 | Margin valid indicator | Create quote above threshold | Shows margin is acceptable (green/check) | |
| 1.6.6 | Margin warning | Create quote below threshold | Shows warning indicator (red/alert) | |
| 1.6.7 | Real-time updates | Change budget or products | Calculations update immediately | |
| 1.6.8 | Bundle cost calculation | Add bundle | Bundle cost = sum of constituent product costs | |

### 1.7 View Quote

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 1.7.1 | Open view dialog | Click eye/view icon on quote row | View dialog opens | |
| 1.7.2 | Quote details display | View any quote | Name, client, budget, margin shown | |
| 1.7.3 | Line items display | View quote with products | All products/bundles listed with costs | |
| 1.7.4 | Margin calculations shown | View any quote | Total cost, profit, margin displayed | |
| 1.7.5 | Notes display | View quote with notes | Description/notes shown | |
| 1.7.6 | Close view | Click Close/X | Dialog closes | |

### 1.8 Edit Quote

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 1.8.1 | Open edit dialog | Click edit/pencil icon on quote | Edit dialog opens with quote data | |
| 1.8.2 | Pre-populated fields | Open edit for existing quote | All fields show current values | |
| 1.8.3 | Edit name | Change quote name | Name updates | |
| 1.8.4 | Edit budget | Change budget amount | Budget updates, margin recalculates | |
| 1.8.5 | Edit margin | Change desired margin | Margin updates | |
| 1.8.6 | Add new product | Add product to existing quote | Product added | |
| 1.8.7 | Remove product | Remove product from quote | Product removed, totals recalculate | |
| 1.8.8 | Change quantities | Modify item quantities | Quantities update, costs recalculate | |
| 1.8.9 | Save changes | Click "Update Quote" | Changes saved, list updates | |
| 1.8.10 | Cancel edit | Click Cancel/X | No changes saved | |

### 1.9 Delete Quote

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 1.9.1 | Delete button visible | View quote in list | Delete/trash icon visible | |
| 1.9.2 | Confirmation dialog | Click delete icon | Confirmation dialog appears | |
| 1.9.3 | Cancel delete | Click Cancel in confirmation | Quote not deleted | |
| 1.9.4 | Confirm delete | Click Confirm/Delete | Quote removed from list | |
| 1.9.5 | Quote gone | Refresh page | Deleted quote no longer appears | |

### 1.10 Quote Status Workflow

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 1.10.1 | New quote (normal margin) | Create quote above margin threshold | Status is "Draft" | |
| 1.10.2 | New quote (low margin) | Create quote below margin threshold | Status is "Pending Approval" (auto-flagged) | |
| 1.10.3 | Approve quote | Click approve action on pending quote | Status changes to "Approved" | |
| 1.10.4 | Reject quote | Click reject action on pending quote | Status changes to "Rejected" | |
| 1.10.5 | Change to Sent | Update status to "Sent" via dropdown | Status changes to "Sent" | |
| 1.10.6 | Change to Accepted | Update status to "Accepted" via dropdown | Status changes to "Accepted" | |
| 1.10.7 | Status dropdown | View quote actions | Status dropdown allows changing status | |

---

## 2. REPORTS TAB

### 2.1 Reports Tab General

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 2.1.1 | Reports tab loads | Click "Sales Reports" tab | Reports section displays | |
| 2.1.2 | Report type buttons | View Reports tab | Buttons for Pipeline, Sales Reps, Opportunity Status, Opportunity Value visible | |
| 2.1.3 | Default report | Open Reports tab | Pipeline Report selected by default | |
| 2.1.4 | Date range pickers | View filter controls | Start Date and End Date pickers visible | |
| 2.1.5 | Sales rep filter | View filter controls | Sales Rep dropdown visible | |
| 2.1.6 | Source filter | View filter controls | Lead Source dropdown visible | |

### 2.2 Date Range Filters

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 2.2.1 | Start date picker opens | Click Start Date field | Calendar picker opens | |
| 2.2.2 | Select start date | Choose a date | Date selected, picker closes | |
| 2.2.3 | End date picker opens | Click End Date field | Calendar picker opens | |
| 2.2.4 | Select end date | Choose a date | Date selected, picker closes | |
| 2.2.5 | Report updates | Change date range | Report data refreshes with new range | |
| 2.2.6 | Default range | Open Reports fresh | Year-to-date range selected | |

### 2.3 Sales Rep Filter

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 2.3.1 | Dropdown opens | Click Sales Rep dropdown | List of sales reps shown | |
| 2.3.2 | "All" option | Select "All" | All reps included in report | |
| 2.3.3 | Specific rep | Select specific sales rep | Report filters to that rep only | |
| 2.3.4 | Report updates | Change sales rep | Data refreshes for selected rep | |

### 2.4 Lead Source Filter

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 2.4.1 | Dropdown opens | Click Source dropdown | List of lead sources shown | |
| 2.4.2 | "All" option | Select "All" | All sources included | |
| 2.4.3 | Specific source | Select specific source | Report filters to that source | |
| 2.4.4 | Report updates | Change source | Data refreshes for selected source | |

### 2.5 Pipeline Report

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 2.5.1 | Select Pipeline Report | Click "Pipeline Report" button | Pipeline report displays | |
| 2.5.2 | Funnel visualization | View Pipeline Report | Visual funnel chart of stages shown | |
| 2.5.3 | Stage columns | View Pipeline Report | Each pipeline stage displayed | |
| 2.5.4 | Lead counts | View Pipeline Report | Number of leads per stage shown | |
| 2.5.5 | Stage values | View Pipeline Report | Total value per stage displayed | |
| 2.5.6 | Total pipeline value | View summary | Total pipeline value shown | |
| 2.5.7 | Total leads count | View summary | Total number of leads shown | |
| 2.5.8 | Empty state | View with no data in range | "No data" message displayed | |
| 2.5.9 | Loading state | Apply new filters | Loading indicator shown | |

### 2.6 Sales Reps Report

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 2.6.1 | Select Sales Reps Report | Click "Sales Reps" button | Sales Reps report displays | |
| 2.6.2 | Rep table | View Sales Reps Report | Table with all sales reps shown | |
| 2.6.3 | Name column | View table | Rep names displayed | |
| 2.6.4 | Department column | View table | Departments displayed | |
| 2.6.5 | Appointments metric | View table | Appointment counts shown | |
| 2.6.6 | Pitches metric | View table | Pitch counts shown | |
| 2.6.7 | Closed Deals metric | View table | Closed deal counts shown | |
| 2.6.8 | Total Leads metric | View table | Total lead counts shown | |
| 2.6.9 | Close Rate metric | View table | Close rate percentages shown | |
| 2.6.10 | Avg MRR metric | View table | Average MRR values shown | |
| 2.6.11 | Total Value metric | View table | Total value amounts shown | |
| 2.6.12 | Summary totals | View report header | Totals for appointments, pitches, closed shown | |

### 2.7 Sales Reps Report Sorting

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 2.7.1 | Sort by name | Click Name header | Reps sorted by name | |
| 2.7.2 | Sort by department | Click Department header | Reps sorted by department | |
| 2.7.3 | Sort by appointments | Click Appointments header | Reps sorted by appointment count | |
| 2.7.4 | Sort by pitches | Click Pitches header | Reps sorted by pitch count | |
| 2.7.5 | Sort by closed deals | Click Closed header | Reps sorted by closed deal count | |
| 2.7.6 | Sort by close rate | Click Close Rate header | Reps sorted by close rate | |
| 2.7.7 | Sort by avg MRR | Click Avg MRR header | Reps sorted by average MRR | |
| 2.7.8 | Sort by total value | Click Total Value header | Reps sorted by total value | |
| 2.7.9 | Toggle sort order | Click same header twice | Toggles between ascending/descending | |
| 2.7.10 | Sort indicators | Apply sort | Visual indicator shows sort direction | |

### 2.8 Opportunity Status Report

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 2.8.1 | Select Opportunity Status | Click "Opportunity Status" button | Opportunity Status report displays | |
| 2.8.2 | Status breakdown | View report | Leads grouped by status shown | |
| 2.8.3 | Count per status | View report | Number of leads per status displayed | |
| 2.8.4 | Value per status | View report | Total value per status displayed | |
| 2.8.5 | Chart visualization | View report | Visual chart of status breakdown | |

### 2.9 Opportunity Value Report

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 2.9.1 | Select Opportunity Value | Click "Opportunity Value" button | Opportunity Value report displays | |
| 2.9.2 | Value distribution | View report | Value analysis displayed | |
| 2.9.3 | Total values | View report | Total pipeline value shown | |
| 2.9.4 | Value by stage/source | View report | Value breakdown visible | |

---

## 3. TARGETS TAB

### 3.1 Targets Tab General

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 3.1.1 | Targets tab loads | Click "Targets" tab | Targets section displays | |
| 3.1.2 | Targets table | View Targets tab | Table with year, month, amount columns | |
| 3.1.3 | Add Target button | View Targets tab (as Admin/Manager) | "Add Target" button visible | |
| 3.1.4 | Time filter dropdown | View Targets tab | Time period filter visible | |

### 3.2 Targets Filtering

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 3.2.1 | Filter: All | Select "All" | All targets displayed | |
| 3.2.2 | Filter: This Year | Select "This Year" | Only current year targets shown | |
| 3.2.3 | Filter: Last Year | Select "Last Year" | Only previous year targets shown | |
| 3.2.4 | Filter: Next Year | Select "Next Year" | Only next year targets shown | |
| 3.2.5 | Filter: This Quarter | Select "This Quarter" | Only current quarter targets shown | |
| 3.2.6 | Filter: Next Quarter | Select "Next Quarter" | Only next quarter targets shown | |
| 3.2.7 | Filter: This Month | Select "This Month" | Only current month target shown | |

### 3.3 Create Target

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 3.3.1 | Open create dialog | Click "Add Target" button | Create target dialog opens | |
| 3.3.2 | Year selection | Click Year dropdown | Years available for selection | |
| 3.3.3 | Month selection | Click Month dropdown | All 12 months available | |
| 3.3.4 | Enter amount | Type target amount | Field accepts numeric input | |
| 3.3.5 | Amount required | Try to save with empty amount | Validation error shown | |
| 3.3.6 | Invalid amount | Try to save with 0 or negative | Validation error shown | |
| 3.3.7 | Save target | Click Save/Create | Target created, appears in list | |
| 3.3.8 | Cancel creation | Click Cancel | Dialog closes, no target created | |
| 3.3.9 | Duplicate handling | Create target for existing month/year | Either updates or shows error | |

### 3.4 Edit Target

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 3.4.1 | Edit button visible | View target row | Edit/pencil icon visible | |
| 3.4.2 | Open edit dialog | Click edit icon | Edit dialog opens with current values | |
| 3.4.3 | Pre-populated fields | View edit dialog | Year, month, amount pre-filled | |
| 3.4.4 | Change year | Select different year | Year updates | |
| 3.4.5 | Change month | Select different month | Month updates | |
| 3.4.6 | Change amount | Enter new amount | Amount updates | |
| 3.4.7 | Save changes | Click Save | Changes saved, list updates | |
| 3.4.8 | Cancel edit | Click Cancel | No changes saved | |

### 3.5 Delete Target

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 3.5.1 | Delete button visible | View target row | Delete/trash icon visible | |
| 3.5.2 | Click delete | Click delete icon | Confirmation or target deleted | |
| 3.5.3 | Target removed | After delete | Target no longer in list | |

---

## 4. SALES SETTINGS

### 4.1 Settings Access

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 4.1.1 | Navigate to Settings | Click Settings in main navigation | Settings page loads | |
| 4.1.2 | Find Sales Settings | Look for Sales in settings menu | Sales settings link visible | |
| 4.1.3 | Open Sales Settings | Click Sales settings | Sales settings page loads | |
| 4.1.4 | Back button | View Sales Settings page | "Back to Settings" button visible | |

### 4.2 Minimum Margin Threshold

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 4.2.1 | Current value displayed | View Sales Settings | Current minimum margin shown | |
| 4.2.2 | Input field editable | Click margin input | Field is editable | |
| 4.2.3 | Enter valid value | Type 35 | Field accepts input | |
| 4.2.4 | Enter invalid (negative) | Type -5 | Validation error or rejected | |
| 4.2.5 | Enter invalid (>100) | Type 150 | Validation error or rejected | |
| 4.2.6 | Enter decimal | Type 32.5 | Field accepts decimal | |
| 4.2.7 | Save button | View page | Save button visible | |
| 4.2.8 | Save changes | Click Save | Success message shown | |
| 4.2.9 | Value persists | Refresh page | New value still displayed | |
| 4.2.10 | Affects quotes | Go to Quotes, check low margin warning | Quotes below new threshold are flagged | |

---

## 5. PERMISSION TESTING

### 5.1 Admin Role

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 5.1.1 | Access Sales module | Navigate to /sales | Sales page accessible | |
| 5.1.2 | View Quotes tab | Click Quotes tab | Quotes displayed | |
| 5.1.3 | Create quote | Click New Quote | Can create quotes | |
| 5.1.4 | Edit quote | Click edit on quote | Can edit quotes | |
| 5.1.5 | Delete quote | Click delete on quote | Can delete quotes | |
| 5.1.6 | Approve quote | Approve pending quote | Can approve quotes | |
| 5.1.7 | View Reports tab | Click Reports tab | Reports displayed | |
| 5.1.8 | View all report types | Switch between report types | All reports accessible | |
| 5.1.9 | View Targets tab | Click Targets tab | Targets displayed | |
| 5.1.10 | Create target | Click Add Target | Can create targets | |
| 5.1.11 | Edit target | Click edit on target | Can edit targets | |
| 5.1.12 | Delete target | Click delete on target | Can delete targets | |
| 5.1.13 | Access Sales Settings | Navigate to Settings > Sales | Settings accessible | |
| 5.1.14 | Change settings | Modify minimum margin | Can save changes | |

### 5.2 Manager Role (Test with Manager account)

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 5.2.1 | Access Sales module | Navigate to /sales | Sales page accessible | |
| 5.2.2 | View Quotes | View Quotes tab | Quotes visible | |
| 5.2.3 | Create quote | Try to create quote | Verify based on assigned permissions | |
| 5.2.4 | Approve quote | Try to approve | Verify based on assigned permissions | |
| 5.2.5 | View Reports | Click Reports tab | Verify based on assigned permissions | |
| 5.2.6 | View Targets | Click Targets tab | Targets visible | |
| 5.2.7 | Manage Targets | Try to create/edit target | Verify based on assigned permissions | |
| 5.2.8 | Sales Settings | Try to access Settings > Sales | Verify based on assigned permissions | |

### 5.3 Accounting Role (Test with Accounting account)

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 5.3.1 | Access Sales | Navigate to /sales | Verify based on assigned permissions | |
| 5.3.2 | View Quotes | View Quotes tab | Verify based on assigned permissions | |
| 5.3.3 | Create quote | Try to create | Verify based on assigned permissions | |
| 5.3.4 | View Reports | Click Reports tab | Verify based on assigned permissions | |
| 5.3.5 | View Targets | Click Targets tab | Verify based on assigned permissions | |
| 5.3.6 | Manage Targets | Try to create target | Verify based on assigned permissions | |

### 5.4 User Role (Test with basic User account)

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 5.4.1 | Access Sales | Navigate to /sales | Verify based on assigned permissions | |
| 5.4.2 | View Quotes | View Quotes tab | Verify based on assigned permissions | |
| 5.4.3 | Create quote | Try to create | Verify based on assigned permissions | |
| 5.4.4 | Approve quote | Try to approve | Verify based on assigned permissions | |
| 5.4.5 | View Reports | Try to access Reports | Verify based on assigned permissions | |
| 5.4.6 | Sales Settings | Try to access | Verify based on assigned permissions | |

**Note:** Permission behavior depends on the specific permissions assigned to each role in Settings > Roles & Permissions. The QA tester should first check the role's assigned permissions, then verify the UI behavior matches.

---

## 6. DASHBOARD WIDGETS (Related to Sales)

### 6.1 Sales Pipeline Overview Widget

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 6.1.1 | Add widget | Dashboard > Add Widget > Sales Pipeline | Widget added to dashboard | |
| 6.1.2 | Data displays | View widget | Pipeline stages and values shown | |
| 6.1.3 | Data accuracy | Compare to Sales Reports | Numbers match Pipeline Report | |

### 6.2 Recent Deals Won Widget

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 6.2.1 | Add widget | Dashboard > Add Widget > Recent Deals Won | Widget added to dashboard | |
| 6.2.2 | Deals display | View widget | Recent won deals listed | |
| 6.2.3 | Deal info | View entries | Deal name, value, date shown | |

### 6.3 Revenue This Month Widget (with Targets)

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 6.3.1 | Target integration | Set target for current month | Widget shows target | |
| 6.3.2 | Progress indicator | View widget | Progress toward target displayed | |
| 6.3.3 | Percentage shown | View widget | Percentage of target reached shown | |

---

## 7. ERROR HANDLING & EDGE CASES

### 7.1 Error Scenarios

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 7.1.1 | Network error on load | Disconnect network, load page | Error message displayed gracefully | |
| 7.1.2 | Save failure | Simulate save failure | Error toast/message shown | |
| 7.1.3 | Invalid form data | Submit form with invalid data | Validation errors shown | |
| 7.1.4 | Empty states | View tabs with no data | Appropriate empty state messages | |

### 7.2 Edge Cases

| # | Test Item | Steps | Expected Result | Pass/Fail |
|---|-----------|-------|-----------------|-----------|
| 7.2.1 | Very long quote name | Enter 200+ character name | Handled gracefully (truncate or limit) | |
| 7.2.2 | Large numbers | Enter very large budget/amount | Numbers format correctly | |
| 7.2.3 | Zero budget | Create quote with $0 budget | Margin calculates correctly or shows error | |
| 7.2.4 | Many line items | Add 50+ products to quote | Performance acceptable, UI usable | |
| 7.2.5 | Rapid clicks | Click Save multiple times quickly | Only one save processed | |
| 7.2.6 | Browser refresh | Refresh during action | No data corruption | |

---

## 8. CROSS-BROWSER TESTING

| # | Browser | Test Items | Pass/Fail |
|---|---------|------------|-----------|
| 8.1 | Chrome (latest) | All Sales features | |
| 8.2 | Firefox (latest) | All Sales features | |
| 8.3 | Safari (latest) | All Sales features | |
| 8.4 | Edge (latest) | All Sales features | |

---

## 9. RESPONSIVE DESIGN

| # | Device/Width | Test Items | Pass/Fail |
|---|--------------|------------|-----------|
| 9.1 | Desktop (1920px) | All layouts correct | |
| 9.2 | Laptop (1366px) | All layouts correct | |
| 9.3 | Tablet (768px) | Tables responsive, menus accessible | |
| 9.4 | Mobile (375px) | All features accessible, no horizontal scroll | |

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Tester | | | |
| QA Lead | | | |
| Product Owner | | | |

---

## Notes

_Record any bugs found, observations, or deferred items here:_

1. 
2. 
3. 
4. 
5. 

# Sales Settings - Detailed Documentation

## Overview

Sales Settings allow administrators to configure sales-specific parameters that affect how the Sales module operates. Currently, the primary setting is the minimum margin threshold, which determines when quotes are flagged as potentially unprofitable.

**Location:** Settings > Sales
**URL:** `/settings/sales`

---

## What It Does

Sales Settings help you:
- Configure the minimum acceptable profit margin for quotes
- Ensure sales team doesn't sell at unprofitable rates
- Standardize margin expectations across the organization
- Control how low-margin warnings are triggered

---

## How to Access

1. Click **Settings** in the main navigation
2. Find and click **Sales** in the settings menu
3. You'll see the Sales Settings page

**Alternative:** Navigate directly to `/settings/sales`

---

## Available Settings

### General Settings Tab

#### Minimum Margin Threshold

**What It Is:**
The minimum profit margin percentage that quotes should achieve. Quotes falling below this threshold are flagged with warnings.

**Default Value:** 35%

**Valid Range:** 0% to 100%

**How It Affects the System:**

| Scenario | System Behavior |
|----------|-----------------|
| Quote margin ≥ threshold | Normal display, no warnings |
| Quote margin < threshold | Warning icon displayed, row highlighted |
| Filter "Low Margin Only" | Shows only quotes below threshold |

---

## What You Can Do

### View Current Settings

1. Navigate to Settings > Sales
2. See the current minimum margin threshold displayed
3. Review when it was last updated (if tracked)

**Permission Required:** `settings.sales.view`

---

### Change Minimum Margin Threshold

1. Navigate to Settings > Sales
2. Find the "Minimum Margin Threshold" field
3. Enter a new percentage value (0-100)
4. Click **"Save Settings"** or **"Save"**

**Validation:**
- Value must be a number
- Must be between 0 and 100
- Decimals are allowed (e.g., 32.5%)

**Example Values:**
- **35%** - Standard margin (default)
- **40%** - More conservative/higher margin requirement
- **25%** - More aggressive/lower margin acceptable
- **50%** - Premium pricing strategy

**Permission Required:** `settings.sales.manage`

---

## Understanding Margin Threshold

### How Margin Is Calculated

In the Quotes feature, margin is calculated as:

```
Actual Margin = ((Client Budget - Total Cost) / Client Budget) × 100
```

**Example:**
- Client Budget: $10,000
- Total Cost: $6,500
- Margin: (($10,000 - $6,500) / $10,000) × 100 = 35%

### What the Threshold Means

If your threshold is set to 35%:
- A quote with 40% margin = ✅ OK (above threshold)
- A quote with 35% margin = ✅ OK (meets threshold)
- A quote with 30% margin = ⚠️ Warning (below threshold)

### Why It Matters

Setting the right threshold helps:
1. **Prevent losses** - Don't accidentally sell below cost
2. **Maintain profitability** - Ensure healthy business margins
3. **Guide sales team** - Clear expectations on pricing
4. **Flag exceptions** - Identify deals needing review

---

## Setting the Right Threshold

### Factors to Consider

| Factor | Impact on Threshold |
|--------|-------------------|
| **Industry norms** | What's standard in your market? |
| **Business costs** | What overhead needs to be covered? |
| **Growth stage** | Startups may accept lower margins |
| **Competition** | Competitive markets may require flexibility |
| **Service type** | Some services have higher inherent costs |

### Common Thresholds by Business Type

| Business Type | Typical Threshold |
|---------------|------------------|
| Professional Services | 35-50% |
| Software/SaaS | 70-85% |
| Retail | 20-40% |
| Manufacturing | 15-30% |
| Consulting | 40-60% |

### Recommendations

- **Start conservative** - Set a higher threshold initially
- **Review quarterly** - Adjust based on actual performance
- **Consider tiers** - Different thresholds for different service types (future feature)
- **Communicate clearly** - Ensure sales team knows the expectation

---

## Permissions Reference

| Action | Permission Key | Who Has It |
|--------|---------------|------------|
| View sales settings | `settings.sales.view` | Admin |
| Change sales settings | `settings.sales.manage` | Admin |

**Note:** Only administrators have access to Sales Settings by default. This prevents unauthorized changes to business-critical parameters.

---

## Impact on Other Features

### Quotes Tab

When you change the minimum margin threshold:
- All quotes are immediately re-evaluated
- Low-margin warnings update automatically
- The "Low Margin Only" filter uses the new threshold

### Quote Builder

When creating or editing quotes:
- Real-time margin calculations compare against the threshold
- Visual indicators show if margin is acceptable
- Warnings appear when margin falls below threshold

### Dashboard Widgets

Some dashboard widgets may use this threshold for:
- Flagging at-risk quotes
- Calculating pipeline health
- Showing margin distribution

---

## Best Practices

1. **Document changes** - Keep a record of when and why you changed the threshold
2. **Notify the team** - Let sales know when expectations change
3. **Review periodically** - Market conditions change; your threshold should too
4. **Allow exceptions** - Some strategic deals may justify lower margins
5. **Monitor trends** - If many quotes are flagged, consider if the threshold is realistic

---

## Troubleshooting

### Changes Not Saving

1. Ensure value is between 0 and 100
2. Check you have `settings.sales.manage` permission
3. Look for error messages in the toast notification
4. Try refreshing the page and re-entering

### Warnings Not Appearing on Quotes

1. Verify the threshold was saved successfully
2. Check if quote margins are actually below threshold
3. Refresh the Quotes page to see updated calculations

### Can't Access Sales Settings

1. Verify you have Admin role
2. Check your permissions include `settings.sales.view`
3. Contact your system administrator

---

## Future Settings (Planned)

The Sales Settings page may expand to include:

- **Commission rates** - Configure sales rep commission percentages
- **Discount limits** - Maximum discounts allowed without approval
- **Quote expiration** - Default validity period for quotes
- **Approval workflows** - Define who needs to approve quotes at different values
- **Product-specific margins** - Different thresholds for different products

---

## Related Features

- [Quotes](QUOTES.md) - Where margin thresholds are applied
- [Pipeline & Deals](PIPELINE-DEALS.md) - Sales process management
- [Permissions Guide](../../PERMISSIONS-GUIDE.md) - Managing access to settings

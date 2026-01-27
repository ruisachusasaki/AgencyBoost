# Pipeline & Deals - Detailed Documentation

## Overview

The Pipeline & Deals system allows you to track potential sales opportunities through your sales process. Deals move through defined stages from initial contact to closed (won or lost), giving you visibility into your sales funnel and helping forecast revenue.

**Related Permissions:** `sales.pipeline.*` and `sales.deals.*`

---

## What It Does

The Pipeline & Deals feature helps you:
- Visualize your sales funnel with deals in each stage
- Track deal progress from lead to close
- Manage deal details and associated information
- Move deals between pipeline stages
- Mark deals as won or lost
- Analyze pipeline health and forecasting

---

## Key Concepts

### Pipeline

The pipeline is the visual representation of your sales process. It consists of stages that deals move through as they progress toward closing.

### Deals

Deals are individual sales opportunities. Each deal represents a potential sale with:
- A potential client or lead
- An estimated value
- A current stage in the pipeline
- Associated contacts and activities

### Stages

Stages are the steps in your sales process. Typical stages include:
- New/Open
- Qualified
- Proposal/Quote Sent
- Negotiation
- Closed Won
- Closed Lost

---

## How It Works

### Deal Lifecycle

```
[New Lead] → [Qualify] → [Proposal] → [Negotiate] → [Close]
                                                       ↓
                                              [Won] or [Lost]
```

1. **New Lead**: A potential opportunity enters the pipeline
2. **Qualify**: Determine if the lead is a good fit
3. **Proposal**: Send a quote or proposal
4. **Negotiate**: Work out terms and details
5. **Close**: Mark as won (success) or lost (unsuccessful)

### Moving Deals

Deals move through stages as they progress:
- Drag and drop in pipeline view
- Update status in deal detail view
- Automatic movement based on actions (e.g., sending a quote)

---

## What You Can Do

### View Pipeline

See all active deals organized by stage.

**Pipeline View Shows:**
- Column for each stage
- Deal cards within each stage
- Deal value and key info on cards
- Count and total value per stage

**Permission Required:** `sales.pipeline.view`

---

### Manage Pipeline

Move deals between stages to reflect their progress.

**How to Move a Deal:**
1. In pipeline view, find the deal card
2. Drag the card to the desired stage column
3. Drop to update the deal's stage

**Or via Deal Detail:**
1. Open the deal
2. Change the stage dropdown
3. Save changes

**Permission Required:** `sales.pipeline.manage`

---

### View Deals

Access detailed information about individual deals.

**Deal Information Includes:**
- Deal name and description
- Associated client or lead
- Estimated value
- Current stage
- Expected close date
- Assigned sales rep
- Activities and notes
- Related quotes

**Permission Required:** `sales.deals.view`

---

### Create Deals

Add new opportunities to your pipeline.

**To Create a Deal:**
1. Click "New Deal" or "+" button
2. Fill in deal details:
   - Deal name
   - Client or lead association
   - Estimated value
   - Initial stage
   - Expected close date
   - Assigned owner
3. Save the deal

**Required Fields:**
- Deal name
- Value (estimated)
- Stage

**Permission Required:** `sales.deals.create`

---

### Edit Deals

Update deal information as it progresses.

**Editable Fields:**
- Deal name and description
- Associated client/lead
- Estimated value
- Stage
- Expected close date
- Assigned sales rep
- Custom fields (if configured)

**To Edit:**
1. Open the deal detail view
2. Click edit or modify fields inline
3. Save changes

**Permission Required:** `sales.deals.edit`

---

### Delete Deals

Remove deals that are no longer relevant.

**When to Delete:**
- Duplicate entries
- Test/demo deals
- Deals entered in error

**Note:** Consider closing as "Lost" instead of deleting to preserve historical data for reporting.

**Permission Required:** `sales.deals.delete`

---

### Close Deals

Mark deals as won or lost when they reach conclusion.

**Closing as Won:**
1. Open the deal
2. Select "Closed Won" status
3. Optionally record close details
4. Save

**Closing as Lost:**
1. Open the deal
2. Select "Closed Lost" status
3. Record reason for loss (for analysis)
4. Save

**What Happens When Closed:**
- Deal moves to closed stage
- Counts toward won/lost metrics
- Value counts toward (or excluded from) revenue
- Historical data preserved for reporting

**Permission Required:** `sales.deals.close`

---

## Deal Details

### Core Information

| Field | Description |
|-------|-------------|
| **Deal Name** | Descriptive name for the opportunity |
| **Value** | Estimated monetary value |
| **Stage** | Current position in pipeline |
| **Close Date** | Expected or actual close date |
| **Owner** | Sales rep responsible |
| **Source** | How the lead originated |

### Associated Records

| Association | Purpose |
|-------------|---------|
| **Client** | Existing client the deal is for |
| **Lead** | New lead the deal originated from |
| **Contacts** | People involved in the deal |
| **Quotes** | Proposals created for this deal |
| **Activities** | Meetings, calls, emails logged |
| **Notes** | Internal observations |

---

## Pipeline Stages

### Default Stages

| Stage | Description | Actions Available |
|-------|-------------|-------------------|
| **New** | Fresh opportunity, not yet qualified | Qualify or discard |
| **Qualified** | Confirmed good fit | Create proposal |
| **Proposal Sent** | Quote delivered to prospect | Follow up |
| **Negotiation** | Working out terms | Adjust terms, close |
| **Closed Won** | Successfully closed | Celebrate! |
| **Closed Lost** | Did not close | Record reason |

### Stage Transitions

Deals typically move forward through stages, but can also move backward:
- Forward: Natural progression as deal advances
- Backward: When additional qualification or work needed
- To Closed: Final state (won or lost)

---

## Pipeline Metrics

### Key Metrics

| Metric | Calculation | Use |
|--------|-------------|-----|
| **Total Pipeline Value** | Sum of all active deal values | Forecast potential |
| **Deals per Stage** | Count of deals in each stage | Identify bottlenecks |
| **Conversion Rate** | Deals won ÷ total closed deals | Measure effectiveness |
| **Average Deal Size** | Total value ÷ number of deals | Benchmark deals |
| **Sales Velocity** | Value × Win Rate ÷ Cycle Length | Forecast revenue |

### Using Pipeline Data

- **Forecasting**: Use weighted pipeline value for revenue projections
- **Resource Planning**: Identify stages needing more attention
- **Performance Tracking**: Compare rep pipeline metrics
- **Process Optimization**: Find where deals get stuck

---

## Permissions Reference

| Action | Permission Key | Description |
|--------|---------------|-------------|
| View pipeline | `sales.pipeline.view` | See deals in pipeline view |
| Manage pipeline | `sales.pipeline.manage` | Move deals between stages |
| View deals | `sales.deals.view` | Access deal details |
| Create deals | `sales.deals.create` | Add new deals |
| Edit deals | `sales.deals.edit` | Modify deal information |
| Delete deals | `sales.deals.delete` | Remove deals |
| Close deals | `sales.deals.close` | Mark deals as won/lost |

### Role Access Summary

| Role | View | Create | Edit | Delete | Close |
|------|------|--------|------|--------|-------|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manager | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sales Manager | ✅ | ✅ | ✅ | ✅ | ✅ |
| User | ✅ | ✅ | ✅ | ❌ | ❌ |
| Accounting | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Best Practices

### Pipeline Hygiene

1. **Regular reviews** - Clean up stale deals weekly
2. **Accurate values** - Keep deal values current
3. **Timely updates** - Move deals as soon as status changes
4. **Complete information** - Fill in all relevant fields
5. **Close what's closed** - Don't let "dead" deals linger

### Deal Management

1. **Clear naming** - Use descriptive deal names
2. **Realistic dates** - Set achievable close dates
3. **Document activities** - Log all interactions
4. **Use quotes** - Create formal quotes for serious deals
5. **Record loss reasons** - Learn from lost deals

### Forecasting Tips

1. **Weight by stage** - Later stages are more likely to close
2. **Track conversion** - Know your stage-to-stage conversion rates
3. **Consider seasonality** - Adjust for seasonal patterns
4. **Be conservative** - It's better to under-promise and over-deliver

---

## Troubleshooting

### Deals Not Moving

1. Verify you have `sales.pipeline.manage` permission
2. Check if the deal is in a "locked" status
3. Try refreshing the page

### Can't Create Deals

1. Verify you have `sales.deals.create` permission
2. Ensure required fields are filled
3. Check for validation errors

### Pipeline Not Loading

1. Check your internet connection
2. Clear browser cache
3. Try a different browser
4. Contact support if issue persists

---

## Integration with Other Features

### Leads

- Convert qualified leads to deals
- Lead information populates deal record
- Lead source tracked for attribution

### Quotes

- Create quotes directly from deals
- Quote acceptance can auto-update deal stage
- Quote values sync with deal values

### Reports

- Pipeline Report shows deal distribution
- Sales Rep Report tracks deal metrics
- Opportunity reports analyze outcomes

### Targets

- Closed won deals contribute to target progress
- Pipeline value used for forecasting against targets

---

## Related Features

- [Quotes](QUOTES.md) - Create proposals for deals
- [Sales Reports](REPORTS.md) - Analyze pipeline performance
- [Targets](TARGETS.md) - Set and track sales goals
- [Leads](../leads/README.md) - Source of new deals
- [Clients](../clients/README.md) - Customers deals are for

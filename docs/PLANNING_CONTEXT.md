# PLANNING_CONTEXT.md

> **Placeholder — fill this in before your next real planning session.**
>
> This file gives Claude the short-term context that can't be inferred from the code. Treat it as living: update it when priorities shift, reset it when a milestone ends. Keep it skimmable — bullet points beat paragraphs.

---

## Current priorities

*What are you actively trying to ship or improve right now? One sentence each. The top 3–5 items only.*

- _(e.g. "Ship multi-tenant AWS deployment by end of Q2")_
- _(e.g. "Reduce proposal signing friction — current drop-off is ~40% at the payment step")_
- _(e.g. "Stabilize Google Calendar two-way sync — recurring events still drift")_

---

## Constraints

*What do I NOT want touched, changed, or expanded right now? Hard no-gos.*

- _(e.g. "No schema migrations in `clients` table until the multi-tenant plan is ratified")_
- _(e.g. "Keep Stripe integration single-account — don't add Connect before legal review")_
- _(e.g. "Don't introduce a queue/worker system yet — keep background services in-process")_
- _(e.g. "Permissions model is frozen — new features must fit existing dot-notation keys, not invent new categories")_

---

## Known pain points

*Bugs, UX frustrations, tech debt the team is living with but hasn't fixed. Claude should be aware of these so it doesn't re-discover them from scratch.*

- _(e.g. "`server/routes.ts` is ~47k lines and hard to navigate — don't add to it if a sub-router is feasible")_
- _(e.g. "`tasks.timeTracked` is deprecated but still in the schema for deploy-diff safety — reads/writes go to `task_time_entries`")_
- _(e.g. "Quote/Proposal vocabulary overload — `quotes` table carries the whole proposal lifecycle")_
- _(e.g. "No test runner — validation is manual via `docs/qa/` checklists")_

---

## What 'done' looks like for this cycle

*One paragraph. What would make this a successful week/sprint/quarter?*

_(e.g. "Onboarding drop-off below 15%, zero P1 bugs in tickets, and multi-tenant plan has a signed-off phase-1 scope.")_

---

## Who's working on what

*Optional. If multiple humans are in the repo, note who owns what so Claude doesn't step on someone's branch.*

- _(e.g. "Joe: multi-tenant infra")_
- _(e.g. "Rui: proposal flow fixes")_

---

*Last updated: FILL IN DATE*

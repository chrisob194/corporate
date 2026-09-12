# Spec — MCP tool access decided at scope time, not baked into the role

## Problem
Whoever defines a role today (e.g. the builder) has to decide, once and in
advance, which external tool servers that role will ever be allowed to use —
before any actual piece of work exists to judge the need against. That
guess is wrong in both directions at once: the role ends up carrying access
it doesn't need for most of the work it's actually given, and when a task
does need a capability nobody anticipated at the time the role was written,
there's no way to grant it, because the grant was fixed to the role rather
than to the work. The person who actually knows what a piece of work needs —
whoever is designing the approach, or whoever is splitting a plan into
tasks — has no way to act on that knowledge; the decision was already made,
earlier, by someone with less information.

## User scenarios
1. A design calls for no external tool access of this kind at all. Before:
   the role assigned to it still carries whatever standing access was baked
   into it, unused and unaccounted for. After: nothing is granted, because
   nobody deciding this task's scope decided it was needed.
2. A design calls for a task that genuinely needs an external tool the
   role's fixed definition never anticipated. Before: the role cannot use
   it — its access was decided before this task existed. After: whoever is
   deciding the scope of that task — the architect while designing the
   approach, or whoever is splitting the plan — decides the task needs it
   and makes it available for that task.
3. Two tasks land on the same role, one needing an external tool, one not.
   Before: the role must be defined to carry the union of everything any
   task assigned to it might ever need, permanently. After: each task
   carries only what was decided for it, at the point its own scope was
   decided.

## Functional requirements
1. A role's usable external-tool access MUST be determined at the point a
   specific piece of work's scope is decided, not fixed as a permanent part
   of what the role is.
2. It MUST be possible, while designing an approach or while splitting a
   plan into tasks, to decide that a given piece of work does or does not
   need generic external-tool access, independent of what any other piece
   of work assigned to the same role was given.
3. A role MUST NOT carry a standing grant tying it to one specific external
   tool server that applies to every task it is ever assigned, regardless
   of that task's actual scope.
4. Whenever a scope decision grants a role access to an external tool for a
   task, whatever governs how that tool's output is to be used (what it may
   be trusted for, and what must happen when it isn't available) MUST be
   decided alongside the grant, not left implicit.
5. A role MUST remain assignable to work that needs no external-tool access
   at all, with nothing left over from a task that did need one.
6. The person deciding a task's scope, not the role carrying out the task,
   MUST be the one who decides whether that task needs external-tool
   access. [NEEDS CLARIFICATION: can this decision vary task-by-task within
   a single split plan, or must one decision at design time apply uniformly
   to every task the plan produces?]

## Non-goals
- This does not decide which external tools exist, what they do, or how
  they are invoked.
- This does not remove a role's ability to ever use external tools — it
  removes only the standing, task-independent nature of that access.
- This does not change who is allowed to decide a task's scope; it only
  moves the tool-access decision to sit alongside that existing decision.
- This does not cover other kinds of access a role has (its ability to
  read, write, or run things that aren't external tool servers) — only the
  kind of grant the brief describes: access tied to a specific external
  tool server.
- This does not specify how the scope-time decision is communicated to
  whoever carries out the task once decided.

## Key entities
- **Role**: the job a piece of work is dispatched to (e.g. the builder),
  distinguished by what kind of work it does, not by which tools it holds.
- **Piece of work / task**: a bounded unit of work whose scope someone
  decides before it is carried out.
- **External tool**: a capability outside what a role can do on its own,
  offered by a server rather than built into the role — the brief's
  "generic MCP usage" as opposed to a fixed tie to one named server.
- **Scope decision**: the act, performed while designing an approach or
  while splitting a plan into tasks, of deciding what a given piece of work
  actually requires.
- **Usage guidance**: what governs how a granted tool's output may be
  relied on, and what to fall back to when the tool isn't available —
  something that must travel with any grant made at scope-decision time.

## Assumptions
- The two points named in the brief — the architect designing an approach,
  and whoever splits a plan into tasks — are the only legitimate points at
  which this decision is made; no third decision point is being
  introduced. [NEEDS CLARIFICATION: if a design is worked without ever
  being split into separate tasks, does the design-time decision alone
  stand as the task's scope decision, or is a further decision expected at
  build time?]
- "Generic MCP usage" means a role can be equipped, per task, with the
  ability to use whichever external tool that task's scope decision names —
  not that every role becomes free to use any external tool at any time
  without such a decision.
- Roles that currently carry no standing grant of this kind are unaffected;
  this only changes how the ones that do, or would, get decided going
  forward. [NEEDS CLARIFICATION: for a role that already carries a fixed
  grant to a specific server today, is migrating it away part of this
  ticket's scope, or only the rule for how such grants are decided from now
  on?]
- The person deciding scope is trusted to also decide the usage guidance
  that travels with any tool grant they make — this ticket does not add a
  separate reviewer of that guidance.

## Second ticket
none — the brief describes one change (moving the MCP-access decision from
the role's fixed definition to the point where a task's scope is decided);
everything else quoted is context for why, not a separable piece of work.

## Loop hints
- Ends when: no role's usable external-tool access is fixed in its own
  definition — every such grant traces back to a decision made about a
  specific piece of work's scope, not to the role in general.
- Repeats over: each role that currently carries a fixed grant of this
  kind, and thereafter each new task or design as it is scoped.
- Partial value: yes — each role reworked away from a standing grant is a
  complete, independently checkable unit on its own.
- Human looks after: each role's rework is a one-time structural decision;
  someone should check it once per role converted, since a wrong call here
  is inherited by every future task assigned to that role.

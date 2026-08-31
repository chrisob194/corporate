---
name: sqlite-playbook
description: Use when a project stores data in SQLite — a .db/.sqlite file, CREATE TABLE, a schema or migration, PRAGMA journal_mode=WAL, BEGIN IMMEDIATE, SQLITE_BUSY, busy_timeout, foreign keys, STRICT tables, an in-memory :memory: database, or a long-lived process reading and writing one database file.
---

# SQLite Playbook

## Stack

SQLite is a library, not a server. One file is the database, there is no daemon,
no port, no user and no grant. Access control is filesystem permissions.

- Storage: one file, plus `-wal` and `-shm` siblings under WAL
- Types: dynamic, with per-column affinity. `STRICT` tables opt into checking
- Concurrency: many readers, one writer. Under WAL readers do not block the writer
- Foreign keys: **off by default**, a per-connection pragma
- Schema: versioned SQL migration files in the repo, forward only, applied in
  order, `PRAGMA user_version` as the applied marker. The database file is never
  the source of truth for schema
- Driver: a per-project decision, ruled in the design. This playbook is the
  engine, not a binding

## Toolchain

| Job | Command |
|---|---|
| open a database | `sqlite3 app.db` |
| list tables / show schema | `.tables`, `.schema <table>` |
| applied migration version | `PRAGMA user_version;` |
| journal mode in effect | `PRAGMA journal_mode;` |
| verify a file | `PRAGMA integrity_check;`, `PRAGMA foreign_key_check;` |
| explain a query plan | `EXPLAIN QUERY PLAN <sql>` |
| back up a live database | `VACUUM INTO 'backup.db'` |
| text dump | `sqlite3 app.db .dump > dump.sql` |
| diff two databases | `sqldiff a.db b.db` |
| size by table and index | `sqlite3_analyzer app.db` |

Never let an ORM create or sync schema against a real database file, and never
hand-edit schema in a live one. A schema change is a migration file, committed,
applied forward. No exceptions, not in dev, not in a test fixture.

## Obligations by activity

| Activity | Obligation |
|---|---|
| any | `sqlite.org/docs.html` is the index that resolves any question to its page and is the authority; `references/docs-map.md` beside this file maps the decisions this team makes to the exact page. A fact either covers is read there, never asserted from memory, and no blog post or recalled API substitutes for it |
| choosing an approach | rule on journal mode, concurrency and durability in writing. A long-lived process with concurrent readers is a WAL decision and a `synchronous` decision, never a default inherited by silence |
| implementing | `PRAGMA foreign_keys=ON` and a `busy_timeout` on **every** connection, every time it is opened; a write transaction opened `BEGIN IMMEDIATE`; every value bound as a parameter, never interpolated |
| migrating | numbered forward-only SQL files, each wrapped in one transaction that also bumps `user_version`; a column retype or drop is expand-then-contract, never an in-place edit |
| reviewing | reject interpolated SQL, an unset `busy_timeout`, a connection shared across threads with no stated threading mode, and schema that exists only in application code |
| testing | anything asserting concurrency, locking or durability runs against a file-backed temp database. `:memory:` cannot show those, and passing there proves nothing |

## Traps

- `:memory:` is private to one connection. Two connections are two databases, not
  one shared one — the reason a test suite passes and the server deadlocks.
- WAL mode is a property of the file, not of the session: it survives close and
  applies to every later connection. It needs shared memory across processes, so
  it does not work on a network filesystem.
- `BEGIN` is deferred. A transaction that reads and then writes tries to upgrade
  its lock, and an upgrade that fails is `SQLITE_BUSY` immediately —
  `busy_timeout` does not retry it, because retrying could not be safe. Open
  write transactions `BEGIN IMMEDIATE`.
- Foreign keys silently do nothing until the pragma is set, per connection. A
  pool that opens a new connection without it enforces nothing on that path.
- A declared column type is affinity, not a constraint: `INTEGER` accepts
  `'banana'` outside a `STRICT` table.
- `ALTER TABLE` renames and adds; it cannot drop a constraint or retype a column.
  That change is create-new, copy, drop, rename — inside one transaction.
- `INTEGER PRIMARY KEY` is an alias for the rowid and reuses ids after a delete
  unless declared `AUTOINCREMENT`. An id that escapes the database — a URL, a
  foreign system — must not be reusable.
- `VACUUM` rewrites the file: it takes a write lock and needs roughly twice the
  file size free. `VACUUM INTO` is the online backup, `.dump` is not a backup of
  a live file.
- `synchronous=NORMAL` under WAL can lose the last transactions on power loss,
  not corrupt the file. That is a durability choice and belongs in the design.

## Resources

### Skills

None.

### MCP servers

None.

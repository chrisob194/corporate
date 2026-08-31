# SQLite doc map

`sqlite.org/docs.html` is the complete index and the authority. This file is a
shortcut from a decision this team makes to the page that settles it — not a
replacement for the index, and not a summary of what those pages say. A question
not answered below goes to the index.

## Types and schema

| Question | Page |
|---|---|
| what a declared type actually enforces | `sqlite.org/datatype3.html` |
| making a column type a real constraint | `sqlite.org/stricttables.html` |
| how NULL compares, sorts and groups | `sqlite.org/nulls.html` |
| a column derived from other columns | `sqlite.org/gencol.html` |
| tables keyed by something other than a rowid | `sqlite.org/withoutrowid.html` |
| id reuse after delete, `AUTOINCREMENT` | `sqlite.org/autoinc.html` |
| enabling and enforcing referential integrity | `sqlite.org/foreignkeys.html` |
| indexing a subset of rows | `sqlite.org/partialindex.html` |
| indexing a computed value | `sqlite.org/expridx.html` |

## SQL surface

| Question | Page |
|---|---|
| statement syntax, the index of every command | `sqlite.org/lang.html` |
| `BEGIN` / `COMMIT` / deferred vs immediate | `sqlite.org/lang_transaction.html` |
| what `ALTER TABLE` can and cannot do | `sqlite.org/lang_altertable.html` |
| scalar functions | `sqlite.org/lang_corefunc.html` |
| aggregate functions | `sqlite.org/lang_aggfunc.html` |
| dates, times and their storage | `sqlite.org/lang_datefunc.html` |
| window functions | `sqlite.org/windowfunctions.html` |
| storing and querying JSON | `sqlite.org/json1.html` |
| every pragma, its scope and its persistence | `sqlite.org/pragma.html` |

## Concurrency and durability

| Question | Page |
|---|---|
| write-ahead logging, its trade-offs and its limits | `sqlite.org/wal.html` |
| lock states, `SQLITE_BUSY`, upgrade deadlock | `sqlite.org/lockingv3.html` |
| what a transaction actually sees | `sqlite.org/isolation.html` |
| threading modes and sharing a connection | `sqlite.org/threadsafe.html` |
| what survives a crash or power loss | `sqlite.org/atomiccommit.html` |
| shared cache mode, and why not to use it | `sqlite.org/sharedcache.html` |
| temp files, spill and where they land | `sqlite.org/tempfiles.html` |
| in-memory databases and their scope | `sqlite.org/inmemorydb.html` |

## Failure modes

| Question | Page |
|---|---|
| how a database file gets corrupted | `sqlite.org/howtocorrupt.html` |
| result and error codes, extended codes | `sqlite.org/rescode.html` |
| hard limits and their compile-time defaults | `sqlite.org/limits.html` |
| behaviour that surprises people | `sqlite.org/quirks.html` |
| handling untrusted databases and untrusted SQL | `sqlite.org/security.html` |
| the general FAQ | `sqlite.org/faq.html` |

## Performance

| Question | Page |
|---|---|
| how indexes are chosen, what `EXPLAIN QUERY PLAN` means | `sqlite.org/optoverview.html` |
| why the planner picked that index | `sqlite.org/queryplanner-ng.html` |
| memory-mapped I/O and when it helps | `sqlite.org/mmap.html` |
| blobs in the database vs on the filesystem | `sqlite.org/fasterthanfs.html` |

## Tooling and operations

| Question | Page |
|---|---|
| the `sqlite3` shell, dot commands, import and export | `sqlite.org/cli.html` |
| backing up a database that is in use | `sqlite.org/backup.html` |
| diffing two databases or two schemas | `sqlite.org/sqldiff.html` |
| checksumming a database's content | `sqlite.org/dbhash.html` |
| where the bytes went, per table and index | `sqlite.org/sqlanalyze.html` |
| the on-disk file format | `sqlite.org/fileformat2.html` |

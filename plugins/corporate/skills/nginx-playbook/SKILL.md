---
name: nginx-playbook
description: Use when work touches nginx — `nginx.conf`, a `conf.d` drop-in, `sites-available`/`sites-enabled`, a `server`, `location` or `upstream` block, `proxy_pass`, `proxy_set_header`, `proxy_buffering`, `nginx -t` or a reload — or when an app is put behind a reverse proxy, terminates TLS there, streams a response through it, or answers 502/504 only when proxied.
---

# nginx Playbook

## Stack

nginx open source, run as a reverse proxy in front of an application that speaks
HTTP on localhost or a private address. Three nesting levels carry every decision:

| Block | Selected by | Carries |
|---|---|---|
| `server` | the `listen` address:port, then `server_name` | TLS termination, the site's name |
| `upstream` | named, referenced by `proxy_pass` | the backend addresses, `keepalive` |
| `location` | the request URI, by the matching rules below | the whole `proxy_*` surface |

Configuration is one tree assembled by `include`; a distro layout
(`conf.d/*.conf`, `sites-enabled/*`) is only where that tree happens to be split.
**What the running process actually loaded is `nginx -T`, never the file that
looks canonical.**

Our unit of change is a drop-in file we own, added to an include directory the
running config already reads. A `server` block another tool or another site owns
is read, never edited.

Every proxied `location` states four things explicitly and does not inherit them:
`proxy_pass`, the forwarded headers (`Host`, `X-Forwarded-For`,
`X-Forwarded-Proto`), `proxy_http_version 1.1`, and — for a streaming or
long-lived response — `proxy_buffering off` with a raised `proxy_read_timeout`.

## Toolchain

| Job | Command |
|---|---|
| check syntax and that referenced files open | `nginx -t` |
| dump the *effective* config, all includes resolved | `nginx -T` |
| apply a change | `nginx -s reload` |
| rotate logs without dropping connections | `nginx -s reopen` |
| stop gracefully | `nginx -s quit` |
| print version and build flags | `nginx -V` |

`nginx -t`, then `nginx -s reload`. Never `systemctl restart nginx`, never
`stop` followed by `start`, and never a reload that has not been tested first —
a restart drops every in-flight connection on the box, including connections
belonging to sites that are not ours. Reload is signal `HUP`: the master checks
the new configuration, and on failure rolls back and keeps serving the old one,
which is exactly the property a restart throws away. Upstream docs and generated
snippets show `systemctl restart` freely; the translated command is what ends up
in the runbook.

## Obligations by activity

| Activity | Obligation |
|---|---|
| any | `nginx.org/en/docs/` is the authority, exact pages resolved through the alphabetical directive index `nginx.org/en/docs/dirindex.html`. The `http/` module subtree is this playbook's area. `docs.nginx.com` is a different product — NGINX Plus — and documents directives this stack does not have. A fact the pinned tree covers is read there, never asserted from memory |
| choosing an approach | decide in writing whether the instance is ours or shared. On a shared one, name the include directory the drop-in lands in and the blast radius of a bad reload before writing any directive |
| implementing | one drop-in file, owned by us. Per proxied `location`: explicit `proxy_pass`, explicit `Host`, `proxy_http_version 1.1`, and a stated verdict on buffering and timeouts. A directive left implicit is a default accepted on purpose or a defect |
| reviewing | reject a proxied `location` that does not set `Host`, an unpinned `proxy_http_version`, a streaming route left on default buffering or a 60s read timeout, an edit inside someone else's `server` block, and any reload path that is a restart or skips `nginx -t` |
| testing | prove it against the running proxy, not the app's own port: the client's `Host` and scheme arrive intact, a streaming response arrives incrementally rather than at once, and a long-lived connection outlives the read timeout. `nginx -T` before and after is the diff that shows what actually changed |

## Traps

- **`location` is not first-match-wins.** All prefix locations are checked and
  the *longest* one is remembered; regular expressions are then tried in file
  order and the first match wins over it. `=` is an exact match that terminates
  the search, and `^~` on the winning prefix suppresses the regex pass. Reading
  the block top-down gives the wrong answer.
- **`proxy_pass` with a trailing URI rewrites, without one it does not.**
  `proxy_pass http://up/;` replaces the matched location prefix;
  `proxy_pass http://up;` passes the client's URI through. One character, two
  different applications, and a 404 that looks like a routing bug.
- **The forwarded `Host` defaults to `$proxy_host`** — the upstream's name, not
  the client's. Anything the app derives from `Host` (an absolute redirect, a
  cookie domain, an OAuth `redirect_uri`) then points at the internal address.
  `proxy_set_header Host $host;` is not an optimization.
- **`proxy_http_version`'s default depends on the running version**: 1.1 only
  since 1.29.7, 1.0 before it, and the distro packages in the field are older.
  HTTP/1.0 upstream means no chunked transfer, no keepalive, no upgrade — so the
  streaming route hangs on the exact build nobody tested on. State `1.1`.
- **`proxy_buffering` is `on` by default**, and it collects the whole response
  before sending any of it: SSE and chunked output arrive as one lump at the end,
  or never. Streaming needs `proxy_buffering off`. `proxy_request_buffering off`
  is the mirror for a streamed upload.
- **`proxy_read_timeout` is 60s** and counts between two reads, not for the whole
  response. An idle-but-alive stream or WebSocket is cut at exactly 60 seconds,
  which reads as an application-level disconnect.
- **A WebSocket needs the upgrade forwarded**: `Upgrade: $http_upgrade` plus a
  `Connection` header driven by a `map` on `$http_upgrade`. Sending a literal
  `Connection: upgrade` breaks every non-upgrade request through that location.
- **`keepalive` in the `upstream` block requires a cleared `Connection`** on
  versions before 1.29.7; without it every proxied request opens a new TCP
  connection and the connection count, not the app, is what falls over.
- **`client_max_body_size` is 1m**, and the 413 is returned by the proxy before
  the app ever sees the request — so it is invisible in application logs.
- **`proxy_ssl_server_name` is `off`.** Proxying to an HTTPS upstream that serves
  several names by SNI fails the handshake, or silently gets the wrong
  certificate's site.
- **Destructive, never run unprompted:** a reload without a passing `nginx -t`,
  and any edit to a `server` block belonging to another site on a shared
  instance. Both take down something that is not ours, and neither is a step —
  each is a decision.

## Resources

### Skills

None.

### MCP servers

None.

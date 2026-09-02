---
name: cloudflare-playbook
description: Use when an origin sits behind Cloudflare — a proxied (orange-cloud) hostname, an SSL/TLS encryption mode (Automatic, Flexible, Full, Full (strict)), an origin CA certificate, Authenticated Origin Pulls, Always Use HTTPS, `CF-Connecting-IP`, `CF-Ray`, `cf-cache-status`, Browser Integrity Check, Bot Fight Mode, Rocket Loader, a Configuration Rule, or a 520/521/522/524 — or when a request streams, comes from a non-browser client, or redirects, and works straight to the origin but not through the proxy.
---

# Cloudflare Playbook

## Stack

Cloudflare as a reverse proxy in front of an origin we own and can reach
directly. It is a layer *above* the origin's own proxy, not a replacement for
it, and each concern has exactly one owner:

| Concern | Owner |
|---|---|
| the public name resolving to the edge | the DNS record's proxy status |
| edge↔origin encryption and origin validation | the zone's SSL/TLS encryption mode |
| the origin's identity | the origin's certificate |
| origin routing, upstream buffering, upstream timeouts | the origin server |
| everything done to a request before the origin sees it | zone settings and rules |

Three positions, stated flat, and every trap below is a consequence of one of
them:

- **The encryption mode is Full (strict), pinned.** Not Automatic, which is what
  a new zone gets and which re-scans the origin and moves the mode on its own.
- **The redirect from plain HTTP to HTTPS is owned by the edge alone.** Two
  layers doing that job is a redirect loop, not redundancy.
- **Every default-on edge behaviour is accepted in writing or turned off**, and
  it is turned off per route with a Configuration Rule, never zone-wide.

The unit of change is a rule or setting scoped to the hostnames and paths we
own. A zone setting is global to every hostname on the zone, most of which may
not be ours.

## Toolchain

There is no CLI for this surface. It is the dashboard and the zone settings API,
so the commands an agent runs are the ones that *observe* the proxy:

| Job | Command |
|---|---|
| see what the edge actually returns | `curl -sSD - -o /dev/null https://<name>/<path>` |
| confirm a response came through the edge | the `cf-ray` response header |
| see whether the edge served it from cache | the `cf-cache-status` response header |
| compare the same name at the origin, bypassing the edge | `curl --resolve <name>:443:<origin-ip> …` |
| prove a stream arrives incrementally, not as one lump | `curl -N` on the proxied hostname |
| see what the origin received | the origin's log, keyed on `CF-Ray` |

Verify against the proxied hostname, always. Never conclude anything from a
request sent straight to the origin's address: every behaviour in this file is
invisible there, which is exactly why these defects get filed as application
bugs. Never `curl -k` / `--insecure` to make a handshake pass — under Full
(strict) that failure *is* the finding. And never reach for a zone-wide toggle
when a Configuration Rule scoped to the route does the job; the zone carries
hostnames that are not ours.

## Obligations by activity

| Activity | Obligation |
|---|---|
| any | `developers.cloudflare.com` is the index that resolves a question to its page and is the authority; `references/docs-map.md` beside this file maps the decisions this team makes to the exact page. A fact either covers is read there, never asserted from memory, and no blog post, forum answer or dashboard tooltip substitutes for it |
| choosing an approach | before touching a setting, write down two things per route: whether the response streams, and whether its clients are browsers. Those two answers select every setting that follows. Then name the encryption mode and the origin certificate that satisfies it |
| implementing | the encryption mode pinned, not Automatic; the HTTP→HTTPS redirect at one layer; one written verdict per default-on behaviour that touches the route — response body buffering, compression, Browser Integrity Check, bot challenges, content rewriters. A behaviour left unexamined is a default accepted by accident |
| reviewing | reject Flexible or Full without strict, an origin that also redirects to HTTPS, a streaming route left on standard response buffering or subject to the 125s read timeout, an origin that trusts `X-Forwarded-For` for the client IP, a machine-to-machine route left under a challenge, and a zone-wide toggle used where a scoped rule would do |
| testing | prove it through the proxied hostname with a client that is not a browser and carries no cookies: a streaming response arrives incrementally, a long-lived response outlives the read timeout or is proven not to need to, the origin logs the real client IP, and the redirect resolves in one hop |

## Traps

- **A new zone is on Automatic SSL/TLS, and it moves.** Cloudflare scans the
  origin, then rolls a new encryption mode out from 1% of traffic upward. A mode
  nobody chose can change under a working deployment; pin Full (strict).
- **Flexible is plaintext edge→origin.** The padlock is real and the second hop
  is not, and an origin that redirects HTTP to HTTPS under it loops forever —
  the origin sees `http`, redirects, and the edge asks again on `http`.
- **Full does not validate the origin certificate** — expired or self-signed
  passes. Only Full (strict) makes the second hop authenticated, and only
  Authenticated Origin Pulls stops anyone who learns the origin IP from
  connecting to it directly.
- **An Origin CA certificate is not browser-trusted.** It is valid only for the
  edge→origin hop, so the moment a hostname is un-proxied or the zone is paused,
  every visitor gets a certificate error.
- **Response body buffering is on by default.** The edge holds a prefix of the
  response to inspect it for WAF and Bot Management, which is the edge-side twin
  of an origin buffering a stream: SSE and chunked output arrive late or in one
  piece. Turning it off is a per-route Configuration Rule, and it costs body
  inspection on that route — a trade to state, not to make silently.
- **Responses are re-compressed unless the origin says not to.** A
  `cache-control: no-transform` on the response is what opts a route out.
- **The origin read timeout is 125 seconds and is not ours to change** outside
  Enterprise, where it goes to 6,000. A long-running or idle-but-alive response
  is cut as a 524 that reads exactly like an application-side disconnect. The
  documented workaround — move it to a DNS-only hostname — trades every
  protection on the zone for it, so it is a decision, never a fix.
- **The client IP is `CF-Connecting-IP`.** `X-Forwarded-For` arrives with the
  edge appended to whatever the client sent, so an origin that reads it
  unconditionally rate-limits and audits the wrong address — and trusts a value
  the client chose.
- **The edge overwrites request headers on the way through**: `Accept-Encoding`
  becomes `br, gzip` and `Connection` becomes `Keep-Alive`, whatever the client
  sent. `X-Forwarded-Proto` reports what the *visitor* used, so an origin
  deriving its own scheme from it under a non-strict mode gets the wrong answer.
- **Browser Integrity Check is on by default** and challenges a request with no
  user agent or a non-standard one — which is every machine-to-machine client
  written this year. The failure is a challenge page or a 403 that no
  application log explains.
- **Bot Fight Mode cannot be excepted.** It is documented to challenge API and
  mobile traffic, and WAF custom rules cannot skip it — only turning it off, or
  moving to Super Bot Fight Mode, creates an exception.
- **Content rewriters change the response body.** Rocket Loader defers scripts
  with non-standard markup and needs the CSP updated to match; Polish rewrites
  images. A defect that exists only through the proxy is usually one of these.
  Auto Minify is deprecated — a verdict spent on it is a verdict wasted.
- **Only proxied records get any of this.** Only A, AAAA and CNAME can be
  proxied at all, a DNS-only record bypasses every setting on the zone and
  publishes the origin IP, and a proxied record's TTL is fixed at 300s. This is
  how "it works for me" and "it is broken" are both true at the same moment.
- **Destructive, never run unprompted:** changing the zone's encryption mode, or
  toggling any zone-wide setting, on a zone serving hostnames that are not ours.
  One switch, every site on the zone, and no reload to test first.

## Resources

### Skills

`nginx-playbook`, `certbot-playbook`

### MCP servers

None.

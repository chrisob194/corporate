# Cloudflare doc map

`developers.cloudflare.com` is the complete index and the authority. This file is
a shortcut from a decision this team makes to the page that settles it — not a
replacement for the index, and not a summary of what those pages say. A question
not answered below goes to the index.

Scope is the edge proxy in front of an origin we own. DNS zone management,
Workers, Tunnel, Access and R2 are other products with other doc trees; a
question about one of them is out of this file's area.

## Encryption to the origin

| Question | Page |
|---|---|
| what each encryption mode does, and which one a new zone gets | `developers.cloudflare.com/ssl/origin-configuration/ssl-modes/` |
| why Flexible leaves the second hop in plaintext | `developers.cloudflare.com/ssl/origin-configuration/ssl-modes/flexible/` |
| what Full accepts without validating | `developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full/` |
| what Full (strict) requires of the origin certificate | `developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/` |
| forcing HTTPS to the origin regardless of the visitor's scheme | `developers.cloudflare.com/ssl/origin-configuration/ssl-modes/ssl-only-origin-pull/` |
| a certificate for the edge→origin hop only | `developers.cloudflare.com/ssl/origin-configuration/origin-ca/` |
| stopping direct connections that bypass the edge | `developers.cloudflare.com/ssl/origin-configuration/authenticated-origin-pull/` |

## The HTTPS redirect

| Question | Page |
|---|---|
| redirecting plain HTTP at the edge, and why the origin must not | `developers.cloudflare.com/ssl/edge-certificates/additional-options/always-use-https/` |
| rewriting mixed-content resource URLs | `developers.cloudflare.com/ssl/edge-certificates/additional-options/automatic-https-rewrites/` |

## Buffering, compression and rewriting

| Question | Page |
|---|---|
| every setting a rule can override per request, buffering included | `developers.cloudflare.com/rules/configuration-rules/settings/` |
| what the edge compresses, and the header that opts a response out | `developers.cloudflare.com/speed/optimization/content/compression/` |
| compression scoped by content type or extension | `developers.cloudflare.com/rules/compression-rules/` |
| a rewriter that defers scripts and needs the CSP updated | `developers.cloudflare.com/speed/optimization/content/rocket-loader/` |

## Timeouts and connection limits

| Question | Page |
|---|---|
| every proxy timeout and connection limit, and which are configurable | `developers.cloudflare.com/fundamentals/reference/connection-limits/` |
| what cuts a long-running response, and what can be done about it | `developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/error-524/` |
| telling apart origin down, unreachable, timed out and bad certificate | `developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/` |

## What the origin receives

| Question | Page |
|---|---|
| every header the edge adds, appends or overwrites | `developers.cloudflare.com/fundamentals/reference/http-headers/` |
| whether a response was served from cache, and why not | `developers.cloudflare.com/cache/concepts/cache-responses/` |

## Challenges and non-browser clients

| Question | Page |
|---|---|
| what challenges a request with a missing or unusual user agent | `developers.cloudflare.com/waf/tools/browser-integrity-check/` |
| the bot challenge that cannot be excepted by a rule | `developers.cloudflare.com/bots/get-started/bot-fight-mode/` |
| the version that can be excepted, for API and verified traffic | `developers.cloudflare.com/bots/get-started/super-bot-fight-mode/` |

## Whether any of it applies

| Question | Page |
|---|---|
| proxied vs DNS-only, which record types proxy, what a grey cloud skips | `developers.cloudflare.com/dns/proxy-status/` |

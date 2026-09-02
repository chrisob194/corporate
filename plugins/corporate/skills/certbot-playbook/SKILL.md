---
name: certbot-playbook
description: Use when work touches TLS certificates from an ACME CA — `certbot`, Let's Encrypt, `/etc/letsencrypt`, `fullchain.pem` or `privkey.pem`, `certonly`, `--webroot`, `certbot renew`, a renewal hook, `http-01` or `dns-01`, a wildcard certificate — or when a certificate is expiring, failed to renew, or a served certificate does not match the file on disk.
---

# certbot Playbook

## Stack

certbot as the ACME client for Let's Encrypt, run **as an issuer only**. It
proves control of a name, writes the key and chain under `/etc/letsencrypt/`,
and stops there. It does not configure a web server.

| Concern | Owner | Artifact |
|---|---|---|
| proving control of the name | an authenticator — `--webroot`, or a `dns-01` plugin | files under an existing web root, or a TXT record |
| the key and the chain | certbot | `/etc/letsencrypt/live/<name>/` |
| serving them | our configuration, in version control | a certificate path pointing into `live/` |
| applying a renewal | a deploy hook | an executable in `/etc/letsencrypt/renewal-hooks/deploy/` |

That table is the position, and the reason it holds: renewal repoints the
symlinks under `live/` and nothing else, so a configuration file that names those
paths is correct forever and is never rewritten by a machine. Nothing certbot
does can revert a reviewed change, because certbot never writes into our files.

Certbot also ships *installer* plugins that edit a web server's configuration in
place and then own it. We do not use them — see the toolchain.

## Toolchain

| Job | Command |
|---|---|
| issue a certificate | `certbot certonly --webroot -w <web-root> -d <name>` |
| issue a wildcard, or with port 80 unreachable | `certbot certonly --preferred-challenges dns-01 …` |
| prove renewal works, saving nothing | `certbot renew --dry-run` |
| list what exists and when it expires | `certbot certificates` |
| change the options a renewal replays | `certbot reconfigure --cert-name <name>` |
| retire a certificate | `certbot delete --cert-name <name>` |

`certonly`, always. Never an installer run — not `--nginx`, not `--apache`, not
`certbot run` — because an installer edits a configuration file in place, claims
it, and reapplies that claim unattended at some later renewal. Never a
hand-edited file under `/etc/letsencrypt/renewal/`: `certbot reconfigure` is the
supported path and the docs call hand-editing damaging. Never `rm` under
`/etc/letsencrypt/`: `certbot delete`. And `--force-renewal` is not a way to
investigate a renewal — it spends rate limit and hides the fault. Upstream
tutorials and distro guides lead with the installer; the translated command is
what ends up in the runbook.

## Obligations by activity

| Activity | Obligation |
|---|---|
| any | `eff-certbot.readthedocs.io/en/stable/` is the authority, with `using.html` carrying both the guide and the full command-line option reference. A fact it covers is read there, never asserted from memory, and no community forum post or distro wiki substitutes for it |
| choosing an approach | name the challenge and its precondition in writing before any command: `http-01` requires port 80 to reach *this* origin for *that* exact name; `dns-01` requires a credential for the zone. A wildcard settles it — only `dns-01` issues one |
| implementing | one `certonly` invocation, its flags chosen knowing they will be replayed forever; certificate paths in our configuration point into `live/`, never copies; the reload after a successful renewal is a deploy hook, committed and reviewed like any other code |
| reviewing | reject an installer invocation, a copied `.pem`, a `--force-renewal` in any script, a hand-edited renewal configuration, a certificate with no deploy hook to apply it, and any renewal path proven by a plain `renew` instead of `--dry-run` |
| testing | `certbot renew --dry-run` is the proof, because it exercises the stored flags and the hooks against staging without writing. Then verify what is actually served — the chain a client receives, and its expiry — not the file on disk |

## Traps

- **Renewal replays the flags recorded at issuance.** `certbot renew` reuses the
  plugin and the options stored in `/etc/letsencrypt/renewal/<name>.conf`. The
  command typed once by hand is the command that runs unattended for years —
  which is exactly how a single installer run reaches back and rewrites a
  reviewed configuration months later, with nobody at the keyboard.
- **`live/` holds symlinks into `archive/`.** Point the server at those paths;
  a `.pem` copied elsewhere keeps serving the old certificate after the next
  renewal and expires while the file on disk looks perfectly current.
- **`renew` is a no-op most of the time.** It acts only when less than 1/3 of the
  lifetime remains — 1/2 for certificates of 10 days or less, since 4.0.0. A
  clean `certbot renew` proves nothing at all about renewal. `--dry-run` does.
- **`--force-renewal` counts against rate limits** and issues a fresh certificate
  regardless of expiry. Reaching for it to test a fix burns the budget that the
  real renewal will need.
- **Renewal configuration is not a config file to edit.** Hand-editing
  `/etc/letsencrypt/renewal/*.conf` is documented as damaging;
  `certbot reconfigure` (2.3.0+) changes it and dry-runs the result first.
- **`http-01` validates against the origin on port 80, for that exact name.**
  Anything in front that terminates, redirects or filters that request is a
  precondition to state and verify before issuance, never to assume.
- **`dns-01` is the only wildcard path**, and it moves the trust boundary: the
  renewal now holds a credential that can write the zone.
- **Automatic renewal is a scheduled task, not a property of the certificate.**
  A machine where nothing runs `certbot renew` on a timer has certificates that
  expire silently, and the first symptom is an outage.
- **Destructive, never run unprompted:** an installer invocation against a
  configuration we did not write, `--force-renewal`, and any `rm` under
  `/etc/letsencrypt/`. The first two are silent and delayed; the third loses the
  renewal state along with the key.

## Resources

### Skills

`nginx-playbook`

### MCP servers

None.

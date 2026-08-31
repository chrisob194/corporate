---
name: oauth-playbook
description: Use when work touches OAuth or OpenID Connect — OAuth 2.1, authorization code, PKCE, code_verifier, code_challenge, state, refresh token, client credentials, device code, bearer token, JWT access token, JWKS, scopes, aud, /.well-known/oauth-authorization-server, /.well-known/oauth-protected-resource, token introspection, revocation, dynamic client registration — or when a request names an authorization server, a resource server, or an identity provider.
---

# OAuth Playbook

## Stack

OAuth 2.1 is the baseline, not OAuth 2.0. It consolidates RFC 6749 with PKCE
(RFC 7636), native apps (RFC 8252), browser-based apps (RFC 10017) and the
security BCP (RFC 9700) folded in. It is still a draft — `draft-ietf-oauth-v2-1`
— and it is nonetheless what to build to. RFC 9700 is published and normative on
its own.

Four roles. Naming which one is being built is the first decision, before any
grant is chosen:

- **Resource owner** — the human who grants access.
- **Client** — the app asking. **Public** if it cannot keep a secret (SPA,
  native, CLI), **confidential** if it can (a server). That is the whole
  distinction; nothing else turns on it.
- **Authorization server (AS)** — issues tokens, owns login, consent, keys,
  registration and revocation.
- **Resource server (RS)** — holds the API, validates tokens, authorizes.

Live grant types:

| Situation | Grant |
|---|---|
| a user is present | authorization code + PKCE |
| machine to machine, no user | client credentials |
| input-limited device | device code (RFC 8628) |
| renewing without the user | refresh token |

Implicit and resource-owner-password are gone — removed in 2.1, forbidden or
not-recommended by RFC 9700.

Discovery is two documents: `/.well-known/oauth-authorization-server` (AS
metadata, RFC 8414) and `/.well-known/oauth-protected-resource` (RS metadata,
RFC 9728). Access tokens are opaque or JWT (RFC 9068), and which one it is is
the AS's decision.

## Toolchain

| Job | Command |
|---|---|
| fetch AS metadata | `curl -s "$AS/.well-known/oauth-authorization-server" \| jq` |
| fetch RS metadata | `curl -s "$RS/.well-known/oauth-protected-resource" \| jq` |
| read the challenge | `curl -si "$RS/api" \| grep -i www-authenticate` |
| decode a JWT payload | `cut -d. -f2 <<<"$TOKEN" \| base64 -d 2>/dev/null \| jq` |
| fetch the signing keys | `curl -s "$(curl -s "$AS/.well-known/oauth-authorization-server" \| jq -r .jwks_uri)" \| jq` |
| introspect a token | `curl -s -u "$ID:$SECRET" -d "token=$TOKEN" "$AS/introspect" \| jq` |
| revoke a token | `curl -s -u "$ID:$SECRET" -d "token=$TOKEN" "$AS/revoke"` |

Decoding a JWT is not validating one — the commands above inspect, they never
authorize.

Never hand-roll the primitives: the PKCE challenge, the `state`/`nonce` entropy,
the JWT signature check, the JWKS fetch and cache. A conformant library or the
identity provider owns them, and a re-implementation is a vulnerability, not a
shortcut. Never invent a request or metadata parameter either — a conformant
server ignores what it does not recognise, so the bug surfaces later as an
unexplained scope or audience rather than as an error.

## Obligations by activity

| Activity | Obligation |
|---|---|
| any | `oauth.net/2/` is the index that resolves a question to its RFC, and `rfc-editor.org/rfc/` holds the normative text and is the authority. A fact either covers is read there, never asserted from memory, and no blog post, vendor guide or SDK README substitutes for it |
| choosing an approach | name the role being built and the grant before anything else, and say whether the client is public or confidential. Prefer an existing identity provider to a hand-built AS; if an AS is built, say in the same message what it now owns — login, consent, key rotation, client registration, revocation, session |
| implementing a client | authorization code with PKCE `S256`, always, confidential clients included. Verify PKCE support from `code_challenge_methods_supported` and refuse to proceed if it is absent. Exact pre-registered `redirect_uri`. Generate, store and compare `state`. Record the expected `issuer` before redirecting and validate `iss` on the response (RFC 9207) before the code goes anywhere. Request least-privilege scope. Send `resource` (RFC 8707) where the AS supports it |
| implementing a resource server | validate every token before processing the request: signature against the JWKS, `iss`, `exp`, and `aud` — this server's own identifier must be in it. Anything failing is `401`. A scope shortfall is `403` with `WWW-Authenticate` naming the scopes needed. Never forward an inbound token to an upstream API |
| implementing an authorization server | publish RFC 8414 metadata. Match `redirect_uri` by exact string, the loopback port being the only exception. Enforce the `code_verifier` and reject a PKCE downgrade — a token request carrying a verifier for an authorization request that carried no challenge. Short-lived access tokens. For public clients, rotate refresh tokens or sender-constrain them. Audience-restrict tokens. HTTPS on every endpoint |
| reviewing | reject the implicit and password grants, `code_challenge_method=plain`, a token in a query string, a wildcard or prefix-matched redirect URI, an unvalidated `aud`, a token logged or persisted in the clear, and a refresh token issued to a public client with neither rotation nor sender-constraint |
| testing | the negative cases are the suite: wrong audience, expired, tampered signature, wrong issuer, mismatched `state`, replayed authorization code, missing scope. A green happy path proves nothing here |

## Traps

- OpenID Connect is authentication layered on OAuth. An `id_token` is not an
  access token; presenting one at a resource server is a category error, and
  accepting one there is a hole.
- Scopes are not permissions. A scope says what was asked for and consented to;
  the resource server still has to authorize the actual call.
- Opaque and JWT access tokens are validated by different mechanisms —
  introspection against the AS versus a local signature check — and the format
  is the AS's choice. A client that inspects a token's contents has coupled
  itself to a decision that is not its own.
- `aud` is the check most often skipped, and skipping it means any valid token
  from that issuer, for any audience, opens this server.
- PKCE does not replace `state`. PKCE defends the authorization code; `state`
  binds the response to this browser session.
- The redirect URI is matched as an exact string. A trailing slash, a differing
  port, an uppercase host — each is a different URI.
- Refresh token rotation kills the old token on use. A client that retries a
  failed refresh with the same token logs itself out.
- Bearer tokens carry no proof of possession: whoever holds one can use it. Only
  mTLS (RFC 8705) or DPoP (RFC 9449) binds a token to its holder.
- A confidential client's secret is only confidential server-side. An SPA or a
  native app has nowhere to keep one, which is exactly what makes it public — a
  secret shipped in either is public too.
- A client talking to more than one authorization server is exposed to mix-up
  unless it identifies the issuer, by `iss` or by a distinct redirect URI per AS.

## Resources

### Skills

- `mcp-oauth-playbook`

### MCP servers

None.

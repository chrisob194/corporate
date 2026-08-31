---
name: mcp-oauth-playbook
description: Use when securing a remote MCP server or connecting a client to one — MCP authorization, protected resource metadata, /.well-known/oauth-protected-resource, the resource_metadata challenge parameter, the resource parameter on an MCP token request, client ID metadata documents, dynamic client registration against an MCP authorization server, or a 401/403 WWW-Authenticate returned by an MCP endpoint.
---

# MCP OAuth Playbook

## Stack

An MCP server is an OAuth 2.1 **resource server**. The authorization server is a
separate entity and its implementation is outside MCP's scope — an MCP server
that issues its own tokens has built something the spec does not ask for.

HTTP transports only. A stdio server takes credentials from the environment and
none of this applies to it.

The discovery chain, in order:

1. Client sends an MCP request with no token.
2. Server answers `401` with `WWW-Authenticate: Bearer resource_metadata="…"`,
   and `scope="…"` naming what the operation needs.
3. Client fetches the protected resource metadata (RFC 9728) and reads
   `authorization_servers`.
4. Client fetches AS metadata — RFC 8414 or OpenID Connect Discovery; a client
   supports both, an AS provides at least one.
5. Client obtains an identity, then runs authorization code + PKCE `S256` with
   the `resource` parameter, and validates `iss` on the response.
6. Every subsequent request carries `Authorization: Bearer <token>`.

Client identity has three mechanisms, in priority order: **client ID metadata
documents** (an HTTPS URL used directly as the `client_id`, which the AS fetches),
**pre-registration**, and **dynamic client registration** (RFC 7591) — DCR is
deprecated in the current spec draft and retained for authorization servers that
do not yet support metadata documents.

The canonical server URI is the identifier everything binds to: scheme required,
no fragment, no trailing slash, and as specific as the client can make it —
down to the path component where one distinguishes this server from another at
the same host.

## Toolchain

| Job | Command |
|---|---|
| provoke the challenge | `curl -si "$MCP" -X POST -H 'content-type: application/json' -d '{}' \| grep -i www-authenticate` |
| fetch RS metadata | `curl -s "$MCP/.well-known/oauth-protected-resource" \| jq` |
| find the AS | `curl -s "$MCP/.well-known/oauth-protected-resource" \| jq -r '.authorization_servers[]'` |
| check PKCE support | `curl -s "$AS/.well-known/oauth-authorization-server" \| jq .code_challenge_methods_supported` |
| check issuer identification | `curl -s "$AS/.well-known/oauth-authorization-server" \| jq .authorization_response_iss_parameter_supported` |
| confirm the audience | `cut -d. -f2 <<<"$TOKEN" \| base64 -d 2>/dev/null \| jq '.aud, .iss'` |

Never front an MCP server with a bespoke token check. The audience validation the
spec mandates is the requirement; a hand-written substitute for it is the defect
this profile exists to prevent.

## Obligations by activity

| Activity | Obligation |
|---|---|
| any | `modelcontextprotocol.io/llms.txt` resolves exact pages, and the authorization subtree of `modelcontextprotocol.io/specification` is the authority for this profile. A fact it covers is read there, never asserted from memory, and no vendor guide or SDK README substitutes for it |
| implementing a server | serve RFC 9728 protected resource metadata. Include `scope` in the `WWW-Authenticate` challenge, and put every scope the operation needs in one challenge rather than one per round trip. Validate that the token's audience is this server's canonical URI, and reject everything else. `401` for missing, invalid or expired; `403` with `error="insufficient_scope"`, the needed `scope`, and `resource_metadata` for a scope shortfall |
| implementing a client | send `resource` on both the authorization request and the token request, regardless of whether the AS is known to support it, using the canonical URI. Record the issuer from validated AS metadata alongside the PKCE verifier, and apply the RFC 9207 `iss` check before the code reaches any token endpoint — including on error responses, whose contents are not acted on or displayed if the check fails. Compare `iss` as a raw string, with no case folding, port elision, trailing-slash or percent-encoding normalisation. Refuse to proceed if `code_challenge_methods_supported` is absent |
| handling a scope challenge | re-authorize with the **union** of the scopes previously requested and the scopes in the current challenge — never the challenge alone. Bound the retries and track attempts per resource and operation. A `client_credentials` client may abort instead |
| reviewing | reject token passthrough to an upstream API, a missing or unvalidated `aud`, a token accepted that was issued for another resource, an AS embedded in the MCP server, and a proxy with a static client ID that forwards to a third-party AS without per-client user consent |

## Traps

- Building an authorization server into the MCP server. The spec puts it
  outside; the server's job is validation, metadata and challenges.
- Reaching for dynamic client registration first. It is the deprecated fallback;
  client ID metadata documents come first, pre-registration second.
- Passing the client's token upstream when the MCP server calls a third-party
  API. That is the confused-deputy hole: the upstream call needs its own token,
  issued by the upstream authorization server, and the inbound token is never
  forwarded or transited.
- Re-authorizing with only the challenged scope, silently dropping permissions
  already granted for other operations.
- Treating a `403` as fatal. With `insufficient_scope` it is a step-up prompt,
  not a dead end.
- Applying any of this to a stdio server, which authenticates through its
  environment and has no HTTP layer to challenge on.
- Assuming the `resource` parameter can be skipped when the AS does not appear to
  support it. It is sent unconditionally; an AS that ignores it is not harmed,
  and one that honours it is what binds the token's audience.
- Sending a token to an MCP server that its own authorization server did not
  issue. The client is bound to the AS the discovery chain produced, not to
  whichever token it happens to hold.

## Resources

### Skills

- `oauth-playbook`
- `typescript-mcp-playbook`

### MCP servers

None.

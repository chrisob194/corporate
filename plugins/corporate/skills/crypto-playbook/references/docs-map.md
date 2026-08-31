# Crypto doc map

`cheatsheetseries.owasp.org` is the complete index and the authority. This file
is a shortcut from a decision this team makes to the page that settles it — not
a replacement for the index, and not a summary of what those pages say. A
question not answered below goes to the index. Where a parameter has to be
justified rather than adopted, the normative spec is listed alongside.

## Storing a secret people choose

| Question | Page |
|---|---|
| which algorithm, and what its parameters mean | `cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html` |
| salting, peppering, and what each actually defends | `cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html` |
| bcrypt's input limit and pre-hashing | `cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html` |
| upgrading a work factor, and legacy hashes | `cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html` |
| what a login is allowed to reveal | `cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html` |
| a reset flow that leaks nothing | `cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html` |
| rate limits and breached-password checks | `cheatsheetseries.owasp.org/cheatsheets/Credential_Stuffing_Prevention_Cheat_Sheet.html` |
| a second factor and its recovery codes | `cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html` |

## Storing a secret the server issues

| Question | Page |
|---|---|
| session id generation, lifetime and invalidation | `cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html` |
| a credential that belongs to the deployment, not a person | `cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html` |

## Encrypting data

| Question | Page |
|---|---|
| algorithm and mode selection, randomness sources | `cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html` |
| where a key lives, how it rotates, who can use it | `cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html` |
| protecting data in transit rather than at rest | `cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html` |

## Normative parameters

| Question | Page |
|---|---|
| Argon2 variants, parameters and their meaning | `rfc-editor.org/rfc/rfc9106.html` |
| PBKDF2, its salt and iteration count | `rfc-editor.org/rfc/rfc8018.html` |
| HMAC construction | `rfc-editor.org/rfc/rfc2104.html` |
| deriving several keys from one secret | `rfc-editor.org/rfc/rfc5869.html` |
| verifier requirements a compliance ask cites | `pages.nist.gov/800-63-3/sp800-63b.html` |

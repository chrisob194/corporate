# Spec — Stop duplicate messages on issue records

## Problem
Someone opening a freshly-filed record sees its text twice in a row — once as the opening post, once again as the entry directly beneath it — before anything has happened to that record. This reads as duplication and makes the record hard to follow when scrolling, even though nothing is actually duplicated in storage: the repeat is a deliberate side effect of how the opening post is written to also be recoverable later, and no fault was found on inspection. The cost is readability, paid by anyone opening a record for the first time.

## User scenarios
1. A record is filed and nobody has touched it since. Before: opening it shows the same block of text twice, back-to-back — as the opening post and as the entry right after it. After: the same record shows that text once.
2. A record that was fixed under this brief is later amended. Before this brief existed, the same back-to-back repetition did not occur on amendment. After the fix, amending the record still does not produce that back-to-back repetition anywhere in the record — the fix does not trade a duplication on first read for one on amendment.
3. Someone opens a record that was filed before this fix shipped. Before and after: that record is unaffected — it is read exactly as it was filed, whether or not that means it still shows the old repetition.

## Functional requirements
1. Opening a record that has not been amended since it was filed does not show its filed text twice, back-to-back, between the opening post and the entry immediately below it.
2. The opening post is not required to hold text that reproduces the record's original wording once the record has been amended — recoverability of the original wording is no longer a requirement placed on the opening post.
3. Amending a record does not introduce a new instance of the same block of text appearing twice, back-to-back, between any two adjacent entries — the fix must hold after an amendment, not just on first opening.
4. A record filed before this fix ships is not required to change how it currently reads.
5. If the original wording of an opening post is preserved by some means after an amendment, that preservation does not itself reproduce the back-to-back repetition described in requirement 1.

## Non-goals
- Changing what is stored against a record, or which events get recorded — no duplicate storage was found, and this brief does not touch storage.
- Redesigning the amendment flow beyond whatever is needed to stop the back-to-back repetition.
- Retrofitting or altering records filed before this fix — this covers records filed going forward only.
- Guaranteeing that an opening post's original wording can be recovered after amendment — that guarantee is explicitly dropped in favor of readability. A mechanism that keeps some record of what changed is allowed but not required.

## Key entities
- **Record**: the whole filed item a reader opens — an opening post followed by a sequence of entries.
- **Opening post**: the first, editable block of a record, the one that can later be amended.
- **Entry**: something added below the opening post at filing time or afterward.
- **Filed text**: the wording captured when the record is first created.
- **Amendment**: a later edit to the opening post, made after the record was originally filed.

## Assumptions
- "Freshly-filed" means a record that has not yet been amended; once it has been amended, requirement 1's back-to-back check no longer applies to it in the same way requirement 3 describes.
- The repetition in scope is specifically the opening post and the single entry immediately following it — other entries further down the record are not implicated by this brief.
- Requiring readability on first open outweighs requiring the opening post to double as a recovery copy; this trade was already settled in the captured brief and is treated here as agreed, not reopened.

## Second ticket
none — this is one readability problem with one convention change, not a bundle of separable asks.

## Loop hints
- Ends when: a freshly-filed record shows its filed text once, not twice, across the opening post and the entry directly below it.
- Repeats over: records filed after the fix.
- Partial value: a fix that removes the back-to-back repetition for newly filed records is worth having on its own, even if records filed before the fix keep showing it.
- Human looks after: a couple of attempts that fail to produce a freshly-filed record read as non-duplicated — repeating without new information burns cycles.

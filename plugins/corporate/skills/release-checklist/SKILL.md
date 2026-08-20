---
name: release-checklist
description: Use when cutting a release or tagging a version — verifies tests, changelog, version bump and tag before publishing. EXAMPLE SKILL shipped as a template.
---

# Release Checklist

EXAMPLE SKILL — shipped as a template. Adapt or delete.

Work the list in order. Do not skip a step because it "looks fine" — run the
command and read the output. Evidence before assertions.

## Checklist

1. **Clean tree** — `git status --short` returns nothing. Stash or commit first.
2. **Tests pass** — run the project's test command and paste the summary line.
3. **Version bumped** — the manifest version is higher than the latest tag
   (`git describe --tags --abbrev=0`).
4. **Changelog updated** — a section exists for the new version, and every entry
   maps to a real commit in the range.
5. **Tag** — `git tag -a v<version> -m "v<version>"`. Never move an existing tag.
6. **Report** — state the version, the test result, and what was skipped.

## Failure rule

If any step fails, stop and report the failing step with its output. Do not
continue to the tag. A partially cut release is worse than an uncut one.

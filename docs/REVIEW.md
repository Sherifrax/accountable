# Review standard

The reviewer agent follows this file. Findings are reported by severity, as the agent describes.

## Spec checks

- **Matches the spec:** the change does what `docs/spec.md` and the area files in `docs/specs/` say, with nothing missing and nothing extra. Read `docs/spec.md` first, then the area files the change touches, using its index. Where code and spec disagree, the spec wins unless the change is meant to change it.
- **Described by the spec:** every behavior the change adds or alters has a home in `docs/spec.md` or an area file. Flag code the spec doesn't describe.
- **Spec kept up to date:** if the change alters behavior, the affected area files in `docs/specs/` are updated in the same change. If the summary or the index in `docs/spec.md` no longer matches, that is a finding too.
- **Requirement IDs:** an ID (R-…) keeps its meaning. A changed or removed requirement is reflected in the tests that reference it.

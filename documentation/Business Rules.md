# Business Rules

This document defines the core business rules for the Update Time plugin. These rules MUST be respected in all implementations unless explicitly approved otherwise.

---

## Invariants

1. **Never modify files in excluded folders.** `settings.ignoredFolders` is authoritative; a file must be skipped before front matter is read or written when its path equals an entry or lies under it (path-segment match: entry `Journal` matches `Journal/x.md` but not `Journal-Archive/x.md`). Matching is centralized in `isInIgnoredFolder`. Blank/whitespace-only entries are ignored — a naive `startsWith('')` prefix check would match every path and silently disable updates for the whole vault. The settings UI must also reject blank entries before they are persisted. Rationale: issue #9.
2. **Never overwrite a user-provided `created` value.** The `created` property is only written when it is missing from front matter. Existing values are preserved.
3. **Never overwrite a valid `updated` value unless the debounce window has elapsed.** `updated` is refreshed only when either (a) the property is missing/unparsable, or (b) more than `MINUTES_BETWEEN_SAVES` have passed since the last recorded update.
4. **Skip Excalidraw files.** When the Excalidraw plugin is present, `isExcalidrawFile` must be consulted and matching files skipped.
5. **Skip non-Markdown files and Canvas files.** Only `.md` files participate; `Canvas.md` is explicitly excluded.
6. **Debounce writes.** Enforced by `MINUTES_BETWEEN_SAVES` to avoid fighting active edits and to reduce churn.
7. **This plugin modifies vault data.** Changes are destructive and cannot be reverted by the plugin. Users must back up their vault before enabling it.
8. **No network calls.** The plugin runs fully local. No telemetry, no remote fetch, no third-party services at runtime.
9. **Handle malformed YAML gracefully.** `YAMLParseError` thrown by `processFrontMatter` must be caught and logged; the file must be left untouched.
10. **Use Obsidian's `register*` helpers for every subscription.** The `modify` listener is registered via `this.registerEvent` so it is cleaned up on unload.
11. **Backfill is opt-in and confirmed.** The `backfill-properties` command must show `BackfillConfirmModal` before iterating the vault. The same ignore filters as the live handler apply, and the same "never overwrite a valid `created` value" rule is enforced — the batch path is allowed to bypass the debounce window but never the file filters or invariants 2/4/5.
12. **Never write front matter mid-edit.** The live handler must debounce each file's processing by `settings.saveDelayInSeconds` (default `DEFAULT_SAVE_DELAY_IN_SECONDS`, reset on every change) so writes land only once the user pauses typing — a front-matter write refreshes the editor and would otherwise lose cursor focus (e.g. inside tables). Rationale: issue #7.
13. **Never write when nothing changes.** The live handler must skip the `processFrontMatter` write entirely when applying the rules would not mutate front matter (checked against the cached front matter first). This avoids redundant editor refreshes. Does not apply to the backfill command, which writes per its own counters.
14. **Never react to the plugin's own write.** A front-matter write bumps the file's `mtime` and fires a fresh `modify` event. The live handler must record the post-write `mtime` per file and ignore the `modify` echo whose current `mtime` still equals that recorded value. Without this guard, any `saveDelayInSeconds` greater than `MINUTES_BETWEEN_SAVES` produces a perpetual self-feeding write loop (the freshly-bumped `mtime` always looks newer than the just-written `updated` value). Rationale: runaway-updates regression introduced with #7.
15. **Defer writes for the note currently open in the active editor.** A front-matter write refreshes the editor and tears down the rendered view, which disrupts CSS that targets the properties / live editor DOM. When the live handler's target is the file open in the active leaf, the write is deferred (added to a pending set) and flushed once the user moves to a different note or closes it (driven by `active-leaf-change`). Decision logic, ignore filters, and invariants #2/#4/#5 still apply when the deferred write executes. Rationale: issue raised 2026-07-07 — user-reported "styles don't show" caused by the editor re-render.

---

## Documentation Guidelines

When a new business rule is mentioned:

1. Add it to this document immediately
2. Use a concise format (single line or brief paragraph)
3. Maintain precision - do not lose important details for brevity
4. Include rationale where it adds clarity

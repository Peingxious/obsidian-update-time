/**
 * Determine whether a file path falls inside one of the ignored folders.
 *
 * Matching is path-segment aware: an entry `Journal` matches `Journal/note.md`
 * (and the folder path `Journal` itself) but NOT `Journal-Archive/note.md`. A
 * naive `startsWith` check would wrongly treat the latter as ignored.
 *
 * Empty or whitespace-only entries are skipped. Historically a blank value could
 * leak into `settings.ignoredFolders` (e.g. adding an empty search field), and
 * with a naive prefix check `path.startsWith('')` is always true — silently
 * excluding the entire vault so nothing ever updates. Skipping blanks makes that
 * impossible. Trailing slashes on an entry are tolerated.
 */
export const isInIgnoredFolder = (filePath: string, ignoredFolders: string[]): boolean => {
    return ignoredFolders.some((rawFolder) => {
        const folder = rawFolder.trim().replace(/\/+$/, '')

        if (folder.length === 0) {
            return false
        }

        return filePath === folder || filePath.startsWith(`${folder}/`)
    })
}

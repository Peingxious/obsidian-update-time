/**
 * Decide whether `targetPath` is the file currently open in the active editor
 * leaf.
 *
 * The live handler uses this to avoid rewriting the note the user is actively
 * viewing: a front-matter write refreshes the editor and tears down the
 * rendered view, which disrupts CSS that targets the properties / live editor
 * DOM. When the target is the active file the write is deferred until the user
 * moves to a different note.
 *
 * @param activeFilePath the path of the currently active file, or `undefined`
 *        / `null` when no file is open (e.g. all leaves closed).
 * @param targetPath the path of the file about to be written.
 * @returns `true` when the target is the active file (and should be deferred).
 */
export function isActiveFile(
    activeFilePath: string | null | undefined,
    targetPath: string
): boolean {
    return activeFilePath === targetPath
}

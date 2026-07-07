/**
 * Decide whether a file is empty based on its byte size.
 *
 * Used by the live handler's ignore check. Previously the whole file content
 * was read into memory just to test `.trim().length === 0`; the file's `stat`
 * already carries the byte size, so a zero size is a cheap, allocation-free
 * equivalent for the common (truly empty) case.
 *
 * @param statSize the file's byte size from `TFile.stat.size`.
 * @returns `true` when the file has no content.
 */
export function isEmptyFile(statSize: number): boolean {
    return statSize === 0
}

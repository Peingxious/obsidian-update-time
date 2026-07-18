import { test, expect, describe } from 'bun:test'
import { isInIgnoredFolder } from './is-in-ignored-folder.fn'

describe('isInIgnoredFolder', () => {
    test('returns false when there are no ignored folders', () => {
        expect(isInIgnoredFolder('Notes/a.md', [])).toBe(false)
    })

    test('matches a file inside an ignored folder', () => {
        expect(isInIgnoredFolder('Meetings/note.md', ['Meetings'])).toBe(true)
    })

    test('matches a file inside a nested ignored folder', () => {
        expect(isInIgnoredFolder('Work/Meetings/note.md', ['Work/Meetings'])).toBe(true)
    })

    test('does not match a folder that only shares a name prefix', () => {
        // The classic false positive of a naive startsWith check.
        expect(isInIgnoredFolder('Journal-Archive/note.md', ['Journal'])).toBe(false)
    })

    test('matches the folder path itself', () => {
        expect(isInIgnoredFolder('Meetings', ['Meetings'])).toBe(true)
    })

    test('tolerates a trailing slash on the entry', () => {
        expect(isInIgnoredFolder('Meetings/note.md', ['Meetings/'])).toBe(true)
    })

    test('ignores empty-string entries instead of excluding the whole vault', () => {
        // Regression: `path.startsWith('')` is always true. A blank entry must
        // never cause every file to be treated as ignored.
        expect(isInIgnoredFolder('Notes/a.md', [''])).toBe(false)
    })

    test('ignores whitespace-only entries', () => {
        expect(isInIgnoredFolder('Notes/a.md', ['   '])).toBe(false)
    })

    test('still matches a real entry alongside a blank one', () => {
        expect(isInIgnoredFolder('Meetings/a.md', ['', 'Meetings'])).toBe(true)
    })
})

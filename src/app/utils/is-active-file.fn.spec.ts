import { describe, expect, test } from 'bun:test'
import { isActiveFile } from './is-active-file.fn'

describe('isActiveFile', () => {
    test('true when the target is the active file', () => {
        expect(isActiveFile('note.md', 'note.md')).toBe(true)
    })

    test('false when a different file is active', () => {
        expect(isActiveFile('other.md', 'note.md')).toBe(false)
    })

    test('false when no file is active (all leaves closed)', () => {
        expect(isActiveFile(undefined, 'note.md')).toBe(false)
        expect(isActiveFile(null, 'note.md')).toBe(false)
    })
})

import { describe, expect, test } from 'bun:test'
import { isEmptyFile } from './is-empty-file.fn'

describe('isEmptyFile', () => {
    test('true for a zero-byte file', () => {
        expect(isEmptyFile(0)).toBe(true)
    })

    test('false for any non-empty size', () => {
        expect(isEmptyFile(1)).toBe(false)
        expect(isEmptyFile(2048)).toBe(false)
    })
})

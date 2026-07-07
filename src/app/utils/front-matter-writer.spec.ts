import { describe, expect, test } from 'bun:test'
import { TFile, type FileStats } from 'obsidian'
import { ProcessFrontMatterWriter } from './front-matter-writer'
import { DATE_FORMAT, MINUTES_BETWEEN_SAVES } from '../constants'

function makeFile(): TFile {
    const file = new TFile()
    file.path = 'note.md'
    file.stat = { ctime: 0, mtime: 0 } as unknown as FileStats
    return file
}

describe('ProcessFrontMatterWriter', () => {
    test('applies the computed timestamps through processFrontMatter', async () => {
        const written: Record<string, unknown> = {}
        const fakeApp = {
            fileManager: {
                processFrontMatter: async (
                    _file: unknown,
                    cb: (frontMatter: Record<string, unknown>) => void
                ) => {
                    cb(written)
                }
            }
        }

        const writer = new ProcessFrontMatterWriter(fakeApp as never)
        await writer.apply(makeFile(), {
            cTime: new Date('2024-01-01T10:00:00'),
            mTime: new Date('2024-01-02T11:30:00'),
            createdKey: 'created',
            updatedKey: 'updated',
            dateFormat: DATE_FORMAT,
            minutesBetweenSaves: MINUTES_BETWEEN_SAVES
        })

        expect(written['created']).toBe('2024-01-01T10:00')
        expect(written['updated']).toBe('2024-01-02T11:30')
    })

    test('honors custom property names', async () => {
        const written: Record<string, unknown> = {}
        const fakeApp = {
            fileManager: {
                processFrontMatter: async (
                    _file: unknown,
                    cb: (frontMatter: Record<string, unknown>) => void
                ) => {
                    cb(written)
                }
            }
        }

        const writer = new ProcessFrontMatterWriter(fakeApp as never)
        await writer.apply(makeFile(), {
            cTime: new Date('2024-01-01T10:00:00'),
            mTime: new Date('2024-01-02T11:30:00'),
            createdKey: 'createdAt',
            updatedKey: 'updatedAt',
            dateFormat: DATE_FORMAT,
            minutesBetweenSaves: MINUTES_BETWEEN_SAVES
        })

        expect(written['createdAt']).toBe('2024-01-01T10:00')
        expect(written['updatedAt']).toBe('2024-01-02T11:30')
        expect(written['created']).toBeUndefined()
        expect(written['updated']).toBeUndefined()
    })
})

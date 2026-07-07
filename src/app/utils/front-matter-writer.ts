import type { App, TFile } from 'obsidian'
import { applyTimestampsToFrontMatter } from './apply-timestamps-to-front-matter.fn'

/**
 * The timestamp values the live handler computes and wants written to a file's
 * front matter. Free of any `frontMatter` reference so the same input drives
 * both the "would this change anything?" probe and the real write.
 */
export interface TimestampInput {
    cTime: Date
    mTime: Date
    createdKey: string
    updatedKey: string
    dateFormat: string
    minutesBetweenSaves: number
}

/**
 * Seam between "decide what timestamps a file needs" and "actually write them
 * to disk". Extracted so the write mechanism (today `processFrontMatter`, a
 * full-file rewrite that refreshes the editor) can be swapped or wrapped
 * without touching the live handler's decision logic. This is what makes the
 * "don't rewrite the note the user is actively viewing" behaviour possible.
 */
export interface FrontMatterWriter {
    apply(file: TFile, input: TimestampInput): Promise<void>
}

/**
 * Default writer: delegates to Obsidian's `fileManager.processFrontMatter`,
 * which re-parses and rewrites the whole note. Preserves every business rule
 * because `applyTimestampsToFrontMatter` is the same pure function used by the
 * pre-write probe.
 */
export class ProcessFrontMatterWriter implements FrontMatterWriter {
    constructor(private readonly app: App) {}

    async apply(file: TFile, input: TimestampInput): Promise<void> {
        await this.app.fileManager.processFrontMatter(
            file,
            (frontMatter: Record<string, unknown>) => {
                applyTimestampsToFrontMatter({ frontMatter, ...input })
            }
        )
    }
}

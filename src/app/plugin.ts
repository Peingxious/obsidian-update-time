import { registerWhatsNewView } from './whats-new'
import { debounce, Plugin, TAbstractFile, TFile } from 'obsidian'
import type { Debouncer } from 'obsidian'
import { DEFAULT_SETTINGS } from './types'
import type { PluginSettings } from './types'
import { SettingsTab } from './settingTab'
import { log } from './utils/log'
import { isExcalidrawFile } from './utils/is-excalidraw-file.fn'
import { isInIgnoredFolder } from './utils/is-in-ignored-folder.fn'
import {
    DATE_FORMAT,
    DEFAULT_CANVAS_FILE_NAME,
    MARKDOWN_FILE_EXTENSION,
    MINUTES_BETWEEN_SAVES,
    PROPERTY_CREATED,
    PROPERTY_UPDATED
} from './constants'
import { parseDate } from './utils/parse-date.fn'
import { hasName } from './utils/has-name.fn'
import { resolvePropertyName } from './utils/resolve-property-name.fn'
import { applyTimestampsToFrontMatter } from './utils/apply-timestamps-to-front-matter.fn'
import { isSelfInducedModify } from './utils/is-self-induced-modify.fn'
import {
    ProcessFrontMatterWriter,
    type FrontMatterWriter,
    type TimestampInput
} from './utils/front-matter-writer'
import { isActiveFile } from './utils/is-active-file.fn'
import { isEmptyFile } from './utils/is-empty-file.fn'
import { registerCommands } from './commands'

export class UpdateTimePlugin extends Plugin {
    /**
     * The plugin settings are immutable
     */
    override settings: PluginSettings = { ...DEFAULT_SETTINGS }

    /**
     * Per-file debouncers. Each changed file is processed only once typing has
     * paused for `saveDelayInSeconds`, so front-matter writes never land in the
     * middle of an edit (which would refresh the editor and lose cursor focus).
     */
    private readonly debouncers = new Map<string, Debouncer<[TFile], void>>()

    /**
     * The `mtime` of the last front-matter write the plugin performed, per file.
     *
     * Writing front matter bumps the file's `mtime` and fires another `modify`
     * event. This map lets the plugin recognise that echo and ignore it, so it
     * never reacts to its own write — which, with a save delay larger than
     * `MINUTES_BETWEEN_SAVES`, would otherwise loop forever.
     */
    private readonly lastWriteMtimes = new Map<string, number>()

    /**
     * The write mechanism for front-matter timestamps, behind a seam so it can
     * be swapped without touching the decision logic. Set in `onload`.
     */
    private writer!: FrontMatterWriter

    /**
     * Paths whose write was deferred because the note is the file currently
     * open in the active editor. Flushed (written) once the user moves to a
     * different note, so the live view is never refreshed under the user.
     */
    private readonly pendingWrites = new Set<string>()

    /**
     * Executed as soon as the plugin loads
     */
    override async onload() {
        // Must run before anything can call saveData (fresh-install detection)
        registerWhatsNewView(this)
        log('Initializing', 'debug')
        await this.loadSettings()

        this.writer = new ProcessFrontMatterWriter(this.app)

        this.setupEventHandlers()

        registerCommands(this)

        // Add a settings screen for the plugin
        this.addSettingTab(new SettingsTab(this.app, this))
    }

    override onunload() {
        this.debouncers.forEach((debouncer) => debouncer.cancel())
        this.debouncers.clear()
        this.lastWriteMtimes.clear()
        // Best-effort flush of deferred writes before teardown. Processed
        // asynchronously; Obsidian may unload before they complete, but the
        // file's own mtime remains the source of truth.
        this.pendingWrites.forEach((path) => {
            const file = this.app.vault.getAbstractFileByPath(path)
            if (file instanceof TFile) {
                void this.processFile(file)
            }
        })
        this.pendingWrites.clear()
    }

    /**
     * Load the plugin settings
     */
    async loadSettings() {
        log('Loading settings', 'debug')
        let loadedSettings = (await this.loadData()) as PluginSettings

        if (!loadedSettings) {
            log('Using default settings', 'debug')
            loadedSettings = { ...DEFAULT_SETTINGS }
            return
        }

        let needToSaveSettings = false

        this.settings = { ...this.settings }
        if (
            loadedSettings.ignoredFolders !== undefined &&
            loadedSettings.ignoredFolders !== null &&
            Array.isArray(loadedSettings.ignoredFolders)
        ) {
            this.settings.ignoredFolders = loadedSettings.ignoredFolders
        } else {
            log('The loaded settings miss the [ignoredFolders] property', 'debug')
            needToSaveSettings = true
        }

        if (typeof loadedSettings.createdPropertyName === 'string') {
            this.settings.createdPropertyName = loadedSettings.createdPropertyName
        } else {
            log('The loaded settings miss the [createdPropertyName] property', 'debug')
            needToSaveSettings = true
        }

        if (typeof loadedSettings.updatedPropertyName === 'string') {
            this.settings.updatedPropertyName = loadedSettings.updatedPropertyName
        } else {
            log('The loaded settings miss the [updatedPropertyName] property', 'debug')
            needToSaveSettings = true
        }

        if (
            typeof loadedSettings.saveDelayInSeconds === 'number' &&
            Number.isFinite(loadedSettings.saveDelayInSeconds) &&
            loadedSettings.saveDelayInSeconds >= 0
        ) {
            this.settings.saveDelayInSeconds = loadedSettings.saveDelayInSeconds
        } else {
            log('The loaded settings miss the [saveDelayInSeconds] property', 'debug')
            needToSaveSettings = true
        }

        log(`Settings loaded`, 'debug', loadedSettings)

        if (needToSaveSettings) {
            void this.saveSettings()
        }
    }

    /**
     * Save the plugin settings
     */
    async saveSettings() {
        log('Saving settings', 'debug', this.settings)
        await this.saveData(this.settings)
        // Drop existing debouncers so a changed save delay takes effect immediately.
        this.debouncers.forEach((debouncer) => debouncer.cancel())
        this.debouncers.clear()
        this.lastWriteMtimes.clear()
        log('Settings saved', 'debug', this.settings)
    }

    /**
     * Add the event handlers
     */
    setupEventHandlers() {
        //log('Adding event handlers', 'debug');

        this.registerEvent(
            this.app.vault.on('modify', (file) => {
                this.handleFileChange(file)
            })
        )

        // Candidate 4: prune per-file state for files that disappear or move so
        // the debouncer / echo / pending maps cannot grow without bound.
        this.registerEvent(
            this.app.vault.on('delete', (file) => {
                if (file instanceof TFile) {
                    this.evict(file.path)
                }
            })
        )
        this.registerEvent(
            this.app.vault.on('rename', (_file, oldPath) => {
                this.evict(oldPath)
            })
        )

        // Candidate 2: flush deferred writes when the user leaves the note that
        // was being actively viewed (or closes it). Registered so it is cleaned
        // up on unload (business rule #10).
        this.registerEvent(
            this.app.workspace.on('active-leaf-change', () => {
                this.flushPendingWrites()
            })
        )
    }

    /**
     * Entry point for the `modify` event. Schedules the file for debounced
     * processing rather than writing immediately, so writes land once typing
     * has paused instead of in the middle of an edit.
     */
    handleFileChange(file: TAbstractFile): void {
        if (!(file instanceof TFile)) {
            return
        }

        let debouncer = this.debouncers.get(file.path)
        if (!debouncer) {
            const delayMs = Math.max(0, this.settings.saveDelayInSeconds) * 1000
            debouncer = debounce(
                (changedFile: TFile) => {
                    void this.processFile(changedFile)
                },
                delayMs,
                true
            )
            this.debouncers.set(file.path, debouncer)
        }

        debouncer(file)
    }

    /**
     * Update the created / updated front-matter properties of a file.
     *
     * The file is only written when something actually changes, so unchanged
     * notes never trigger an editor refresh (which would lose cursor focus).
     */
    async processFile(file: TFile): Promise<void> {
        // Ignore the `modify` echo produced by our own front-matter write. Each
        // write is consumed once so the next genuine change is still processed.
        const lastWriteMtime = this.lastWriteMtimes.get(file.path)
        if (lastWriteMtime !== undefined) {
            this.lastWriteMtimes.delete(file.path)
            if (isSelfInducedModify(lastWriteMtime, file.stat.mtime)) {
                return
            }
        }

        const shouldBeIgnored = await this.shouldFileBeIgnored(file)
        if (shouldBeIgnored) {
            return
        }

        const createdKey = resolvePropertyName(this.settings.createdPropertyName, PROPERTY_CREATED)
        const updatedKey = resolvePropertyName(this.settings.updatedPropertyName, PROPERTY_UPDATED)

        const cTime = parseDate(file.stat.ctime, DATE_FORMAT)
        const mTime = parseDate(file.stat.mtime, DATE_FORMAT)

        if (!mTime || !cTime) {
            log('Could not determine the creation/modification times. Skipping...', 'debug')
            return
        }

        const input: TimestampInput = {
            cTime,
            mTime,
            createdKey,
            updatedKey,
            dateFormat: DATE_FORMAT,
            minutesBetweenSaves: MINUTES_BETWEEN_SAVES
        }

        // Probe the cached front matter first: if nothing would change, skip the
        // write entirely to avoid an unnecessary editor refresh.
        const cachedFrontMatter = {
            ...(this.app.metadataCache.getFileCache(file)?.frontmatter ?? {})
        }
        const wouldChange = applyTimestampsToFrontMatter({
            frontMatter: cachedFrontMatter,
            ...input
        })
        if (!wouldChange) {
            return
        }

        // Candidate 2: never rewrite the note the user is actively viewing. A
        // front-matter write refreshes the editor and tears down the rendered
        // view, which disrupts CSS that targets the properties / live editor
        // DOM. Defer the write until the note is no longer the active file.
        if (isActiveFile(this.app.workspace.getActiveFile()?.path, file.path)) {
            this.pendingWrites.add(file.path)
            return
        }

        await this.writeTimestamps(file, input)
    }

    /**
     * Write the computed timestamps to a file through the configured writer,
     * recording the post-write mtime so the resulting `modify` echo is ignored.
     * Malformed YAML is caught and logged; the file is left untouched (business
     * rule #9).
     */
    private async writeTimestamps(file: TFile, input: TimestampInput): Promise<void> {
        try {
            await this.writer.apply(file, input)
            // Record the post-write mtime so the resulting `modify` event is
            // recognised as our own echo and ignored (prevents the self-feeding
            // write loop when the save delay exceeds MINUTES_BETWEEN_SAVES).
            this.lastWriteMtimes.set(file.path, file.stat.mtime)
        } catch (e: unknown) {
            if (hasName(e) && 'YAMLParseError' === e.name) {
                log(
                    `Failed to update creation/update times because the front matter of [${file.path}] is malformed`,
                    'warn',
                    e
                )
            }
        }
    }

    /**
     * Flush deferred writes whose target is no longer the active file. Driven by
     * the `active-leaf-change` event; re-enters `processFile`, which will now
     * write (the note is inactive) and clear the pending entry.
     */
    private flushPendingWrites(): void {
        if (this.pendingWrites.size === 0) {
            return
        }
        const activePath = this.app.workspace.getActiveFile()?.path
        for (const path of [...this.pendingWrites]) {
            if (path === activePath) {
                continue
            }
            this.pendingWrites.delete(path)
            const file = this.app.vault.getAbstractFileByPath(path)
            if (file instanceof TFile) {
                void this.processFile(file)
            }
        }
    }

    /**
     * Remove every per-file trace of `path` so the debouncer / echo / pending
     * maps cannot retain entries for files that were deleted or renamed
     * (candidate 4).
     */
    private evict(path: string): void {
        this.debouncers.get(path)?.cancel()
        this.debouncers.delete(path)
        this.lastWriteMtimes.delete(path)
        this.pendingWrites.delete(path)
    }

    async shouldFileBeIgnored(file: TFile): Promise<boolean> {
        //log(`Checking if the file should be ignored: ${file.path}`, 'debug');
        if (!file.path) {
            return true
        }

        if (MARKDOWN_FILE_EXTENSION !== file.extension) {
            return true
        }

        // Ignored Canvas files
        if (DEFAULT_CANVAS_FILE_NAME === file.name) {
            return true
        }

        // Candidate 3: a zero-byte file is empty. Using `stat.size` avoids
        // reading the whole file into memory on every change just to test
        // emptiness (the previous `vault.read(file).trim()` did).
        if (isEmptyFile(file.stat.size)) {
            return true
        }

        if (isExcalidrawFile(file)) {
            return true
        }

        return isInIgnoredFolder(file.path, this.settings.ignoredFolders)
    }
}

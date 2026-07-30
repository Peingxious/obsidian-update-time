import { test, expect, mock, beforeEach, describe } from 'bun:test'

// Faithful-enough mocks of the Obsidian primitives the SettingsTab touches, so
// the excluded-folders add/remove flow can be driven end-to-end. Regression
// coverage for issue #9 ("Folders to exclude" not settable / empty values).

class FakeInput {
    value = ''
}

class FakeSearch {
    inputEl = new FakeInput()
    private changeCb?: (value: string) => void
    setPlaceholder() {
        return this
    }
    setValue(v: string) {
        this.inputEl.value = v
        return this
    }
    getValue() {
        return this.inputEl.value
    }
    onChange(cb: (value: string) => void) {
        this.changeCb = cb
        return this
    }
    // Test helper: simulate a user typing into the field.
    type(v: string) {
        this.inputEl.value = v
        this.changeCb?.(v)
    }
    // Test helper: simulate the field being cleared (e.g. by the suggester)
    // without firing onChange, mimicking the runtime that let empty values slip
    // through when the code relied solely on getValue().
    clearSilently() {
        this.inputEl.value = ''
    }
}

class FakeButton {
    click?: () => unknown
    setIcon() {
        return this
    }
    setTooltip() {
        return this
    }
    setButtonText() {
        return this
    }
    setCta() {
        return this
    }
    onClick(cb: () => unknown) {
        this.click = cb
        return this
    }
}

const registry: { search?: FakeSearch; buttons: FakeButton[]; name?: string }[] = []

class FakeSetting {
    private entry: { search?: FakeSearch; buttons: FakeButton[]; name?: string } = {
        buttons: []
    }
    constructor(_el: unknown) {
        registry.push(this.entry)
    }
    setName(n: string) {
        this.entry.name = n
        return this
    }
    setDesc() {
        return this
    }
    setHeading() {
        return this
    }
    addText(cb: (t: FakeSearch) => void) {
        cb(new FakeSearch())
        return this
    }
    addSearch(cb: (s: FakeSearch) => void) {
        const s = new FakeSearch()
        this.entry.search = s
        cb(s)
        return this
    }
    addButton(cb: (b: FakeButton) => void) {
        const b = new FakeButton()
        this.entry.buttons.push(b)
        cb(b)
        return this
    }
}

void mock.module('obsidian', () => ({
    App: class App {},
    PluginSettingTab: class PluginSettingTab {
        app: unknown
        constructor(app: unknown) {
            this.app = app
        }
    },
    Setting: FakeSetting,
    SearchComponent: FakeSearch,
    AbstractInputSuggest: class AbstractInputSuggest {},
    TFolder: class TFolder {},
    TAbstractFile: class TAbstractFile {}
}))

const { SettingsTab } = await import('./index')

interface FakePlugin {
    settings: { ignoredFolders: string[] }
    saveSettings: () => Promise<void>
}

let plugin: FakePlugin
let saveCount: number
let tab: InstanceType<typeof SettingsTab>

const excludedFolderEntry = () => registry.find((e) => e.search)!

const renderExcluded = () => {
    registry.length = 0
    tab.renderExcludedFolders()
}

beforeEach(() => {
    registry.length = 0
    saveCount = 0
    plugin = {
        settings: {
            ignoredFolders: [] as string[],
            createdPropertyName: 'created',
            updatedPropertyName: 'updated',
            saveDelayInSeconds: 10
        } as never,
        saveSettings: async () => {
            saveCount++
        }
    }
    tab = new SettingsTab({} as never, plugin as never)
    // @ts-expect-error test shim for the DOM container
    tab.containerEl = { empty() {}, createDiv: () => ({ classList: { add() {} } }) }
    // Isolate the excluded-folders section; the full display() pulls in DOM APIs.
    tab.display = renderExcluded
})

describe('excluded folders settings', () => {
    test('typing a folder then clicking + adds it', async () => {
        renderExcluded()
        const entry = excludedFolderEntry()
        entry.search!.type('Meetings')
        await entry.buttons[0]!.click!()

        expect(plugin.settings.ignoredFolders).toEqual(['Meetings'])
        expect(saveCount).toBe(1)
    })

    test('clicking + with an empty field does not add a blank entry', async () => {
        renderExcluded()
        const entry = excludedFolderEntry()
        // User never typed anything.
        await entry.buttons[0]!.click!()

        expect(plugin.settings.ignoredFolders).toEqual([])
        expect(saveCount).toBe(0)
    })

    test('whitespace-only input is not added', async () => {
        renderExcluded()
        const entry = excludedFolderEntry()
        entry.search!.type('   ')
        await entry.buttons[0]!.click!()

        expect(plugin.settings.ignoredFolders).toEqual([])
    })

    test('a value captured via onChange survives the field being cleared', async () => {
        // Reproduces the reported failure mode: the field goes empty before the
        // + handler reads it. The onChange mirror keeps the value.
        renderExcluded()
        const entry = excludedFolderEntry()
        entry.search!.type('Journal')
        entry.search!.clearSilently()
        await entry.buttons[0]!.click!()

        expect(plugin.settings.ignoredFolders).toEqual(['Journal'])
    })

    test('duplicate folders are not added twice', async () => {
        plugin.settings.ignoredFolders = ['Meetings']
        renderExcluded()
        const entry = excludedFolderEntry()
        entry.search!.type('Meetings')
        await entry.buttons[0]!.click!()

        expect(plugin.settings.ignoredFolders).toEqual(['Meetings'])
    })

    test('an existing folder can be removed', async () => {
        plugin.settings.ignoredFolders = ['Meetings', 'Journal']
        renderExcluded()
        // Each existing entry renders its own Setting with a Remove button.
        const removeRow = registry.find((e) => e.name === 'Journal')!
        await removeRow.buttons[0]!.click!()

        expect(plugin.settings.ignoredFolders).toEqual(['Meetings'])
    })
})

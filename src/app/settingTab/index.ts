import { App, PluginSettingTab, SearchComponent, Setting } from 'obsidian'
import { UpdateTimePlugin } from '../plugin'

import type { ArgsSearchAndRemove } from './args-search-and-remove.intf'
import { onlyUniqueArray } from '../utils/only-unique-array.tn'
import { FolderSuggest } from '../utils/folder-suggest'
import { BUY_ME_A_COFFEE_BADGE_DATA_URL } from '../assets/buy-me-a-coffee'
import { DEFAULT_SAVE_DELAY_IN_SECONDS, PROPERTY_CREATED, PROPERTY_UPDATED } from '../constants'
import { t } from '../i18n'

export class SettingsTab extends PluginSettingTab {
    plugin: UpdateTimePlugin

    constructor(app: App, plugin: UpdateTimePlugin) {
        super(app, plugin)
        this.plugin = plugin
    }

    override display(): void {
        const { containerEl } = this

        containerEl.empty()

        this.renderPropertyNames(containerEl)
        this.renderSaveDelay(containerEl)
        this.renderExcludedFolders()
        this.renderFollowButton(containerEl)
        this.renderSupportHeader(containerEl)
    }

    renderSaveDelay(containerEl: HTMLElement): void {
        new Setting(containerEl).setName(t('behavior')).setHeading()

        new Setting(containerEl)
            .setName(t('saveDelay'))
            .setDesc(t('saveDelayDesc', { default: DEFAULT_SAVE_DELAY_IN_SECONDS }))
            .addText((text) => {
                text.inputEl.type = 'number'
                text.inputEl.min = '0'
                text.setPlaceholder(String(DEFAULT_SAVE_DELAY_IN_SECONDS))
                    .setValue(String(this.plugin.settings.saveDelayInSeconds))
                    .onChange(async (value) => {
                        const parsed = Number(value)
                        const delay =
                            Number.isFinite(parsed) && parsed >= 0
                                ? parsed
                                : DEFAULT_SAVE_DELAY_IN_SECONDS
                        this.plugin.settings = {
                            ...this.plugin.settings,
                            saveDelayInSeconds: delay
                        }
                        await this.plugin.saveSettings()
                    })
            })
    }

    renderPropertyNames(containerEl: HTMLElement): void {
        new Setting(containerEl).setName(t('frontmatterProperties')).setHeading()

        new Setting(containerEl)
            .setName(t('createdProperty'))
            .setDesc(t('createdPropertyDesc', { default: PROPERTY_CREATED }))
            .addText((text) => {
                text.setPlaceholder(PROPERTY_CREATED)
                    .setValue(this.plugin.settings.createdPropertyName)
                    .onChange(async (value) => {
                        this.plugin.settings = {
                            ...this.plugin.settings,
                            createdPropertyName: value
                        }
                        await this.plugin.saveSettings()
                    })
            })

        new Setting(containerEl)
            .setName(t('updatedProperty'))
            .setDesc(t('updatedPropertyDesc', { default: PROPERTY_UPDATED }))
            .addText((text) => {
                text.setPlaceholder(PROPERTY_UPDATED)
                    .setValue(this.plugin.settings.updatedPropertyName)
                    .onChange(async (value) => {
                        this.plugin.settings = {
                            ...this.plugin.settings,
                            updatedPropertyName: value
                        }
                        await this.plugin.saveSettings()
                    })
            })
    }

    renderFollowButton(containerEl: HTMLElement) {
        new Setting(containerEl)
            .setName(t('followMe'))
            .setDesc(t('followMeDesc'))
            .addButton((button) => {
                button.setCta()
                button.setButtonText(t('followMeBtn')).onClick(() => {
                    window.open('https://x.com/dSebastien')
                })
            })
    }

    renderSupportHeader(containerEl: HTMLElement) {
        new Setting(containerEl).setName(t('support')).setHeading()

        const supportDesc = new DocumentFragment()
        supportDesc.createDiv({
            text: t('supportDesc')
        })

        new Setting(containerEl).setDesc(supportDesc)

        this.renderBuyMeACoffeeBadge(containerEl)
        const spacing = containerEl.createDiv()
        spacing.classList.add('support-header-margin')
    }

    renderExcludedFolders(): void {
        this.doSearchAndRemoveList({
            currentList: this.plugin.settings.ignoredFolders,
            setValue: async (newValue) => {
                this.plugin.settings = {
                    ...this.plugin.settings,
                    ignoredFolders: newValue
                }
            },
            name: 'Folders to exclude',
            description:
                'Any file created or updated in one of these folders will not trigger an update of the created and updated fields.'
        })
    }

    doSearchAndRemoveList({ currentList, setValue, description, name }: ArgsSearchAndRemove) {
        let searchInput: SearchComponent | undefined
        new Setting(this.containerEl)
            .setName(name)
            .setDesc(description)
            .addSearch((cb) => {
                searchInput = cb
                new FolderSuggest(cb.inputEl, this.app)
                cb.setPlaceholder('Example: folder1/folder2')
            })
            .addButton((cb) => {
                cb.setIcon('plus')
                cb.setTooltip('Add folder')
                cb.onClick(async () => {
                    if (!searchInput) {
                        return
                    }
                    const newFolder = searchInput.getValue()

                    await setValue([...currentList, newFolder].filter(onlyUniqueArray))
                    await this.plugin.saveSettings()
                    searchInput.setValue('')
                    this.display()
                })
            })

        currentList.forEach((ignoreFolder) => {
            new Setting(this.containerEl).setName(ignoreFolder).addButton((button) => {
                button.setButtonText(t('removeBtn')).onClick(async () => {
                    await setValue(currentList.filter((value) => value !== ignoreFolder))
                    await this.plugin.saveSettings()
                    this.display()
                })
            })
        })
    }

    renderBuyMeACoffeeBadge(contentEl: HTMLElement | DocumentFragment, width = 175) {
        const linkEl = contentEl.createEl('a', {
            href: 'https://www.buymeacoffee.com/dsebastien'
        })
        const imgEl = linkEl.createEl('img')
        imgEl.src = BUY_ME_A_COFFEE_BADGE_DATA_URL
        imgEl.alt = t('buyMeCoffee')
        imgEl.width = width
    }
}

import { App, ButtonComponent, Modal } from 'obsidian'
import { t } from '../i18n'

export class BackfillConfirmModal extends Modal {
    private readonly fileCount: number
    private readonly onConfirm: () => void

    constructor(app: App, fileCount: number, onConfirm: () => void) {
        super(app)
        this.fileCount = fileCount
        this.onConfirm = onConfirm
    }

    override onOpen(): void {
        this.titleEl.setText(t('backfillTitle'))

        const body = this.contentEl.createDiv({ cls: 'flex flex-col gap-3' })

        const noteWord = this.fileCount === 1 ? 'note' : 'notes'
        body.createEl('p', {
            text: t('backfillDesc', { count: this.fileCount, notes: noteWord })
        })

        const rulesList = body.createEl('ul', { cls: 'pl-5 m-0' })
        rulesList.createEl('li', {
            text: t('backfillRule1')
        })
        rulesList.createEl('li', {
            text: t('backfillRule2')
        })
        rulesList.createEl('li', {
            text: t('backfillRule3')
        })

        const buttonRow = this.contentEl.createDiv({
            cls: 'flex flex-row justify-end gap-2 mt-4'
        })

        new ButtonComponent(buttonRow).setButtonText(t('cancelBtn')).onClick(() => this.close())

        new ButtonComponent(buttonRow)
            .setCta()
            .setButtonText(t('runBtn'))
            .onClick(() => {
                this.close()
                this.onConfirm()
            })
    }

    override onClose(): void {
        this.contentEl.empty()
    }
}

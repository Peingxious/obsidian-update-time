import { AbstractInputSuggest, App, TAbstractFile, TFolder } from 'obsidian'

export class FolderSuggest extends AbstractInputSuggest<TFolder> {
    constructor(
        textInputEl: HTMLInputElement,
        app: App,
        private onSelectFolder?: (path: string) => void
    ) {
        super(app, textInputEl)
    }

    /**
     * Return all vault folders
     * @param inputStr
     */
    getSuggestions(inputStr: string): TFolder[] {
        const abstractFiles = this.app.vault.getAllLoadedFiles()
        const folders: TFolder[] = []
        const lowerCaseInputStr = inputStr.toLowerCase()

        abstractFiles.forEach((folder: TAbstractFile) => {
            if (
                folder instanceof TFolder &&
                folder.path.toLowerCase().contains(lowerCaseInputStr)
            ) {
                folders.push(folder)
            }
        })

        return folders
    }

    renderSuggestion(folder: TFolder, el: HTMLElement): void {
        el.setText(folder.path)
    }

    override selectSuggestion(folder: TFolder): void {
        // Use the base API so the input element and the suggester's internal
        // state stay in sync, then notify the caller so it can mirror the value.
        // Setting `this.textInputEl.value` directly (the previous approach) left
        // listeners unaware the value changed.
        this.setValue(folder.path)
        this.onSelectFolder?.(folder.path)
        this.close()
    }
}

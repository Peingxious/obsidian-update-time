/**
 * Locale dictionary type and translations for the Update Time plugin.
 *
 * Keys are logical identifiers for every user-visible string.
 * Values use `{{placeholder}}` syntax for variable substitution.
 */
export interface LocaleDict {
    // Settings: headings
    behavior: string
    frontmatterProperties: string
    support: string

    // Settings: save delay
    saveDelay: string
    saveDelayDesc: string

    // Settings: property names
    createdProperty: string
    createdPropertyDesc: string
    updatedProperty: string
    updatedPropertyDesc: string

    // Settings: follow button
    followMe: string
    followMeDesc: string
    followMeBtn: string

    // Settings: support
    supportDesc: string
    buyMeCoffee: string

    // Settings: excluded folders
    excludedFolders: string
    excludedFoldersDesc: string
    addFolderTooltip: string
    removeBtn: string
    placeholderFolder: string

    // Backfill confirm modal
    backfillTitle: string
    backfillDesc: string
    backfillRule1: string
    backfillRule2: string
    backfillRule3: string
    cancelBtn: string
    runBtn: string

    // Backfill command
    backfillCmdName: string
    backfillNoticeStart: string
    backfillNoticeDone: string
}

export const en: LocaleDict = {
    // Settings: headings
    behavior: 'Behavior',
    frontmatterProperties: 'Front-matter properties',
    support: 'Support',

    // Settings: save delay
    saveDelay: 'Save delay (seconds)',
    saveDelayDesc:
        'Wait this long after you stop typing before updating the front matter. A higher value reduces how often notes are rewritten while editing, which prevents losing cursor focus (e.g. inside tables). Default: {{default}}.',

    // Settings: property names
    createdProperty: 'Created property name',
    createdPropertyDesc:
        'Front-matter key used to store the creation time. Leave empty to use the default ("{{default}}"). Renaming this only affects future writes; existing notes are not migrated.',
    updatedProperty: 'Updated property name',
    updatedPropertyDesc:
        'Front-matter key used to store the last-update time. Leave empty to use the default ("{{default}}"). Renaming this only affects future writes; existing notes are not migrated.',

    // Settings: follow button
    followMe: 'Follow me on X',
    followMeDesc: '@dSebastien',
    followMeBtn: 'Follow me on X',

    // Settings: support
    supportDesc: 'Buy me a coffee to support the development of this plugin ❤️',
    buyMeCoffee: 'Buy me a coffee',

    // Settings: excluded folders
    excludedFolders: 'Folders to exclude',
    excludedFoldersDesc:
        'Any file created or updated in one of these folders will not trigger an update of the created and updated fields.',
    addFolderTooltip: 'Add folder',
    removeBtn: 'Remove',
    placeholderFolder: 'Example: folder1/folder2',

    // Backfill confirm modal
    backfillTitle: 'Backfill created / updated properties',
    backfillDesc:
        'This will scan {{count}} Markdown {{notes}} in your vault and add missing front-matter properties.',
    backfillRule1:
        'Existing values are never overwritten (except an unparsable "updated" value, which is refreshed).',
    backfillRule2:
        'Files in excluded folders, Canvas files, empty notes, and Excalidraw files are skipped.',
    backfillRule3:
        'This operation modifies vault files. Make sure you have a backup before continuing.',
    cancelBtn: 'Cancel',
    runBtn: 'Run',

    // Backfill command
    backfillCmdName: 'Backfill created / updated properties in all notes',
    backfillNoticeStart: 'Update Time: backfilling {{count}} Markdown {{notes}}…',
    backfillNoticeDone:
        'Update Time: backfill done. Updated {{updated}} of {{total}} {{notes}}. Skipped: {{skipped}}. Errors: {{errors}}.'
}

export const zhCN: LocaleDict = {
    // Settings: headings
    behavior: '行为',
    frontmatterProperties: 'Front-matter 属性',
    support: '支持',

    // Settings: save delay
    saveDelay: '保存延迟（秒）',
    saveDelayDesc:
        '停止输入后等待多长时间再更新 front-matter。较大的值可减少编辑时笔记被重写的频率，防止光标位置丢失（例如表格中）。默认值：{{default}}。',

    // Settings: property names
    createdProperty: '创建时间属性名',
    createdPropertyDesc:
        '用于存储创建时间的 front-matter 键。留空使用默认值 "{{default}}"。重命名仅影响未来的写入，不会迁移已有笔记。',
    updatedProperty: '更新时间属性名',
    updatedPropertyDesc:
        '用于存储最后更新时间的 front-matter 键。留空使用默认值 "{{default}}"。重命名仅影响未来的写入，不会迁移已有笔记。',

    // Settings: follow button
    followMe: '关注 X（Twitter）',
    followMeDesc: '@dSebastien',
    followMeBtn: '关注 X',

    // Settings: support
    supportDesc: '请我喝杯咖啡，支持本插件的开发 ❤️',
    buyMeCoffee: '请我喝咖啡',

    // Settings: excluded folders
    excludedFolders: '排除的文件夹',
    excludedFoldersDesc: '在这些文件夹中创建或更新的文件不会触发 created 和 updated 字段的更新。',
    addFolderTooltip: '添加文件夹',
    removeBtn: '移除',
    placeholderFolder: '示例：folder1/folder2',

    // Backfill confirm modal
    backfillTitle: '回填创建 / 更新时间属性',
    backfillDesc:
        '将扫描您仓库中的 {{count}} 个 Markdown {{notes}} 并添加缺失的 front-matter 属性。',
    backfillRule1: '不会覆盖已有的属性值（除无法解析的 "updated" 值外，会刷新）。',
    backfillRule2: '排除的文件夹中的文件、Canvas 文件、空笔记和 Excalidraw 文件将被跳过。',
    backfillRule3: '此操作会修改仓库中的文件。请确保已备份再继续。',
    cancelBtn: '取消',
    runBtn: '运行',

    // Backfill command
    backfillCmdName: '回填所有笔记中的创建 / 更新时间属性',
    backfillNoticeStart: 'Update Time：正在回填 {{count}} 个 Markdown {{notes}}…',
    backfillNoticeDone:
        'Update Time：回填完成。已更新 {{updated}} / {{total}} {{notes}}。跳过：{{skipped}}。错误：{{errors}}。'
}

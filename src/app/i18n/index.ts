/**
 * i18n module for Update Time plugin.
 *
 * Auto-detects the system language via `navigator.language` and provides a
 * simple `t(key, vars)` function. No separate language setting — the plugin
 * follows the host OS / browser language.
 *
 * Supported languages:
 *   - Chinese (zhCN) — matched when `navigator.language` starts with "zh"
 *   - English (en)   — fallback for all other cases
 */

import { en, zhCN, type LocaleDict } from './lang'

/**
 * Determine which locale dictionary to use based on the browser's language.
 * Matches all Chinese variants: zh, zh-CN, zh-Hans, zh-HK, zh-TW, zh-MO, zh-SG.
 */
function detectLocale(): LocaleDict {
    const lang = (navigator.language ?? '').toLowerCase()
    if (lang.startsWith('zh')) {
        return zhCN
    }
    return en
}

const locale: LocaleDict = detectLocale()

/**
 * Resolve a template key against the active locale, substituting `{{key}}`
 * placeholders with the provided variable map.
 *
 * Missing keys resolve to `[MISSING: key]` as a fail-safe during development.
 *
 * @example
 *   t('saveDelayDesc', { default: 2 })
 *   // → "Wait this long after you stop typing before updating… Default: 2."
 *
 *   t('backfillNoticeDone', {
 *     updated: '5', total: '42', notes: 'notes', skipped: '0', errors: '0'
 *   })
 *   // → "Update Time: backfill done. Updated 5 of 42 notes. Skipped: 0. Errors: 0."
 */
export function t(key: string, vars?: Record<string, string | number>): string {
    const template: string | undefined = (locale as unknown as Record<string, string | undefined>)[key]
    if (template === undefined) {
        // Fail-safe: surface the missing key during development
        return `[MISSING: ${key}]`
    }

    if (!vars) {
        return template
    }

    return template.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => {
        const value = vars[name]
        return value !== undefined ? String(value) : _match
    })
}

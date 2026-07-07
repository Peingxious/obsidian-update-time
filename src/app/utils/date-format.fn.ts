/**
 * Tiny date-format helpers that replace `date-fns` (format / add / isAfter).
 *
 * The only format string in use is `"yyyy-MM-dd'T'HH:mm"` (see
 * `constants.ts`).  If custom formats are added later, this is the single
 * place to extend.
 */

const TWO_DIGITS = 2

/**
 * Format a `Date` to `"yyyy-MM-dd'T'HH:mm"`.
 * Replaces `date-fns/format`.
 */
export function formatDate(d: Date): string {
    const pad = (n: number): string => String(n).padStart(TWO_DIGITS, '0')
    return (
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T` +
        `${pad(d.getHours())}:${pad(d.getMinutes())}`
    )
}

/**
 * Add `minutes` to a date.
 * Replaces `date-fns/add`.
 */
export function addMinutes(d: Date, minutes: number): Date {
    return new Date(d.getTime() + minutes * 60_000)
}

/**
 * Is `a` strictly after `b`?
 * Replaces `date-fns/isAfter`.
 */
export function isAfter(a: Date, b: Date): boolean {
    return a.getTime() > b.getTime()
}

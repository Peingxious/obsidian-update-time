import { log } from './log'

/**
 * Parse a date string of the form `"yyyy-MM-dd'T'HH:mm"` back into a Date.
 * The `dateFormat` parameter is accepted for backward compat but ignored —
 * only the ISO-like format used everywhere is supported.
 *
 * Accepts both the string and number paths that `parseDate` handles today.
 */
export const parseDate = (
    input: number | string | undefined | null,
    _dateFormat: string
): Date | null => {
    if (!input) {
        return null
    }

    if (typeof input === 'string') {
        try {
            const parsedDate = parseIsoDate(input)

            if (!parsedDate || isNaN(parsedDate.getTime())) {
                return null
            }

            return parsedDate
        } catch (e: unknown) {
            // console.debug(e)
            log(`Error while parsing a date: [${input}]`, 'debug', e)
            return null
        }
    }

    return new Date(input)
}

const ISO_LIKE_DATE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/

/**
 * Parse a string of the form `"yyyy-MM-dd'T'HH:mm"` into a Date.
 * Returns `null` for any input that does not match.
 */
function parseIsoDate(input: string): Date | null {
    const match = input.match(ISO_LIKE_DATE)
    if (!match) {
        return null
    }
    return new Date(
        parseInt(match[1]!),       // year
        parseInt(match[2]!) - 1,   // month (0‑based)
        parseInt(match[3]!),       // day
        parseInt(match[4]!),       // hours
        parseInt(match[5]!)        // minutes
    )
}

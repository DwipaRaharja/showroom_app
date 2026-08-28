const locale = 'id-ID';
const applicationTimeZone = 'Asia/Makassar';

type NumericValue = number | bigint | string | null | undefined;
type DateValue = Date | number | string | null | undefined;

type DateFormatOptions = Intl.DateTimeFormatOptions & {
    fallback?: string;
};

const defaultDateOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
};

const defaultDateTimeOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
};

const numberFormatters = new Map<string, Intl.NumberFormat>();
const dateTimeFormatters = new Map<string, Intl.DateTimeFormat>();

function getNumberFormatter(
    options: Intl.NumberFormatOptions,
): Intl.NumberFormat {
    const key = JSON.stringify(options);
    const cachedFormatter = numberFormatters.get(key);

    if (cachedFormatter) {
        return cachedFormatter;
    }

    const formatter = new Intl.NumberFormat(locale, options);

    numberFormatters.set(key, formatter);

    return formatter;
}

function getDateTimeFormatter(
    options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
    const key = JSON.stringify(options);
    const cachedFormatter = dateTimeFormatters.get(key);

    if (cachedFormatter) {
        return cachedFormatter;
    }

    const formatter = new Intl.DateTimeFormat(locale, options);

    dateTimeFormatters.set(key, formatter);

    return formatter;
}

function normalizeNumericValue(value: NumericValue): number | bigint | null {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'bigint') {
        return value;
    }

    if (typeof value !== 'string' || value.trim() === '') {
        return null;
    }

    const normalized = value.trim();

    if (/^-?\d+$/.test(normalized)) {
        try {
            return BigInt(normalized);
        } catch {
            return null;
        }
    }

    const numericValue = Number(normalized);

    return Number.isFinite(numericValue) ? numericValue : null;
}

function parseDateOnly(value: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (!match) {
        return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return null;
    }

    return date;
}

function parseTimestamp(value: DateValue): Date | null {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const date = value instanceof Date ? value : new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
}

export function formatCurrency(
    value: NumericValue,
    options: Intl.NumberFormatOptions = {},
): string {
    const normalized = normalizeNumericValue(value);

    if (normalized === null) {
        return '—';
    }

    return getNumberFormatter({
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
        ...options,
    }).format(normalized);
}

export function formatNumber(
    value: NumericValue,
    options: Intl.NumberFormatOptions = {},
): string {
    const normalized = normalizeNumericValue(value);

    if (normalized === null) {
        return '—';
    }

    return getNumberFormatter({
        maximumFractionDigits: 0,
        ...options,
    }).format(normalized);
}

export function formatDate(
    value: DateValue,
    options: DateFormatOptions = {},
): string {
    const { fallback = '—', ...dateOptions } = options;
    const isDateOnly =
        typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
    const date = isDateOnly ? parseDateOnly(value) : parseTimestamp(value);

    if (!date) {
        return fallback;
    }

    const hasCustomOptions = Object.keys(dateOptions).length > 0;

    return getDateTimeFormatter({
        ...(hasCustomOptions ? dateOptions : defaultDateOptions),
        timeZone: isDateOnly
            ? 'UTC'
            : (dateOptions.timeZone ?? applicationTimeZone),
    }).format(date);
}

export function formatDateTime(
    value: DateValue,
    options: DateFormatOptions = {},
): string {
    const { fallback = '—', ...dateTimeOptions } = options;
    const date = parseTimestamp(value);

    if (!date) {
        return fallback;
    }

    const hasCustomOptions = Object.keys(dateTimeOptions).length > 0;

    return getDateTimeFormatter({
        ...(hasCustomOptions ? dateTimeOptions : defaultDateTimeOptions),
        timeZone: dateTimeOptions.timeZone ?? applicationTimeZone,
    }).format(date);
}

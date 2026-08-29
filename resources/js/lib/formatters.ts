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

/**
 * Menghasilkan tautan langsung ke WhatsApp (wa.me) dengan format nomor telepon internasional (+62).
 *
 * @param phone Nomor telepon (misal: "0812-3456-7890", "+62 812 3456", "08123456789")
 * @param message Pesan teks default opsional yang akan terisi otomatis saat membuka chat
 * @returns URL WhatsApp string atau null jika nomor telepon tidak valid
 */
export function formatWhatsAppUrl(
    phone: string | null | undefined,
    message?: string,
): string | null {
    if (!phone || typeof phone !== 'string') {
        return null;
    }

    const digits = phone.replace(/\D/g, '');

    if (!digits) {
        return null;
    }

    let internationalPhone = digits;

    if (digits.startsWith('0')) {
        internationalPhone = `62${digits.slice(1)}`;
    } else if (digits.startsWith('62')) {
        internationalPhone = digits;
    } else if (digits.startsWith('8')) {
        internationalPhone = `62${digits}`;
    }

    if (internationalPhone.length < 9) {
        return null;
    }

    const base = `https://wa.me/${internationalPhone}`;

    if (message && message.trim() !== '') {
        return `${base}?text=${encodeURIComponent(message.trim())}`;
    }

    return base;
}

export type DatePreset =
    | 'all'
    | 'today'
    | 'this_week'
    | 'this_month'
    | 'last_month'
    | 'this_year'
    | 'custom';

export function isDateInRange(
    dateValue: DateValue,
    start: Date | null,
    end: Date | null,
): boolean {
    if (!dateValue) {
        return false;
    }

    const d = dateValue instanceof Date ? dateValue : new Date(dateValue);

    if (Number.isNaN(d.getTime())) {
        return false;
    }

    if (start && d.getTime() < start.getTime()) {
        return false;
    }

    if (end && d.getTime() > end.getTime()) {
        return false;
    }

    return true;
}

export function getPresetDateRange(
    preset: DatePreset,
    customStart?: string,
    customEnd?: string,
): { start: Date | null; end: Date | null } {
    const now = new Date();

    if (preset === 'today') {
        const start = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            0,
            0,
            0,
            0,
        );
        const end = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            23,
            59,
            59,
            999,
        );

        return { start, end };
    }

    if (preset === 'this_week') {
        const day = now.getDay();
        const diffToMonday = (day === 0 ? -6 : 1) - day;
        const start = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + diffToMonday,
            0,
            0,
            0,
            0,
        );
        const end = new Date(
            start.getFullYear(),
            start.getMonth(),
            start.getDate() + 6,
            23,
            59,
            59,
            999,
        );

        return { start, end };
    }

    if (preset === 'this_month') {
        const start = new Date(
            now.getFullYear(),
            now.getMonth(),
            1,
            0,
            0,
            0,
            0,
        );
        const end = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
            23,
            59,
            59,
            999,
        );

        return { start, end };
    }

    if (preset === 'last_month') {
        const start = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1,
            0,
            0,
            0,
            0,
        );
        const end = new Date(
            now.getFullYear(),
            now.getMonth(),
            0,
            23,
            59,
            59,
            999,
        );

        return { start, end };
    }

    if (preset === 'this_year') {
        const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

        return { start, end };
    }

    if (preset === 'custom') {
        const start = customStart ? new Date(`${customStart}T00:00:00`) : null;
        const end = customEnd ? new Date(`${customEnd}T23:59:59.999`) : null;

        return { start, end };
    }

    return { start: null, end: null };
}

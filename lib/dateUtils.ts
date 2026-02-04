export const TIMEZONE = 'America/Sao_Paulo';
export const LOCALE = 'pt-BR';

export function formatDate(date: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions): string {
    if (!date) return '-';

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Validate date
    if (isNaN(dateObj.getTime())) return '-';

    return dateObj.toLocaleDateString(LOCALE, {
        timeZone: TIMEZONE,
        ...options
    });
}

export function formatDateTime(date: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions): string {
    if (!date) return '-';

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Validate date
    if (isNaN(dateObj.getTime())) return '-';

    return dateObj.toLocaleString(LOCALE, {
        timeZone: TIMEZONE,
        ...options
    });
}

export function formatTime(date: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions): string {
    if (!date) return '-';

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Validate date
    if (isNaN(dateObj.getTime())) return '-';

    return dateObj.toLocaleTimeString(LOCALE, {
        timeZone: TIMEZONE,
        ...options
    });
}

export function getCurrentDate(): Date {
    return new Date();
}

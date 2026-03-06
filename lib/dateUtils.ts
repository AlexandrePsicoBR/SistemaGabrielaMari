export const TIMEZONE = 'America/Sao_Paulo';
export const LOCALE = 'pt-BR';

export function formatDate(date: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions): string {
    if (!date) return '-';

    let dateObj: Date;
    if (typeof date === 'string') {
        if (date.length === 10 && date.includes('-')) {
            // Append 12:00:00 to avoid UTC shifting when parsing a simple YYYY-MM-DD string
            dateObj = new Date(`${date}T12:00:00`);
        } else {
            dateObj = new Date(date);
        }
    } else {
        dateObj = date;
    }

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

/**
 * Retorna uma data no formato YYYY-MM-DD no horário de Brasília,
 * evitando problemas com o fuso horário UTC (ex: mostrar dia anterior).
 * Se não for passada uma data, usa a data atual (hoje).
 */
export function getLocalYMD(dateStrOrObj?: string | Date | null): string {
    let d: Date;
    if (dateStrOrObj) {
        d = typeof dateStrOrObj === 'string' ? new Date(dateStrOrObj) : dateStrOrObj;
        if (typeof dateStrOrObj === 'string' && dateStrOrObj.length === 10 && dateStrOrObj.includes('-')) {
             d = new Date(`${dateStrOrObj}T12:00:00`);
        }
    } else {
        d = new Date();
    }

    // Validate
    if (isNaN(d.getTime())) return '-';

    // Converter a data para uma string considerando o fuso horário do Brasil
    const options: Intl.DateTimeFormatOptions = { 
        timeZone: TIMEZONE, 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    };
    
    // toLocaleDateString returning DD/MM/YYYY in pt-BR
    const dateParts = d.toLocaleDateString(LOCALE, options).split('/');
    if (dateParts.length === 3) {
        return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
    }
    
    // Fallback if the format behaves differently (e.g. Node vs Browser default locates)
    return d.toISOString().split('T')[0];
}

export function getLocalTodayAsYMD(): string {
    return getLocalYMD();
}

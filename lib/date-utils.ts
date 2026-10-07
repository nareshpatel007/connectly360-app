/**
 * Timezone-aware date formatting utilities for Connectly360 Inbox & CRM
 */

/**
 * Resolves the active timezone:
 * 1. Configured workspace timezone
 * 2. User timezone
 * 3. Browser system timezone fallback
 */
export function getActiveTimezone(configuredTimezone?: string | null): string {
    if (configuredTimezone && configuredTimezone.trim() !== "") {
        try {
            // Validate timezone string validity
            Intl.DateTimeFormat(undefined, { timeZone: configuredTimezone });
            return configuredTimezone;
        } catch {}
    }

    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
        return "UTC";
    }
}

/**
 * Normalizes a date into a localized "YYYY-MM-DD" key based on the target timezone
 */
export function getDateKeyInTimezone(dateInput: string | number | Date, timeZone: string): string {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";

    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });

    return formatter.format(d); // Returns "YYYY-MM-DD"
}

/**
 * Formats friendly message date separator headers:
 * - "Today"
 * - "Yesterday"
 * - "Monday", "Tuesday", "Wednesday", etc. (if within last 7 days of current week)
 * - "7 Oct 2026" (or "7 Oct 2025" for older dates)
 */
export function formatMessageDateSeparator(
    dateInput: string | number | Date,
    timeZone?: string | null
): string {
    const tz = getActiveTimezone(timeZone);
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const targetKey = getDateKeyInTimezone(date, tz);
    const todayKey = getDateKeyInTimezone(now, tz);

    const yesterday = new Date(now.getTime() - 86400000);
    const yesterdayKey = getDateKeyInTimezone(yesterday, tz);

    if (targetKey === todayKey) {
        return "Today";
    }

    if (targetKey === yesterdayKey) {
        return "Yesterday";
    }

    // Check if within current week (within 6 days ago)
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 1 && diffDays < 7) {
        return new Intl.DateTimeFormat("en-US", {
            timeZone: tz,
            weekday: "long",
        }).format(date);
    }

    // Check if same year
    const targetYear = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric" }).format(date);
    const currentYear = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric" }).format(now);

    if (targetYear === currentYear) {
        return new Intl.DateTimeFormat("en-US", {
            timeZone: tz,
            day: "numeric",
            month: "short",
            year: "numeric",
        }).format(date);
    }

    return new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(date);
}

/**
 * Formats conversation list friendly timestamps:
 * - Today: "10:32 AM"
 * - Yesterday: "Yesterday"
 * - Older this year: "7 Oct"
 * - Older year: "7 Oct 2025"
 */
export function formatConversationListTimestamp(
    dateInput: string | number | Date,
    timeZone?: string | null
): string {
    const tz = getActiveTimezone(timeZone);
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const targetKey = getDateKeyInTimezone(date, tz);
    const todayKey = getDateKeyInTimezone(now, tz);

    const yesterday = new Date(now.getTime() - 86400000);
    const yesterdayKey = getDateKeyInTimezone(yesterday, tz);

    if (targetKey === todayKey) {
        return new Intl.DateTimeFormat("en-US", {
            timeZone: tz,
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        }).format(date);
    }

    if (targetKey === yesterdayKey) {
        return "Yesterday";
    }

    const targetYear = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric" }).format(date);
    const currentYear = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric" }).format(now);

    if (targetYear === currentYear) {
        return new Intl.DateTimeFormat("en-US", {
            timeZone: tz,
            day: "numeric",
            month: "short",
        }).format(date);
    }

    return new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(date);
}

/**
 * Formats message bubble timestamp: "10:20 AM"
 */
export function formatMessageTime(
    dateInput: string | number | Date,
    timeZone?: string | null
): string {
    const tz = getActiveTimezone(timeZone);
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    }).format(date);
}

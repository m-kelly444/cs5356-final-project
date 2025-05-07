export function safeToISOString(date: unknown): string | null {
    return date instanceof Date && !isNaN((date as Date).getTime())
      ? (date as Date).toISOString()
      : null;
  }
  
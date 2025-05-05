declare module 'date-fns' {
  export function format(date: Date, formatStr: string): string;
  export function formatDistance(date: Date, baseDate: Date): string;
  export function formatRelative(date: Date, baseDate: Date): string;
  export function formatDistanceToNow(date: Date, options?: { addSuffix?: boolean }): string;
  export function isValid(date: Date): boolean;
  export function parseISO(dateString: string): Date;
} 
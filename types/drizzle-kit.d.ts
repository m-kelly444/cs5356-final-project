declare module 'drizzle-kit' {
  export interface Config {
    schema: string;
    out: string;
    driver: string;
    dbCredentials: {
      url: string;
      authToken?: string;
    };
    tablesFilter?: string[];
    verbose?: boolean;
    strict?: boolean;
    fileName?: (timestamp: string, name?: string) => string;
  }
} 
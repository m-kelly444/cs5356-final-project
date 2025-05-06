declare namespace NodeJS {
  interface ProcessEnv {
    NEON_DATABASE_URL: string;
    DATABASE_AUTH_TOKEN?: string;
    VIRUSTOTAL_API_KEY?: string;
  }
} 
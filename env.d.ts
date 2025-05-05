declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    DATABASE_AUTH_TOKEN?: string;
    VIRUSTOTAL_API_KEY?: string;
    NVD_API_KEY?: string;
  }
} 
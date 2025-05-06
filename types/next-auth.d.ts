declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    NEXTAUTH_SECRET: string;
    NEXTAUTH_URL: string;
    DATABASE_URL: string;
    DATABASE_AUTH_TOKEN?: string;
    NVD_API_KEY: string;
  }
} 
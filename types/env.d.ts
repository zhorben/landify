declare namespace NodeJS {
  interface ProcessEnv {
    ANTHROPIC_API_KEY: string;
    VERCEL_TOKEN: string;
    GITHUB_TOKEN: string;
  }
}

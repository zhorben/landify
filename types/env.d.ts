declare namespace NodeJS {
  interface ProcessEnv {
    ANTHROPIC_API_KEY: string;
    VERCEL_TOKEN: string;
    GITHUB_TOKEN: string;
    VERCEL_TEAM_ID: string;
    NETLIFY_TOKEN: string;
    CLOUDFLARE_API_TOKEN: string;
    CLOUDFLARE_ACCOUNT_ID: string;
  }
}

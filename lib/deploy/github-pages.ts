interface DeployOptions {
  name: string;
  gitRepository: {
    repo: string;
    type: "github";
  };
}

interface DeployResult {
  id: string;
  url: string;
  readyState: string;
  deployUrl: string;
  adminUrl: string;
}

export async function deployToGitHubPages({
  name,
  gitRepository,
}: DeployOptions): Promise<DeployResult> {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN is required");
  }

  try {
    console.log("Creating GitHub Action...");
    const workflowContent = `
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Dependencies
        run: npm install

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v3

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
`;

    await fetch(
      `https://api.github.com/repos/${gitRepository.repo}/contents/.github/workflows/deploy.yml`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Add GitHub Pages deployment workflow",
          content: Buffer.from(workflowContent).toString("base64"),
        }),
      },
    );

    console.log("Enabling GitHub Pages...");
    await fetch(`https://api.github.com/repos/${gitRepository.repo}`, {
      method: "PATCH",
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({
        has_pages: true,
      }),
    });

    await fetch(`https://api.github.com/repos/${gitRepository.repo}/pages`, {
      method: "POST",
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({
        source: {
          branch: "main",
          path: "/dist",
        },
        build_type: "workflow",
      }),
    });

    const url = `https://${gitRepository.repo.split("/")[0]}.github.io/${gitRepository.repo.split("/")[1]}`;

    return {
      id: gitRepository.repo,
      url: url,
      readyState: "building",
      deployUrl: url,
      adminUrl: `https://github.com/${gitRepository.repo}/settings/pages`,
    };
  } catch (error) {
    console.error("GitHub Pages deployment failed:", error);
    throw error;
  }
}

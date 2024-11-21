interface NetlifyDeployOptions {
  name: string;
  gitRepository: {
    repo: string;
    type: "github";
  };
}

interface NetlifySite {
  id: string;
  name: string;
  url: string;
  ssl_url: string;
  admin_url: string;
  build_settings: {
    cmd: string;
    dir: string;
    base: string;
  };
}

interface NetlifyDeployResult {
  id: string;
  url: string;
  readyState: string;
  deployUrl: string;
  adminUrl: string;
}

export async function deployToNetlify({
  name,
  gitRepository,
}: NetlifyDeployOptions): Promise<NetlifyDeployResult> {
  if (!process.env.NETLIFY_TOKEN) {
    throw new Error("NETLIFY_TOKEN is required");
  }
  if (!process.env.GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN is required");
  }

  try {
    // 1. Создаем сайт
    console.log("Creating Netlify site...");
    const site = await createSite(name, gitRepository);
    console.log("Site created:", site);

    // 2. Добавляем GitHub токен только для этого сайта
    console.log("Setting up GitHub token...");
    const envResponse = await fetch(
      `https://api.netlify.com/api/v1/sites/${site.id}/env/${encodeURIComponent("GITHUB_TOKEN")}`,
      {
        method: "PUT", // используем PUT вместо POST
        headers: {
          Authorization: `Bearer ${process.env.NETLIFY_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          value: process.env.GITHUB_TOKEN,
          context: "production", // только для production
        }),
      },
    );

    if (!envResponse.ok) {
      console.error("Failed to set GitHub token:", await envResponse.text());
    } else {
      console.log("GitHub token set successfully");
    }

    // 3. Запускаем деплой
    console.log("Creating deployment...");
    const deployResponse = await fetch(
      `https://api.netlify.com/api/v1/sites/${site.id}/deploys`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NETLIFY_TOKEN}`,
        },
      },
    );

    const deployment = await deployResponse.json();
    console.log("Deployment created:", deployment);

    return {
      id: site.id,
      url: site.ssl_url || site.url,
      readyState: deployment.state,
      deployUrl: deployment.deploy_url,
      adminUrl: site.admin_url,
    };
  } catch (error) {
    console.error("Netlify deployment failed:", error);
    throw error;
  }
}

async function createSite(
  name: string,
  gitRepository: { repo: string; type: "github" },
): Promise<NetlifySite> {
  const response = await fetch("https://api.netlify.com/api/v1/sites", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.NETLIFY_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      processing_settings: {
        html: { pretty_urls: true },
        ignore_html_forms: true,
      },
      build_settings: {
        // Меняем эту часть
        provider: "github",
        repo_url: `https://github.com/${gitRepository.repo}`,
        repo_branch: "main",
        cmd: "npm run build",
        dir: "dist",
        base: "/",
        env: {
          GITHUB_TOKEN: process.env.GITHUB_TOKEN,
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Create site response:", {
      status: response.status,
      statusText: response.statusText,
      body: text,
    });
    try {
      const error = JSON.parse(text);
      throw new Error(`Failed to create site: ${JSON.stringify(error)}`);
    } catch {
      throw new Error(`Failed to create site: ${text}`);
    }
  }

  return response.json();
}

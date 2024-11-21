import { DeploymentStatus } from "@/types";

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
  readyState: DeploymentStatus;
  deployUrl: string;
  adminUrl: string;
}

async function checkSiteAvailability(url: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

export async function deployToCloudflare({
  name,
  gitRepository,
}: DeployOptions): Promise<DeployResult> {
  if (!process.env.CLOUDFLARE_API_TOKEN) {
    throw new Error("CLOUDFLARE_API_TOKEN is required");
  }
  if (!process.env.CLOUDFLARE_ACCOUNT_ID) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID is required");
  }

  const projectName = name.toLowerCase().replace(/[^a-z0-9-]/g, "-");

  try {
    console.log("Creating Cloudflare Pages project...");
    const createResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/pages/projects`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: projectName,
          build_config: {
            build_command: "npm run build",
            destination_dir: "dist",
            root_dir: "/",
          },
          deployment_configs: {
            preview: {
              env_vars: {},
              build_config: {
                build_command: "npm run build",
                destination_dir: "dist",
              },
            },
            production: {
              env_vars: {},
              build_config: {
                build_command: "npm run build",
                destination_dir: "dist",
              },
            },
          },
          source: {
            type: "github",
            config: {
              owner: gitRepository.repo.split("/")[0],
              repo_name: gitRepository.repo.split("/")[1],
              production_branch: "main",
              pr_comments_enabled: false,
              deployments_enabled: true,
            },
          },
        }),
      },
    );

    const createData = await createResponse.json();
    console.log("Project creation response:", createData);

    if (!createData.success) {
      throw new Error(
        `Failed to create project: ${
          createData.errors?.[0]?.message || JSON.stringify(createData.errors)
        }`,
      );
    }

    const project = createData.result;

    console.log("Triggering initial deployment...");
    const deployResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/pages/projects/${projectName}/deployments`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          branch: "main",
          production: true,
        }),
      },
    );

    const deployData = await deployResponse.json();
    console.log("Deployment trigger response:", deployData);

    if (!deployData.success) {
      console.warn("Deploy trigger warning:", deployData.errors);
    }

    // Ждем готовности деплоя
    console.log("Waiting for deployment to be ready...");
    let deploymentStatus: DeploymentStatus = "building";
    let attempts = 0;
    const maxAttempts = 20;
    const url = `https://${projectName}.pages.dev`;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 15000));

      // Проверяем доступность сайта
      const isAvailable = await checkSiteAvailability(url);
      if (isAvailable) {
        console.log("Site is available!");
        deploymentStatus = "ready";
        break;
      }

      // Если сайт недоступен, проверяем статус деплоя
      try {
        const statusResponse = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/pages/projects/${projectName}/deployments`,
          {
            headers: {
              Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
            },
          },
        );
        const statusData = await statusResponse.json();
        if (statusData.success && statusData.result?.[0]) {
          const status = statusData.result[0].status as DeploymentStatus;
          if (status && status !== deploymentStatus) {
            deploymentStatus = status;
            console.log(`Deployment status (attempt ${attempts + 1}):`, status);
          }

          // Если статус показывает готовность - проверяем доступность еще раз
          if (["ready", "success"].includes(status)) {
            const isNowAvailable = await checkSiteAvailability(url);
            if (isNowAvailable) {
              console.log("Site became available!");
              deploymentStatus = "ready";
              break;
            }
          }
        }
      } catch (error) {
        console.warn("Failed to get deployment status:", error);
      }

      attempts++;
    }

    if (attempts >= maxAttempts) {
      console.log("Max attempts reached, returning current status");
    }

    return {
      id: project.id,
      url: url,
      readyState: deploymentStatus,
      deployUrl: url,
      adminUrl: `https://dash.cloudflare.com/${process.env.CLOUDFLARE_ACCOUNT_ID}/pages/view/${projectName}`,
    };
  } catch (error) {
    console.error("Cloudflare deployment failed:", error);
    throw error;
  }
}

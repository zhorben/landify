import { fetch } from "undici";
import dns from "node:dns";
import { promisify } from "node:util";
import { DeploymentStatus } from "@/types";

const dnsLookup = promisify(dns.lookup);

interface CloudflareAPIResponse<T> {
  result: T;
  success: boolean;
  errors: Array<{ message: string }>;
  messages: string[];
}

interface CloudflareProject {
  id: string;
  name: string;
}

interface CloudflareDeployment {
  id: string;
  short_id: string;
  project_id: string;
  project_name: string;
  environment: string;
  url: string;
  created_on: string;
  modified_on: string;
  latest_stage?: {
    name: string;
    started_on: string;
    ended_on: string;
    status: string;
  };
  stages: Array<{
    name: string;
    started_on: string;
    ended_on?: string;
    status: string;
  }>;
  deployment_trigger: {
    type: string;
    metadata: Record<string, unknown>;
  };
}

interface DeployOptions {
  name: string;
  gitRepository: {
    repo: string;
    type: "github";
  };
}

interface DeploymentInitResult {
  id: string;
  projectName: string;
}

interface DeploymentStatusResult {
  status: DeploymentStatus;
  url: string;
  message: string;
}

async function checkSiteAvailability(url: string): Promise<boolean> {
  console.log(`Checking availability for ${url}...`);

  try {
    // DNS проверка
    try {
      await dnsLookup(new URL(url).hostname);
    } catch (dnsError) {
      console.log("DNS resolution failed, site might not be ready yet");
      return false;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "text/html",
          "User-Agent": "Mozilla/5.0 (compatible; StatusCheck/1.0;)",
        },
        redirect: "follow",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const isAvailable = response.ok;
      console.log(
        `Site availability check: ${isAvailable ? "SUCCESS" : "FAILED"} (status: ${response.status})`,
      );
      return isAvailable;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.log("Fetch error:", fetchError);
      return false;
    }
  } catch (error) {
    console.log(`Site availability check failed:`, error);
    return false;
  }
}

export async function initializeCloudflareDeployment({
  name,
  gitRepository,
}: DeployOptions): Promise<DeploymentInitResult> {
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

    const createData =
      (await createResponse.json()) as CloudflareAPIResponse<CloudflareProject>;
    console.log("Project creation response:", createData);

    if (!createData.success) {
      throw new Error(
        `Failed to create project: ${createData.errors?.[0]?.message || JSON.stringify(createData.errors)}`,
      );
    }

    // Инициируем начальный деплой
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

    const deployData =
      (await deployResponse.json()) as CloudflareAPIResponse<CloudflareDeployment>;
    console.log("Deploy initialization response:", deployData);

    return {
      id: deployData.success ? deployData.result.id : createData.result.id,
      projectName,
    };
  } catch (error) {
    console.error("Cloudflare deployment initialization failed:", error);
    throw error;
  }
}

export async function getCloudflareDeploymentStatus(
  projectName: string,
  deploymentId: string,
): Promise<DeploymentStatusResult> {
  if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID) {
    throw new Error("Missing required environment variables");
  }

  try {
    console.log(`Checking deployment status for ${projectName}...`);

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/pages/projects/${projectName}/deployments/${deploymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        },
      },
    );

    const data =
      (await response.json()) as CloudflareAPIResponse<CloudflareDeployment>;

    if (!data.success) {
      throw new Error(
        `Failed to get deployment status: ${data.errors?.[0]?.message}`,
      );
    }

    // Извлекаем статус из latest_stage
    const deploymentStatus = data.result.latest_stage?.status;
    console.log(`Latest stage status: ${deploymentStatus}`);

    const url = `https://${projectName}.pages.dev`;

    // Если деплой успешен, проверяем доступность
    if (deploymentStatus === "success") {
      let isAvailable = false;
      for (let i = 0; i < 2; i++) {
        // Уменьшено до 2 попыток
        console.log(`Attempting site availability check ${i + 1}/2`);
        isAvailable = await checkSiteAvailability(url);

        if (isAvailable) {
          console.log("Site is available!");
          break;
        }

        if (i < 1) {
          console.log("Site not available, waiting before retry...");
          await new Promise((resolve) => setTimeout(resolve, 10000)); // 10 секунд между попытками
        }
      }

      if (!isAvailable) {
        return {
          status: "building",
          url,
          message: "Deployment complete, waiting for DNS propagation",
        };
      }

      return {
        status: "ready",
        url,
        message: "Site is live and accessible",
      };
    }

    // Преобразуем статус Cloudflare в наш формат
    let status: DeploymentStatus;
    if (deploymentStatus === "success") {
      status = "ready";
    } else if (deploymentStatus === "failure") {
      status = "failed";
    } else if (deploymentStatus === "pending") {
      status = "building";
    } else {
      status = "building";
    }

    return {
      status,
      url,
      message:
        status === "failed" ? "Deployment failed" : "Deployment in progress",
    };
  } catch (error) {
    console.error("Failed to get deployment status:", error);
    throw error;
  }
}

import {
  handleApiError,
  createApiResponse,
  ApiError,
} from "@/lib/api-response";
import { createRepoFromTemplate, commitFiles } from "@/lib/github";
import { initializeCloudflareDeployment } from "@/lib/deploy/cloudflare";
import { prepareFilesForCommit } from "@/lib/generation";
import type { GeneratedWebsite } from "@/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.generatedWebsite) {
      throw new ApiError("Missing generatedWebsite in request body", 400);
    }

    const generatedWebsite: GeneratedWebsite = body.generatedWebsite;
    const repoName = `website-${generatedWebsite.id}`;

    // Создаем репозиторий
    console.log("Creating GitHub repository...");
    const repo = await createRepoFromTemplate({
      name: repoName,
      description: generatedWebsite.metadata.description,
    }).catch(() => {
      throw new ApiError(
        "Failed to create GitHub repository",
        500,
        "GITHUB_REPO_CREATE_FAILED",
      );
    });
    console.log("Repository created:", repo.full_name);

    // Коммитим файлы
    console.log("Committing files...");
    await commitFiles(
      repo.owner.login,
      repo.name,
      prepareFilesForCommit(generatedWebsite),
    ).catch(() => {
      throw new ApiError(
        "Failed to commit files to repository",
        500,
        "GITHUB_COMMIT_FAILED",
      );
    });
    console.log("Files committed successfully");

    // Инициируем деплой
    console.log("Initiating Cloudflare deployment...");
    const deploymentInit = await initializeCloudflareDeployment({
      name: repoName,
      gitRepository: {
        repo: repo.full_name,
        type: "github",
      },
    });
    console.log("Deployment initialized:", deploymentInit);

    const result: GeneratedWebsite = {
      ...generatedWebsite,
      github: {
        owner: repo.owner.login,
        repo: repo.name,
        url: repo.html_url,
      },
      deployment: {
        url: `https://${deploymentInit.projectName}.pages.dev`,
        deploymentId: deploymentInit.id,
        status: "building",
      },
    };

    return createApiResponse(result, "deploying");
  } catch (err) {
    return handleApiError(err);
  }
}

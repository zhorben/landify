import { Octokit } from "@octokit/rest";
import { config } from "./config";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  headers: {
    "X-GitHub-Api-Version": "2022-11-28",
  },
});

interface CreateRepoOptions {
  name: string;
  description?: string;
  private?: boolean;
}

export async function createRepoFromTemplate({
  name,
  description = "Landing page generated with AI",
  private: isPrivate = false,
}: CreateRepoOptions) {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN is required");
  }

  try {
    // Получаем информацию о текущем пользователе
    const { data: user } = await octokit.users.getAuthenticated();

    const response = await octokit.repos.createUsingTemplate({
      template_owner: config.github.templateRepo.owner,
      template_repo: config.github.templateRepo.name,
      owner: user.login,
      name,
      description,
      private: isPrivate,
      include_all_branches: false,
    });

    return response.data;
  } catch (error) {
    console.error("Failed to create repo from template:", error);
    throw error;
  }
}

async function waitForRepo(owner: string, repo: string, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      // Пробуем получить main branch
      const { data: branch } = await octokit.repos.getBranch({
        owner,
        repo,
        branch: config.github.defaultBranch,
      });

      if (branch.commit) {
        return true;
      }
    } catch (err) {
      console.log(
        `Attempt ${i + 1}: Repo not ready yet`,
        err instanceof Error ? err.message : "Unknown error",
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error("Repository initialization timed out");
}

export async function commitFiles(
  owner: string,
  repo: string,
  files: Map<string, { data: string }>,
  message: string = "Update website content",
) {
  try {
    // Ждем инициализации репозитория
    console.log("Waiting for repository initialization...");
    await waitForRepo(owner, repo);
    console.log("Repository ready");

    // Получаем текущий коммит
    const { data: mainRef } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${config.github.defaultBranch}`,
    });

    // Создаем блобы для файлов
    const blobs = await Promise.all(
      Array.from(files.entries()).map(async ([path, { data }]) => {
        const blob = await octokit.git.createBlob({
          owner,
          repo,
          content: Buffer.from(data).toString("base64"),
          encoding: "base64",
        });
        return {
          path,
          mode: "100644" as const,
          type: "blob" as const,
          sha: blob.data.sha,
        };
      }),
    );

    // Создаем новое дерево на основе существующего
    const tree = await octokit.git.createTree({
      owner,
      repo,
      base_tree: mainRef.object.sha,
      tree: blobs,
    });

    // Создаем новый коммит
    const commit = await octokit.git.createCommit({
      owner,
      repo,
      message,
      tree: tree.data.sha,
      parents: [mainRef.object.sha],
    });

    // Обновляем ветку
    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${config.github.defaultBranch}`,
      sha: commit.data.sha,
    });

    return commit.data;
  } catch (error) {
    console.error("Failed to commit files:", error);
    throw error;
  }
}

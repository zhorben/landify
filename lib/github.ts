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

export async function commitFiles(
  owner: string,
  repo: string,
  files: Map<string, { data: string }>,
  message: string = "Update landing page content",
) {
  try {
    // 1. Получаем текущий коммит в main
    const { data: mainRef } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${config.github.defaultBranch}`,
    });

    // 2. Получаем текущее дерево
    const { data: currentCommit } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: mainRef.object.sha,
    });

    // 3. Создаем блобы для новых файлов
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

    // 4. Создаем новое дерево, используя текущее как базу
    const { data: newTree } = await octokit.git.createTree({
      owner,
      repo,
      base_tree: currentCommit.tree.sha,
      tree: blobs,
    });

    // 5. Создаем новый коммит
    const { data: newCommit } = await octokit.git.createCommit({
      owner,
      repo,
      message,
      tree: newTree.sha,
      parents: [mainRef.object.sha],
    });

    // 6. Обновляем main branch
    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${config.github.defaultBranch}`,
      sha: newCommit.sha,
    });

    return newCommit;
  } catch (error) {
    console.error("Failed to commit files:", error);
    throw error;
  }
}

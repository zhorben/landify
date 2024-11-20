import { generateLandingPage } from "./ai";
import { createRepoFromTemplate, commitFiles } from "./github";
import { deployToVercel } from "./deploy";
import type { Template, GeneratedPage } from "@/types";

export async function generateAndDeployLanding(
  template: Template,
): Promise<GeneratedPage> {
  try {
    // 1. Генерируем контент через AI
    console.log("Generating landing page content...");
    const generatedPage = await generateLandingPage(template);

    // 2. Создаем репозиторий из шаблона
    console.log("Creating GitHub repository...");
    const repoName = `landing-${generatedPage.id}`;
    const repo = await createRepoFromTemplate({
      name: repoName,
      description: template.description,
    });

    // Добавляем небольшую задержку после создания репозитория
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 3. Коммитим сгенерированные файлы
    console.log("Committing generated files...");
    await commitFiles(
      repo.owner.login,
      repo.name,
      prepareFilesForCommit(generatedPage),
    );

    // 4. Деплоим на Vercel
    console.log("Deploying to Vercel...");
    const deployment = await deployToVercel({
      name: repoName,
      gitRepository: {
        repo: repo.full_name,
        type: "github",
      },
    });

    return {
      ...generatedPage,
      github: {
        owner: repo.owner.login,
        repo: repo.name,
        url: repo.html_url,
      },
      deployment: {
        url: deployment.url,
        deploymentId: deployment.id,
        status: deployment.readyState,
      },
    };
  } catch (error) {
    console.error("Generation process failed:", error);
    throw error;
  }
}

export function prepareFilesForCommit(
  page: GeneratedPage,
): Map<string, { data: string }> {
  const files = new Map<string, { data: string }>();

  Object.entries(page.components).forEach(([name, component]) => {
    if (name === "App") {
      files.set("src/App.tsx", {
        data: `${component.imports.join("\n")}\n\n${component.code}`,
      });
    } else if (name === "tailwind.config") {
      files.set("tailwind.config.ts", {
        data: component.code,
      });
    } else if (name.startsWith("components/")) {
      // Компоненты в components/
      files.set(`src/${name}.tsx`, {
        data: `${component.imports.join("\n")}\n\n${component.code}`,
      });
    } else {
      // Страницы в pages/
      files.set(`src/pages/${name}.tsx`, {
        data: `${component.imports.join("\n")}\n\n${component.code}`,
      });
    }
  });

  return files;
}

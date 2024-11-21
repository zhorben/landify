import { generateWebsite } from "./ai";
import { createRepoFromTemplate, commitFiles } from "./github";
import { initializeCloudflareDeployment } from "./deploy/cloudflare"; // Обновленный импорт
import type { Template, GeneratedWebsite } from "@/types";

export async function generateAndDeploy(
  template: Template,
): Promise<GeneratedWebsite> {
  try {
    // 1. Генерируем контент через AI
    console.log("Generating website content...");
    const generatedWebsite = await generateWebsite(template);

    // 2. Создаем репозиторий из шаблона
    console.log("Creating GitHub repository...");
    const repoName = `website-${generatedWebsite.id}`;
    const repo = await createRepoFromTemplate({
      name: repoName,
      description: template.description,
    });

    // 3. Коммитим сгенерированные файлы
    console.log("Committing generated files...");
    await commitFiles(
      repo.owner.login,
      repo.name,
      prepareFilesForCommit(generatedWebsite),
    );

    // 4. Инициируем деплой
    console.log("Initiating Cloudflare deployment...");
    const deploymentInit = await initializeCloudflareDeployment({
      name: repoName,
      gitRepository: {
        repo: repo.full_name,
        type: "github",
      },
    });

    return {
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
  } catch (error) {
    console.error("Generation process failed:", error);
    throw error;
  }
}

export function prepareFilesForCommit(
  website: GeneratedWebsite,
): Map<string, { data: string }> {
  // Эта часть остается без изменений
  const files = new Map<string, { data: string }>();

  Object.entries(website.components).forEach(([name, component]) => {
    if (name === "App") {
      files.set("src/App.tsx", {
        data: `${component.imports.join("\n")}\n\n${component.code}`,
      });
    } else if (name.startsWith("components/")) {
      files.set(`src/${name}.tsx`, {
        data: `${component.imports.join("\n")}\n\n${component.code}`,
      });
    } else {
      files.set(`src/pages/${name}.tsx`, {
        data: `${component.imports.join("\n")}\n\n${component.code}`,
      });
    }
  });

  const metadataContent = `
<title>${website.metadata.title}</title>
<meta name="description" content="${website.metadata.description}" />
<meta name="keywords" content="${website.metadata.keywords.join(", ")}" />

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:title" content="${website.metadata.openGraph.title}" />
<meta property="og:description" content="${website.metadata.openGraph.description}" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${website.metadata.openGraph.title}" />
<meta name="twitter:description" content="${website.metadata.openGraph.description}" />
  `;

  const indexHtml = `
<!DOCTYPE html>
<html lang="${website.metadata.language}">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- BEGIN: Metadata -->
    ${metadataContent}
    <!-- END: Metadata -->

    <script type="module" src="/src/main.tsx"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
  `;

  files.set("index.html", { data: indexHtml });

  return files;
}

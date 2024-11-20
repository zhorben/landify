import { NextResponse } from "next/server";
import { createRepoFromTemplate, commitFiles } from "@/lib/github";
import { deployToVercel } from "@/lib/deploy";
import { prepareFilesForCommit } from "@/lib/generation";
import type { GeneratedPage } from "@/types";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // Проверяем входные данные
    const body = await req.json();
    if (!body.generatedPage) {
      return NextResponse.json(
        { error: "Missing generatedPage in request body" },
        { status: 400 },
      );
    }

    const generatedPage: GeneratedPage = body.generatedPage;

    // Создаем репозиторий
    console.log("Creating GitHub repository...");
    const repoName = `landing-${generatedPage.id}`;

    let repo;
    try {
      repo = await createRepoFromTemplate({
        name: repoName,
        description: generatedPage.metadata.description,
      });
      console.log("Repository created:", repo.full_name);
    } catch (error) {
      console.error("Failed to create repository:", error);
      return NextResponse.json(
        { error: "Failed to create GitHub repository" },
        { status: 500 },
      );
    }

    // Коммитим файлы
    console.log("Committing files...");
    try {
      await commitFiles(
        repo.owner.login,
        repo.name,
        prepareFilesForCommit(generatedPage),
      );
      console.log("Files committed successfully");
    } catch (error) {
      console.error("Failed to commit files:", error);
      return NextResponse.json(
        { error: "Failed to commit files to repository" },
        { status: 500 },
      );
    }

    // Деплоим на Vercel
    console.log("Deploying to Vercel...");
    let deployment;
    try {
      deployment = await deployToVercel({
        name: repoName,
        gitRepository: {
          repo: repo.full_name,
          type: "github",
        },
      });
      console.log("Deployment created:", deployment);
    } catch (error) {
      console.error("Failed to deploy:", error);
      return NextResponse.json(
        { error: "Failed to deploy to Vercel" },
        { status: 500 },
      );
    }

    const result: GeneratedPage = {
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

    return NextResponse.json({
      step: "completed",
      result,
    });
  } catch (error) {
    console.error("Deploy process failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to deploy" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { generateAndDeployLanding } from "@/lib/generation";
import type { Template } from "@/types";

export async function POST(req: Request) {
  try {
    // Проверяем наличие всех необходимых токенов
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is required");
    }
    if (!process.env.GITHUB_TOKEN) {
      throw new Error("GITHUB_TOKEN is required");
    }
    if (!process.env.VERCEL_TOKEN) {
      throw new Error("VERCEL_TOKEN is required");
    }

    const { template } = (await req.json()) as { template: Template };

    // Запускаем процесс генерации и деплоя
    console.log("Starting generation process for template:", template.name);
    const result = await generateAndDeployLanding(template);

    console.log("Generation completed:", {
      id: result.id,
      github: result.github?.url,
      deployment: result.deployment?.url,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process request",
        details: error,
      },
      { status: 500 },
    );
  }
}

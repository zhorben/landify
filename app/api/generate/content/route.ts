import { NextResponse } from "next/server";
import { generateLandingPage } from "@/lib/ai";
import type { Template } from "@/types";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { template } = (await req.json()) as { template: Template };

    console.log("Generating content for template:", template.name);
    const generatedPage = await generateLandingPage(template);

    return NextResponse.json({
      step: "generating",
      generatedPage,
    });
  } catch (error) {
    console.error("Content generation failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate content",
      },
      { status: 500 },
    );
  }
}

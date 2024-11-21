import {
  handleApiError,
  createApiResponse,
  ApiError,
} from "@/lib/api-response";
import { generateWebsite } from "@/lib/ai";
import type { Template } from "@/types";

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.template) {
      throw new ApiError("Template is required", 400);
    }

    const template = body.template as Template;

    console.log("Generating content for template:", template.name);
    const generatedWebsite = await generateWebsite(template);

    return createApiResponse({ generatedWebsite }, "generating");
  } catch (error) {
    return handleApiError(error);
  }
}

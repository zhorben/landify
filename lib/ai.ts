import type {
  Template,
  GeneratedWebsite,
  GeneratedComponent,
  WebsiteMetadata,
} from "@/types";
import Anthropic from "@anthropic-ai/sdk";
import { config } from "./config";
import { generateId } from "./utils";
import { validateWithAI } from "./validation";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateWebsite(
  template: Template,
): Promise<GeneratedWebsite> {
  const validation = await validateWithAI(template.prompt);

  if (!validation.possible) {
    throw new Error(validation.reason);
  }

  const prompt = generatePrompt(template);

  try {
    const message = await anthropic.messages.create({
      model: config.ai.model,
      max_tokens: config.ai.maxTokens,
      temperature: config.ai.temperature,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: config.ai.systemPrompt + "\n\n" + prompt,
            },
          ],
        },
      ],
    });

    if (!message.content.length) {
      throw new Error("Empty response from Claude");
    }

    const responseText = message.content.find(
      (block): block is { type: "text"; text: string } => block.type === "text",
    )?.text;

    if (!responseText) {
      throw new Error("No text response from Claude");
    }

    console.log("AI Response:", responseText);

    validateResponse(responseText);

    const generatedWebsite = parseAIResponse(responseText);
    console.log("Parsed Website:", JSON.stringify(generatedWebsite, null, 2));

    return generatedWebsite;
  } catch (error) {
    console.error("AI Generation error:", error);
    throw error;
  }
}

function validateResponse(response: string) {
  if (!response.includes(".tsx---")) {
    throw new Error("Invalid response format: missing component declarations");
  }

  if (response.length < 100) {
    throw new Error("Response too short");
  }
}

function generatePrompt(template: Template): string {
  return template.prompt;
}

function parseAIResponse(response: string): GeneratedWebsite {
  // Сначала извлекаем метаданные
  const metadataMatch = response.match(/---metadata---\n([\s\S]*?)\n---/);
  let metadata: WebsiteMetadata;

  if (metadataMatch) {
    try {
      // Добавляем логирование для отладки
      console.log("Raw metadata:", metadataMatch[1]);

      // Очищаем JSON перед парсингом
      const cleanedJson = metadataMatch[1].trim().replace(/\n/g, "");
      console.log("Cleaned metadata JSON:", cleanedJson);

      const parsedMetadata = JSON.parse(cleanedJson);
      metadata = {
        title: parsedMetadata.title,
        description: parsedMetadata.description,
        keywords: parsedMetadata.keywords,
        language: "en",
        openGraph: {
          title: parsedMetadata.openGraph.title,
          description: parsedMetadata.openGraph.description,
        },
      };
    } catch (error) {
      console.error("Metadata parsing error:", error);
      metadata = getDefaultMetadata();
    }
  } else {
    metadata = getDefaultMetadata();
  }

  // Извлекаем код компонентов с улучшенным regex
  const componentMatches = response.matchAll(
    /---src\/(.+?)---\n([\s\S]*?)(?=\n---|\n\n[A-Za-z]|$)/g,
  );

  console.log("Starting component processing...");
  const matches = Array.from(componentMatches);

  const components: Record<string, GeneratedComponent> = {};

  for (const match of matches) {
    const [fullMatch, path, code] = match;
    console.log(`Processing component ${path}...`);
    console.log("Code length:", code.length);

    // Извлекаем весь код между маркерами
    const startIndex = response.indexOf(fullMatch) + fullMatch.indexOf(code);
    const nextMarkerIndex = response.indexOf("---src/", startIndex + 1);
    const endIndex =
      nextMarkerIndex === -1
        ? response.indexOf("\n\nThis implementation", startIndex)
        : nextMarkerIndex;

    const fullCode = response
      .slice(startIndex, endIndex === -1 ? undefined : endIndex)
      .trim();
    console.log(`Full code length for ${path}:`, fullCode.length);

    if (path.startsWith("pages/")) {
      const pageName = path.split("/").pop()?.replace(".tsx", "") || "";
      components[pageName] = {
        code: fullCode,
        imports: extractImports(fullCode),
      };
    } else if (path === "App.tsx") {
      components["App"] = {
        code: fullCode,
        imports: extractImports(fullCode),
      };
    } else if (path.startsWith("components/")) {
      const componentPath = path.replace(".tsx", "");
      components[componentPath] = {
        code: fullCode,
        imports: extractImports(fullCode),
      };
    }
  }

  return {
    id: generateId(),
    name: metadata.title,
    components,
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata,
  };
}

function getDefaultMetadata(): WebsiteMetadata {
  return {
    title: "Generated Website",
    description: "AI-generated website built with React and Tailwind CSS",
    keywords: ["react", "website", "ai-generated"],
    language: "en",
    openGraph: {
      title: "Generated Website",
      description: "AI-generated website built with React and Tailwind CSS",
    },
  };
}

function extractImports(code: string): string[] {
  const imports: string[] = [];
  const importRegex = /import\s+.+\s+from\s+['"](.+)['"]/g;
  const matches = code.matchAll(importRegex);

  for (const match of matches) {
    imports.push(match[0]);
  }

  return imports;
}

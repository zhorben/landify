import type { Template, GeneratedPage, GeneratedComponent } from "@/types";
import Anthropic from "@anthropic-ai/sdk";
import { config } from "./config";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateLandingPage(
  template: Template,
): Promise<GeneratedPage> {
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

    console.log("AI Response:", responseText); // Добавляем лог ответа

    validateResponse(responseText);

    const generatedPage = parseAIResponse(responseText);
    console.log("Parsed Page:", JSON.stringify(generatedPage, null, 2));

    return generatedPage;
  } catch (error) {
    handleGenerationError(error);
  }
}

function validateResponse(response: string) {
  // Проверяем только общий формат ответа
  if (!response.includes(".tsx---")) {
    throw new Error("Invalid response format: missing component declarations");
  }

  if (response.length < 100) {
    throw new Error("Response too short");
  }
}

function handleGenerationError(error: unknown): never {
  if (error instanceof Anthropic.APIError) {
    console.error("Claude API Error:", {
      message: error.message,
      status: error.status,
    });
    throw new Error(`Claude API Error: ${error.message}`);
  }

  const errorMessage =
    error instanceof Error ? error.message : "Unknown error occurred";
  console.error("Error generating landing page:", errorMessage);
  throw new Error(`Failed to generate landing page: ${errorMessage}`);
}

function generatePrompt(template: Template): string {
  return template.prompt;
}

function parseAIResponse(response: string): GeneratedPage {
  const components: Record<string, GeneratedComponent> = {};

  // Извлекаем код каждого компонента
  const componentMatches = response.matchAll(
    /---(.+?)\.tsx---\n([\s\S]*?)(?=\n---|\n$)/g,
  );

  for (const match of componentMatches) {
    const [_, path, code] = match;
    // Очищаем путь от 'src/'
    const cleanPath = path.replace("src/", "");

    if (cleanPath.startsWith("pages/")) {
      // Для страниц берем только имя файла
      const fileName = cleanPath.split("/").pop()?.replace(".tsx", "") || "";
      components[fileName] = {
        code: code.trim(),
        imports: extractImports(code),
      };
    } else if (cleanPath === "App.tsx") {
      components["App"] = {
        code: code.trim(),
        imports: extractImports(code),
      };
    } else if (cleanPath.startsWith("components/")) {
      // Для компонентов сохраняем полный путь
      const componentPath = cleanPath.replace(".tsx", "");
      components[componentPath] = {
        code: code.trim(),
        imports: extractImports(code),
      };
    }
  }

  return {
    id: generateId(),
    name: "Generated Landing Page",
    components,
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {
      title: "Landing Page",
      description: "Generated landing page",
      keywords: ["react", "landing-page"],
      language: "en",
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

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

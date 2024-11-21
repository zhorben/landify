import { anthropic } from "./ai";
import { config } from "./config";

type TextBlock = {
  type: "text";
  text: string;
};

interface ValidationResponse {
  possible: boolean;
  reason: string;
}

export async function validateWithAI(
  prompt: string,
): Promise<ValidationResponse> {
  const message = await anthropic.messages.create({
    model: config.ai.model,
    max_tokens: 200,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `
              Determine if this is a request for a simple website/landing page that can be built with React + Tailwind. No complex functionality like auth, databases, payments etc. should be required.

              Prompt: "${prompt}"

              Reply only with:
              {
                "possible": true/false,
                "reason": "short explanation why"
              }
            `,
          },
        ],
      },
    ],
  });

  const responseText = message.content.find(
    (block): block is TextBlock => block.type === "text",
  )?.text;

  if (!responseText) {
    throw new Error("No text response from validation");
  }

  return JSON.parse(responseText) as ValidationResponse;
}

"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const EXAMPLE_PROMPTS = [
  {
    text: "I need a sleek page for my AI-powered coffee recommendation app",
    tags: ["AI", "Coffee", "Recommendations"],
  },
  {
    text: "Create a modern landing page for a SaaS product that helps manage tasks",
    tags: ["SaaS", "Productivity", "Modern"],
  },
  {
    text: "Design a landing page for a mobile fitness app with workout tracking",
    tags: ["Fitness", "Mobile", "Health"],
  },
];

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading?: boolean;
}

export function PromptInput({ onSubmit, isLoading }: PromptInputProps) {
  const [prompt, setPrompt] = useState(
    "I need a sleek page for my AI-powered coffee recommendation app",
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Describe Your Landing Page</CardTitle>
        <CardDescription>
          Tell us about your product and we'll generate a modern landing page
          using React, Tailwind, and shadcn/ui components.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Example: I need a sleek page for my AI-powered coffee recommendation app..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="h-32 resize-none"
        />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Try these examples:</p>
            <Button
              variant="default"
              disabled={isLoading || !prompt.trim()}
              onClick={() => onSubmit(prompt)}
            >
              {isLoading ? "Generating..." : "Generate Page"}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((example, index) => (
              <div
                key={index}
                className="group relative cursor-pointer"
                onClick={() => setPrompt(example.text)}
              >
                <Badge variant="secondary" className="hover:bg-secondary/80">
                  Example {index + 1}
                </Badge>
                <div className="absolute hidden group-hover:block bottom-full mb-2 p-2 bg-popover rounded-lg shadow-lg">
                  <p className="text-sm">{example.text}</p>
                  <div className="flex gap-1 mt-1">
                    {example.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

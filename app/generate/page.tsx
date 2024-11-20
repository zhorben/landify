"use client";

import { useState } from "react";
import { PromptInput } from "@/components/landing/prompt-input";
import { PagePreview } from "@/components/landing/page-preview";
import { useGeneration } from "@/hooks/use-generation";
import { DEFAULT_TEMPLATE } from "@/lib/templates";
import type { GeneratedPage } from "@/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function GeneratePage() {
  const [generatedPage, setGeneratedPage] = useState<GeneratedPage | null>(
    null,
  );

  const { generatePage, isLoading, error } = useGeneration({
    onSuccess: (page) => {
      setGeneratedPage(page);
    },
  });

  const handleGenerate = async (prompt: string) => {
    try {
      await generatePage({
        ...DEFAULT_TEMPLATE,
        prompt,
      });
    } catch (error) {
      console.error("Generation failed:", error);
    }
  };

  const handleTestGeneration = async () => {
    await handleGenerate(DEFAULT_TEMPLATE.prompt);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Generate Your Landing Page</h1>
          <p className="text-muted-foreground">
            Describe your landing page and let AI do the magic
          </p>
          <Button onClick={handleTestGeneration} disabled={isLoading}>
            {isLoading ? "Generating..." : "Test Generation"}
          </Button>
        </div>

        <PromptInput onSubmit={handleGenerate} isLoading={isLoading} />

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        <PagePreview page={generatedPage} isLoading={isLoading} />
      </div>
    </main>
  );
}

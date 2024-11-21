"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PromptInput } from "@/components/generation/prompt-input";
import { PagePreview } from "@/components/generation/page-preview";
import { CodePreview } from "@/components/generation/code-preview";
import { SplitView } from "@/components/layouts/split-view";
import { Panel } from "@/components/layouts/panel";
import { Container } from "@/components/layouts/container";
import { Alert } from "@/components/ui/alert";
import { useGeneration } from "@/hooks/use-generation";

export default function GeneratePage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const { generatePage, isLoading, error, currentStep, page } = useGeneration();

  const startGeneration = async (prompt: string) => {
    setCurrentPrompt(prompt);
    setIsGenerating(true);
    await generatePage({
      id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      name: "Generated Website",
      description: "AI-generated website",
      prompt,
      tags: [],
    });
  };

  const promptHeader = (
    <PromptInput
      initialValue={currentPrompt}
      onSubmit={startGeneration}
      isLoading={isLoading}
      compact
    />
  );

  const previewHeader = (
    <h2 className="text-sm font-medium text-zinc-500">Preview</h2>
  );

  return (
    <div className="min-h-screen bg-white">
      <AnimatePresence>
        {!isGenerating ? (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Container className="py-24">
              <PromptInput onSubmit={startGeneration} isLoading={isLoading} />
            </Container>
          </motion.div>
        ) : (
          <SplitView
            left={
              <Panel header={promptHeader}>
                {error ? (
                  <Alert variant="destructive" className="mb-6">
                    {error.message}
                  </Alert>
                ) : null}
                <CodePreview website={page} />
              </Panel>
            }
            right={
              <Panel header={previewHeader}>
                <PagePreview
                  currentStep={currentStep}
                  page={page}
                  isLoading={isLoading}
                />
              </Panel>
            }
          />
        )}
      </AnimatePresence>
    </div>
  );
}

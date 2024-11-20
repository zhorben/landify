import { useState } from "react";
import type { Template, GeneratedPage } from "@/types";

interface UseGenerationProps {
  onSuccess?: (page: GeneratedPage) => void;
  onError?: (error: Error) => void;
}

export function useGeneration({ onSuccess }: UseGenerationProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentStep, setCurrentStep] = useState<string>("idle");

  async function generatePage(template: Template) {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Генерируем контент
      setCurrentStep("generating");
      const contentResponse = await fetch("/api/generate/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template }),
      });

      if (!contentResponse.ok) {
        const errorData = await contentResponse.json();
        throw new Error(errorData.error || "Failed to generate content");
      }

      const { generatedPage } = await contentResponse.json();

      // 2. Деплоим
      setCurrentStep("deploying");
      const deployResponse = await fetch("/api/generate/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generatedPage }),
      });

      if (!deployResponse.ok) {
        const errorData = await deployResponse.json();
        throw new Error(errorData.error || "Failed to deploy");
      }

      const { result } = await deployResponse.json();

      setCurrentStep("completed");
      onSuccess?.(result);
      return result;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      setError(new Error(errorMessage));
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return {
    generatePage,
    isLoading,
    error,
    currentStep,
  };
}

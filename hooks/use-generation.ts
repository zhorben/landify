import { useState } from "react";
import type { Template, GeneratedWebsite } from "@/types";

interface UseGenerationProps {
  onSuccess?: (page: GeneratedWebsite) => void;
  onError?: (error: Error) => void;
}

export function useGeneration({ onSuccess, onError }: UseGenerationProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentStep, setCurrentStep] = useState<string>("idle");
  const [page, setPage] = useState<GeneratedWebsite | null>(null);

  const generatePage = async (template: Template) => {
    setIsLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 240000); // 4 минуты

      const contentResponse = await fetch("/api/generate/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!contentResponse.ok) {
        if (contentResponse.status === 504) {
          throw new Error(
            "Request timed out. Please try again with a shorter prompt.",
          );
        }
        const errorData = await contentResponse.json();
        throw new Error(errorData.error || "Failed to generate content");
      }

      const { generatedWebsite } = await contentResponse.json();
      setPage(generatedWebsite);

      // 2. Деплоим
      setCurrentStep("deploying");
      const deployResponse = await fetch("/api/generate/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generatedWebsite }),
      });

      if (!deployResponse.ok) {
        const errorData = await deployResponse.json();
        throw new Error(errorData.error || "Failed to deploy");
      }

      const { result } = await deployResponse.json();

      setCurrentStep("completed");
      setPage(result);
      onSuccess?.(result);
      return result;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      setError(new Error(errorMessage));
      onError?.(new Error(errorMessage));
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generatePage,
    isLoading,
    error,
    currentStep,
    page,
  };
}

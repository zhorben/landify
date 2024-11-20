import { useState } from "react";
import type { Template, GeneratedPage } from "@/types";

interface UseGenerationProps {
  onSuccess?: (page: GeneratedPage) => void;
  onError?: (error: Error) => void;
}

export function useGeneration({ onSuccess, onError }: UseGenerationProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function generatePage(template: Template) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ template }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate page");
      }

      const generatedPage = await response.json();
      onSuccess?.(generatedPage);
      return generatedPage;
    } catch (e) {
      const error = e instanceof Error ? e : new Error("Unknown error");
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    generatePage,
    isLoading,
    error,
  };
}

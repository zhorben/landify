import { useState } from "react";
import type { Template, GeneratedWebsite, DeploymentStatus } from "@/types";

interface UseGenerationProps {
  onSuccess?: (page: GeneratedWebsite) => void;
  onError?: (error: Error) => void;
}

export function useGeneration({ onSuccess, onError }: UseGenerationProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentStep, setCurrentStep] = useState<string>("idle");
  const [page, setPage] = useState<GeneratedWebsite | null>(null);

  const checkDeploymentStatus = async (
    projectName: string,
    deploymentId: string,
  ): Promise<{ status: DeploymentStatus; message?: string } | null> => {
    try {
      const response = await fetch(
        `/api/generate/deployment-status?projectName=${encodeURIComponent(
          projectName,
        )}&deploymentId=${encodeURIComponent(deploymentId)}`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to check deployment status: ${response.status}`,
        );
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("Deployment status check failed:", error);
      return null;
    }
  };

  const generatePage = async (template: Template) => {
    setIsLoading(true);
    setError(null);
    setCurrentStep("generating");

    try {
      // 1. Генерация контента
      console.log("Starting content generation...");
      const contentResponse = await fetch("/api/generate/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template }),
      });

      if (!contentResponse.ok) {
        const errorData = await contentResponse.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `Content generation failed: ${contentResponse.status}`,
        );
      }

      const contentData = await contentResponse.json();
      const generatedWebsite = contentData.data.generatedWebsite;
      setPage(generatedWebsite);

      // 2. Инициализация деплоя
      console.log("Starting deployment...");
      setCurrentStep("deploying");
      const deployResponse = await fetch("/api/generate/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generatedWebsite }),
      });

      if (!deployResponse.ok) {
        const errorData = await deployResponse.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Deployment failed: ${deployResponse.status}`,
        );
      }

      const { data: initialDeployment } = await deployResponse.json();
      setPage(initialDeployment);

      // 3. Начинаем поллинг статуса деплоя
      console.log("Starting deployment status polling...");
      const projectName = initialDeployment.deployment.url
        .split("https://")[1]
        .split(".")[0];
      const deploymentId = initialDeployment.deployment.deploymentId;

      let attempts = 0;
      const maxAttempts = 12;
      const pollInterval = 40000; // 40 секунд между проверками

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        attempts++;

        try {
          const status = await checkDeploymentStatus(projectName, deploymentId);
          console.log(
            `Deployment check attempt ${attempts}/${maxAttempts}:`,
            status,
          );

          if (!status) {
            await new Promise((resolve) => setTimeout(resolve, 5000));
            continue;
          }

          const updatedDeployment = {
            ...initialDeployment,
            deployment: {
              ...initialDeployment.deployment,
              status: status.status,
              message: status.message || "Deployment in progress",
            },
          };
          setPage(updatedDeployment);

          if (
            status.status === "ready" &&
            status.message === "Site is live and accessible"
          ) {
            console.log("Deployment completed successfully");
            setCurrentStep("completed");
            onSuccess?.(updatedDeployment);
            return updatedDeployment;
          }

          if (status.status === "failed" || status.status === "canceled") {
            throw new Error(`Deployment failed with status: ${status.status}`);
          }
        } catch (error) {
          console.error(
            `Error during deployment check (attempt ${attempts}):`,
            error,
          );
          if (attempts === maxAttempts) {
            throw error;
          }
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }

      console.log(
        "Max polling attempts reached, but site might still be deploying",
      );
      return initialDeployment;
    } catch (e) {
      setCurrentStep("error");
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      console.error("Generation process failed:", errorMessage);
      setError(new Error(errorMessage));
      onError?.(new Error(errorMessage));
      throw e;
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

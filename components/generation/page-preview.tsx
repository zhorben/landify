import { GeneratedWebsite } from "@/types";
import { ExternalLink, Github } from "lucide-react";

interface PagePreviewProps {
  page: GeneratedWebsite | null;
  currentStep?: string;
  isLoading?: boolean;
}

export function PagePreview({
  page,
  currentStep,
  isLoading,
}: PagePreviewProps) {
  if (!page) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4 max-w-lg mx-auto px-4">
          {isLoading ? (
            <>
              <div className="inline-flex items-center gap-4 text-sm text-zinc-500 bg-white border border-zinc-200 rounded-full px-4 py-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                {currentStep === "generating"
                  ? "AI is crafting your website..."
                  : currentStep === "deploying"
                    ? "Setting up your deployment..."
                    : "Processing your request..."}
              </div>
              <div className="grid grid-cols-3 gap-4 mt-8">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="aspect-video animate-pulse bg-zinc-100 rounded-lg"
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-zinc-100 mx-auto flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-zinc-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-zinc-500 text-sm">
                Your website preview will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {page.deployment?.url ? (
        <>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-2 text-sm">
                <div
                  className={`w-2 h-2 rounded-full ${
                    page.deployment.status === "ready" &&
                    !page.deployment.message?.includes("waiting")
                      ? "bg-green-500"
                      : "bg-yellow-500 animate-pulse"
                  }`}
                />
                <span className="text-zinc-500 truncate">
                  {page.deployment.message || page.deployment.url}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {page.github?.url && (
                <a
                  href={page.github.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              )}
              {page.deployment.status === "ready" &&
                !page.deployment.message?.includes("waiting") && (
                  <a
                    href={page.deployment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open
                  </a>
                )}
            </div>
          </div>
          <div className="flex-1 border border-zinc-200 rounded-lg overflow-hidden bg-white">
            {page.deployment.status === "ready" &&
            !page.deployment.message?.includes("waiting") ? (
              <iframe
                src={page.deployment.url}
                className="w-full h-full border-none"
                title="Website Preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="inline-flex items-center gap-3 text-sm text-zinc-500 bg-white border border-zinc-200 rounded-full px-4 py-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  {page.deployment.message || "Setting up preview..."}
                </div>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

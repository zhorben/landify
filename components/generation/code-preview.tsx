import { GeneratedWebsite } from "@/types";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface CodePreviewProps {
  website: GeneratedWebsite | null;
}

export function CodePreview({ website }: CodePreviewProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (code: string, componentName: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(componentName);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!website?.components) return null;

  return (
    <div className="space-y-6">
      {Object.entries(website.components).map(([name, component]) => (
        <div
          key={name}
          className="rounded-lg border border-zinc-200 bg-white overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-zinc-50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-700 font-mono">
                {name}.tsx
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                copyToClipboard(
                  `${component.imports.join("\n")}\n\n${component.code}`,
                  name,
                )
              }
              className="h-8 px-3 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
            >
              {copied === name ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="relative">
            <pre className="p-4 overflow-auto max-h-[400px] text-sm bg-white">
              <code className="font-mono">
                <span className="text-zinc-400">
                  {component.imports.join("\n")}
                </span>
                {"\n\n"}
                <span className="text-zinc-900">{component.code}</span>
              </code>
            </pre>
            <div className="absolute right-2 top-2 pointer-events-none">
              <div className="text-xs font-medium px-2 py-1 rounded-md bg-zinc-100 text-zinc-500">
                {component.code.split("\n").length} lines
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

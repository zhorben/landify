"use client";

import { useState } from "react";
import type { GeneratedPage } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Copy, Download, Check, ExternalLink, Github } from "lucide-react";

interface PagePreviewProps {
  page: GeneratedPage | null | undefined;
  isLoading?: boolean;
  currentStep?: string;
}

export function PagePreview({
  page,
  isLoading,
  currentStep,
}: PagePreviewProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");

  const copyToClipboard = async (code: string, componentName: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(componentName);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadComponents = () => {
    if (!page) return;

    const files = Object.entries(page.components)
      .map(([name, component]) => {
        return `// ${name}.tsx\n\n${component.imports.join("\n")}\n\n${
          component.code
        }`;
      })
      .join("\n\n// ================\n\n");

    const blob = new Blob([files], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "react-components.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[400px] bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!page) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
            <p>Your generated page will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Preview
          <div className="flex gap-2">
            {page.github?.url && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={page.github.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Github className="h-4 w-4" />
                  View Code
                </a>
              </Button>
            )}
            {page.deployment?.url && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`https://${page.deployment.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Site
                </a>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={downloadComponents}>
              <Download className="h-4 w-4 mr-2" />
              Download Code
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "preview" | "code")}
        >
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-0">
            <div className="w-full h-[600px] border rounded-lg overflow-hidden">
              {page.deployment?.url ? (
                <iframe
                  src={`https://${page.deployment.url}`}
                  className="w-full h-full"
                  title="Preview"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {currentStep === "generating" && "Generating content..."}
                  {currentStep === "deploying" && "Deploying site..."}
                  {currentStep === "completed" && page?.deployment?.url && (
                    <iframe
                      src={`https://${page.deployment.url}`}
                      className="w-full h-full"
                      title="Preview"
                    />
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="code" className="mt-0">
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(page.components).map(([name, component]) => (
                <Card key={name}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {name}.tsx
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          `${component.imports.join("\n")}\n\n${component.code}`,
                          name,
                        )
                      }
                    >
                      {copied === name ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <pre className="p-4 bg-muted rounded-lg overflow-auto max-h-[250px]">
                      <code className="text-sm">
                        {component.imports.join("\n")}
                        {"\n\n"}
                        {component.code}
                      </code>
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

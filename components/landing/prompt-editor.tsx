"use client";

import type { Template } from "@/types";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";

interface PromptEditorProps {
  template?: Template;
  onSubmit: (prompt: string) => void;
  isLoading?: boolean;
}

export function PromptEditor({
  template,
  onSubmit,
  isLoading,
}: PromptEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customize Your Page</CardTitle>
        <CardDescription>
          Describe your desired changes or start from scratch
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          className="min-h-[200px] font-mono text-sm"
          placeholder="Describe your landing page or modify the template prompt..."
          defaultValue={template?.prompt}
        />
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            // Reset to template prompt
          }}
        >
          Reset to Template
        </Button>
        <Button
          onClick={() => {
            // Submit prompt
          }}
          disabled={isLoading}
        >
          {isLoading ? "Generating..." : "Generate Page"}
        </Button>
      </CardFooter>
    </Card>
  );
}

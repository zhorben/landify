import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { PromptCard } from "@/components/shared/prompt-card";
import { ActionButton } from "@/components/shared/action-button";
import { PROMPTS } from "@/lib/prompts";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants/common";
import type { Prompt } from "@/types/prompt";

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading?: boolean;
  compact?: boolean;
  initialValue?: string;
}

export function PromptInput({
  onSubmit,
  isLoading,
  compact,
  initialValue = "",
}: PromptInputProps) {
  const [prompt, setPrompt] = useState(initialValue);

  const handlePromptSelect = (selectedPrompt: Prompt) => {
    setPrompt(selectedPrompt.text);
  };

  return (
    <div className={compact ? "" : "max-w-3xl mx-auto"}>
      <div className="space-y-8">
        {!compact && (
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-4xl font-medium text-zinc-900">{APP_NAME}</h2>
            <p className="text-xl text-muted-foreground">{APP_TAGLINE}</p>
          </div>
        )}

        <div className="space-y-4">
          <Textarea
            placeholder="Example: I need a sleek page for my AI-powered coffee recommendation app..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className={`min-h-[120px] resize-none bg-white border border-zinc-200
                rounded-lg text-base placeholder:text-zinc-400
                focus:border-zinc-400 focus:ring-0 transition-colors
                ${compact ? "min-h-[80px]" : ""}`}
          />

          <div className="flex justify-end">
            <ActionButton
              onClick={() => onSubmit(prompt)}
              disabled={!prompt.trim()}
              loading={isLoading}
              compact={compact}
            >
              Create Magic ✨
            </ActionButton>
          </div>
        </div>

        {!compact && (
          <div className="pt-8 space-y-4">
            <div className="h-px bg-zinc-200" />
            <h3 className="text-sm font-medium text-zinc-900">
              Magic templates 💫
            </h3>
            <div className="grid gap-3">
              {PROMPTS.map((prompt, index) => (
                <PromptCard
                  key={index}
                  prompt={prompt}
                  onClick={handlePromptSelect}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

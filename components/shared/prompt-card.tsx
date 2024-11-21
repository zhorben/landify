import Link from "next/link";
import type { Prompt } from "@/types/prompt";

interface PromptCardProps {
  prompt: Prompt;
  onClick?: (prompt: Prompt) => void;
  href?: string;
  className?: string;
}

export function PromptCard({
  prompt,
  onClick,
  href,
  className = "",
}: PromptCardProps) {
  const content = (
    <>
      <p className="font-medium group-hover:text-accent-foreground">
        {prompt.title}
      </p>
      <p className="text-sm text-muted-foreground">{prompt.description}</p>
    </>
  );

  const classes = `group p-4 border rounded-lg hover:bg-accent text-left transition-colors ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={() => onClick?.(prompt)} className={classes}>
      {content}
    </button>
  );
}

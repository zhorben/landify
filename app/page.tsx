import Link from "next/link";
import { PROMPTS } from "@/lib/prompts";
import { Container } from "@/components/layouts/container";
import { PromptCard } from "@/components/shared/prompt-card";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants/common";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <Container>
        <div className="space-y-8 text-center">
          <h1 className="text-5xl font-medium text-foreground">{APP_NAME}</h1>
          <p className="text-xl text-muted-foreground">{APP_TAGLINE}</p>

          <Link
            href="/generate"
            className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-medium"
          >
            Let&apos;s Build Magic ✨
          </Link>

          <div className="pt-12">
            <h2 className="text-lg font-medium mb-4">
              Spark your imagination 💫
            </h2>
            <div className="grid gap-4">
              {PROMPTS.map((prompt, index) => (
                <PromptCard
                  key={index}
                  prompt={prompt}
                  href={`/generate?prompt=${encodeURIComponent(prompt.text)}`}
                />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}

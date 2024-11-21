import Link from "next/link";
import { Container } from "@/components/layouts/container";
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
        </div>
      </Container>
    </main>
  );
}

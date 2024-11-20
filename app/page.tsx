import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-4xl text-center">
        <h1 className="text-5xl font-bold mb-6">
          Create Landing Pages with AI
        </h1>
        <p className="text-xl mb-8 text-gray-600">
          Transform your ideas into beautiful landing pages in seconds using
          artificial intelligence
        </p>
        <Link
          href="/generate"
          className="inline-block bg-black hover:bg-gray-800 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
        >
          Start Creating
        </Link>
      </div>
    </main>
  );
}

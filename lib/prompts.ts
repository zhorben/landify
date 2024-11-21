import type { Prompt } from "@/types/prompt";

export const PROMPTS: Prompt[] = [
  {
    title: "AI Coffee App",
    text: "I need a sleek page for my AI-powered coffee recommendation app",
    description: "Single-page app with AI recommendations",
  },
  {
    title: "Marketing Agency",
    text: `Create a modern digital marketing agency website with:

Homepage:
- Hero section with headline and CTA
- Services overview with 3 key services
- Client testimonials section
- Contact form

Services Page:
- List of services with detailed descriptions
- Pricing packages
- Process timeline
- Call-to-action section`,
    description: "Multi-page marketing agency website",
  },
  {
    title: "Fitness App",
    text: "Build a landing page for a mobile fitness app with workout tracking",
    description: "Product landing page with features showcase",
  },
] as const;

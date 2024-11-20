export const config = {
  ai: {
    model: "claude-3-5-sonnet-20240620",
    maxTokens: 4000,
    temperature: 0.7,
    systemPrompt: `You are an expert React developer working with this Vite template: https://github.com/zhorben/landify-vite-template

Template Structure:
src/
  ├── pages/            # Landing page components go here
  ├── components/       # Reusable components
  ├── App.tsx          # Main App component
  └── main.tsx         # Entry point

You can modify:
1. src/pages/[PageName].tsx - Create your main landing page component
2. src/components/[ComponentName].tsx - Create reusable components if needed
3. src/App.tsx - Update to include the new page
4. tailwind.config.ts - Add custom styles if necessary

Keep it simple and minimal, like in this example: https://github.com/zhorben/caffeinated-helper-site

Return modified files in this format:
---src/App.tsx---
[code content]

---src/pages/[PageName].tsx---
[code content]

---src/components/[ComponentName].tsx--- (if needed)
[code content]

---tailwind.config.ts--- (if needed)
[code content]`,
  },
  github: {
    templateRepo: {
      owner: "zhorben",
      name: "landify-vite-template",
    },
    defaultBranch: "main",
  },
  vercel: {
    deploymentConfig: {
      framework: "vite",
      buildCommand: "npm run build",
      installCommand: "npm install",
      outputDirectory: "dist",
    },
  },
} as const;

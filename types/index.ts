export interface Template {
  id: string;
  name: string;
  description: string;
  prompt: string;
  tags?: string[];
}

export interface GeneratedComponent {
  code: string;
  imports: string[];
}

interface OpenGraph {
  title: string;
  description: string;
}

export interface WebsiteMetadata {
  title: string;
  description: string;
  keywords: string[];
  language: string;
  openGraph: OpenGraph;
}

interface GitHubInfo {
  owner: string;
  repo: string;
  url: string;
}

export type DeploymentStatus =
  | "initializing"
  | "pending"
  | "building"
  | "ready"
  | "failed"
  | "canceled"
  | "success"
  | "queued"
  | "active";

export interface DeploymentInfo {
  url: string;
  deploymentId: string;
  status: DeploymentStatus;
  message?: string;
}

export type GenerationStep =
  | { step: "generating" }
  | { step: "deploying" }
  | { step: "completed"; result: GeneratedWebsite }
  | { step: "error"; error: string };

export interface GeneratedWebsite {
  id: string;
  name: string;
  components: Record<string, GeneratedComponent>;
  github?: GitHubInfo;
  deployment?: DeploymentInfo;
  createdAt: Date;
  updatedAt: Date;
  metadata: WebsiteMetadata;
}

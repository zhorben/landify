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

export interface PageMetadata {
  title: string;
  description: string;
  keywords: string[];
  language: string;
}

interface GitHubInfo {
  owner: string;
  repo: string;
  url: string;
}

export type DeploymentStatus =
  | "INITIALIZING"
  | "ANALYZING"
  | "BUILDING"
  | "DEPLOYING"
  | "READY"
  | "QUEUED"
  | "CANCELED"
  | "ERROR";

export interface DeploymentInfo {
  url: string;
  deploymentId: string;
  status: DeploymentStatus;
}

export type GenerationStep =
  | { step: "generating" }
  | { step: "deploying" }
  | { step: "completed"; result: GeneratedPage }
  | { step: "error"; error: string };

export interface GeneratedPage {
  id: string;
  name: string;
  components: Record<string, GeneratedComponent>;
  github?: GitHubInfo;
  deployment?: DeploymentInfo;
  createdAt: Date;
  updatedAt: Date;
  metadata: PageMetadata;
}

interface DeployOptions {
  name: string;
  gitRepository: {
    repo: string;
    type: "github";
  };
}

export async function deployToVercel({ name, gitRepository }: DeployOptions) {
  if (!process.env.VERCEL_TOKEN) {
    throw new Error("VERCEL_TOKEN is required");
  }

  try {
    // 1. Создаем проект
    console.log("Creating Vercel project...");
    const project = await createProject(name, gitRepository);
    console.log("Project created:", project);

    // 2. Создаем деплоймент, используя то же имя
    console.log("Creating deployment...");
    const deployment = await createDeployment(
      project.id,
      gitRepository.repo,
      name,
    );
    console.log("Deployment created:", deployment);

    return {
      id: deployment.id,
      url: deployment.url,
      readyState: deployment.readyState,
    };
  } catch (error) {
    console.error("Vercel deployment failed:", error);
    throw error;
  }
}

async function createProject(
  name: string,
  gitRepository: DeployOptions["gitRepository"],
) {
  const projectData = {
    name,
    framework: "vite",
    gitRepository: {
      repo: gitRepository.repo,
      type: gitRepository.type,
    },
    buildCommand: "npm run build",
    installCommand: "npm install",
    outputDirectory: "dist",
  };

  console.log("Project request data:", projectData);

  const response = await fetch("https://api.vercel.com/v10/projects", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(projectData),
  });

  const responseData = await response.json();
  console.log("Project response:", {
    status: response.status,
    statusText: response.statusText,
    data: responseData,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to create project: ${JSON.stringify(responseData.error) || "Unknown error"}`,
    );
  }

  return responseData;
}

async function createDeployment(projectId: string, repo: string, name: string) {
  // Получаем информацию о проекте, чтобы взять правильный repoId
  const projectResponse = await fetch(
    `https://api.vercel.com/v9/projects/${projectId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
      },
    },
  );

  const project = await projectResponse.json();
  const repoId = project.link.repoId;

  const deployData = {
    name,
    gitSource: {
      type: "github",
      ref: "main",
      repoId: repoId,
    },
    target: "production",
    projectSettings: {
      framework: "vite",
      buildCommand: "npm run build",
      installCommand: "npm install",
      outputDirectory: "dist",
      nodeVersion: "18.x",
    },
  };

  console.log("Deployment request data:", deployData);

  const response = await fetch(
    `https://api.vercel.com/v13/deployments?projectId=${projectId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(deployData),
    },
  );

  const responseData = await response.json();
  console.log("Deployment response:", {
    status: response.status,
    statusText: response.statusText,
    data: responseData,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to create deployment: ${responseData.error?.message || JSON.stringify(responseData)}`,
    );
  }

  return responseData;
}

import {
  handleApiError,
  createApiResponse,
  ApiError,
} from "@/lib/api-response";
import { getCloudflareDeploymentStatus } from "@/lib/deploy/cloudflare";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectName = searchParams.get("projectName");
    const deploymentId = searchParams.get("deploymentId");

    if (!projectName || !deploymentId) {
      throw new ApiError("Missing required parameters", 400);
    }

    const status = await getCloudflareDeploymentStatus(
      projectName,
      deploymentId,
    );
    return createApiResponse(status);
  } catch (error) {
    return handleApiError(error);
  }
}

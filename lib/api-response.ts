import { NextResponse } from "next/server";

export type ApiResponse<T> = {
  data?: T;
  error?: string;
  step?: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function createApiResponse<T>(
  response: T,
  step?: string,
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    data: response,
    step,
  });
}

export function handleApiError(
  error: unknown,
): NextResponse<ApiResponse<never>> {
  console.error("API Error:", error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode },
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      error: "An unexpected error occurred",
    },
    { status: 500 },
  );
}

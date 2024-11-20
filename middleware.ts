import { NextResponse } from "next/server";

export function middleware() {
  const response = NextResponse.next();

  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "*");

  response.headers.set("X-Frame-Options", "ALLOWALL");
  response.headers.delete("X-Frame-Options");

  return response;
}

export const config = {
  matcher: "/:path*",
};

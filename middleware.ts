import { NextRequest, NextResponse } from "next/server";

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Simply log the request for debugging
  console.log(`[${new Date().toISOString()}] ${request.method} ${request.nextUrl.pathname}`);
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};

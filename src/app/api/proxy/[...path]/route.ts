import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxy(request, params, "GET");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxy(request, params, "POST");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxy(request, params, "PATCH");
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxy(request, params, "PUT");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxy(request, params, "DELETE");
}

async function handleProxy(
  request: NextRequest,
  paramsPromise: Promise<{ path: string[] }>,
  method: string
) {
  const { path } = await paramsPromise;

  // Get the backend URL from the request header
  const backendUrl = request.headers.get("X-Backend-URL");
  const adminKey = request.headers.get("X-ADMIN-KEY");

  if (!backendUrl) {
    return NextResponse.json(
      { error: "Missing X-Backend-URL header" },
      { status: 400 }
    );
  }

  // Build the target URL
  const targetPath = "/" + path.join("/");
  const searchParams = request.nextUrl.searchParams.toString();
  const targetUrl = `${backendUrl.replace(/\/$/, "")}${targetPath}${
    searchParams ? `?${searchParams}` : ""
  }`;

  // Prepare headers for the backend request
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (adminKey) {
    headers["X-ADMIN-KEY"] = adminKey;
  }

  try {
    // Get request body if present
    let body: string | undefined;
    if (method !== "GET" && method !== "DELETE") {
      try {
        const text = await request.text();
        if (text) {
          body = text;
        }
      } catch {
        // No body
      }
    }

    // Forward the request to the backend
    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
    });

    // Get response data
    let data;
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Return the response
    if (typeof data === "string") {
      return new NextResponse(data, {
        status: response.status,
        headers: {
          "Content-Type": contentType || "text/plain",
        },
      });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Proxy request failed" },
      { status: 500 }
    );
  }
}

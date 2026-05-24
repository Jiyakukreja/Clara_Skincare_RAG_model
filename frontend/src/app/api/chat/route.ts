export const runtime = "edge";
export const maxDuration = 10;

const DEFAULT_LOCAL_BACKEND_URL = "http://localhost:8000/chat";
const BACKEND_URL = process.env.BACKEND_URL ?? DEFAULT_LOCAL_BACKEND_URL;
const BACKEND_TIMEOUT_MS = Number(process.env.BACKEND_TIMEOUT_MS ?? 8_000);

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

export async function POST(request: Request) {
  if (!process.env.BACKEND_URL && process.env.VERCEL) {
    return Response.json(
      {
        detail: "BACKEND_URL is not configured for this deployment. Add your deployed FastAPI /chat URL in Vercel.",
      },
      { status: 500 },
    );
  }

  const body = await request.json();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify(body),
    });
  } catch (error) {
    const isAbort = isAbortError(error);
    return Response.json(
      {
        detail: isAbort
          ? "The AI backend took too long to respond. Please try again in a moment."
          : "Could not reach the AI backend. Please check the backend deployment.",
      },
      { status: isAbort ? 504 : 502 },
    );
  } finally {
    clearTimeout(timeout);
  }

  const contentType = response.headers.get("content-type") ?? "application/json; charset=utf-8";
  const payload = await response.text();

  return new Response(payload, {
    status: response.status,
    headers: {
      "Content-Type": contentType,
    },
  });
}

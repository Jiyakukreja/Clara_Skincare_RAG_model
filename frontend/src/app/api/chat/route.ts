export const runtime = "nodejs";
export const maxDuration = 60;

const DEFAULT_LOCAL_BACKEND_URL = "http://127.0.0.1:8000/chat";
const BACKEND_URL = process.env.BACKEND_URL ?? DEFAULT_LOCAL_BACKEND_URL;
const BACKEND_TIMEOUT_MS = Number(process.env.BACKEND_TIMEOUT_MS ?? 55_000);

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function isHtmlPayload(text: string) {
  const trimmed = text.trimStart().toLowerCase();
  return trimmed.startsWith("<!doctype") || trimmed.startsWith("<html");
}

function jsonError(detail: string, status: number) {
  return Response.json({ detail }, { status });
}

export async function POST(request: Request) {
  try {
    if (!process.env.BACKEND_URL && process.env.VERCEL) {
      return jsonError(
        "BACKEND_URL is not configured. In Vercel, set BACKEND_URL to your deployed FastAPI /chat URL.",
        503,
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid JSON request body.", 400);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify(body),
      });
    } catch (error) {
      const isAbort = isAbortError(error);
      const isLocalBackend = BACKEND_URL.includes("127.0.0.1") || BACKEND_URL.includes("localhost");
      return jsonError(
        isAbort
          ? "The AI backend took too long to respond. Please try again in a moment."
          : isLocalBackend
            ? "Could not reach the AI backend at http://127.0.0.1:8000. Start it with: cd backend && uvicorn app.main:app --reload --port 8000"
            : "Could not reach the AI backend. Check BACKEND_URL and that the FastAPI service is running.",
        isAbort ? 504 : 502,
      );
    } finally {
      clearTimeout(timeout);
    }

    const payload = await response.text();

    if (isHtmlPayload(payload)) {
      return jsonError(
        "The AI backend returned an error page instead of JSON. Check that FastAPI is running and GEMINI_API_KEY is set.",
        502,
      );
    }

    return new Response(payload, {
      status: response.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Chat proxy failed:", error);
    return jsonError("The chat proxy failed unexpectedly. Please try again.", 502);
  }
}

export const runtime = "edge";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000/chat";
const BACKEND_TIMEOUT_MS = 25_000;

export async function POST(request: Request) {
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
    const isAbort = error instanceof DOMException && error.name === "AbortError";
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

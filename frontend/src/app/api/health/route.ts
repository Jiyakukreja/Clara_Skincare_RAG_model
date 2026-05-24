export const runtime = "nodejs";

const DEFAULT_HEALTH_URL = "http://127.0.0.1:8000/health";

function backendHealthUrl() {
  const chatUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:8000/chat";
  return chatUrl.replace(/\/chat\/?$/, "/health");
}

export async function GET() {
  if (!process.env.BACKEND_URL && process.env.VERCEL) {
    return Response.json({
      ok: false,
      detail: "BACKEND_URL is not set in Vercel. Add your deployed FastAPI /chat URL.",
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4_000);

  try {
    const response = await fetch(backendHealthUrl() || DEFAULT_HEALTH_URL, {
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      return Response.json({
        ok: false,
        detail: "AI backend health check failed.",
      });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({
      ok: false,
      detail:
        "AI backend is not running. Start: cd backend && uvicorn app.main:app --reload --port 8000",
    });
  } finally {
    clearTimeout(timeout);
  }
}

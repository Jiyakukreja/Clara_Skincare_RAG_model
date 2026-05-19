export const runtime = "edge";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000/chat";

export async function POST(request: Request) {
  const body = await request.json();
  const response = await fetch(BACKEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type") ?? "application/json; charset=utf-8";
  const payload = await response.text();

  return new Response(payload, {
    status: response.status,
    headers: {
      "Content-Type": contentType,
    },
  });
}

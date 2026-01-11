import { NextResponse } from "next/server";

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

function isValidBaseUrl(baseUrl: string) {
  // Basic validation to reduce SSRF risk. You can tighten this further.
  return /^https?:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(baseUrl);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const baseUrl = searchParams.get("baseUrl");

  if (!baseUrl || !isValidBaseUrl(baseUrl)) {
    return NextResponse.json({ error: "Invalid or missing baseUrl" }, { status: 400 });
  }

  try {
    const r = await fetch(`${normalizeBaseUrl(baseUrl)}/json/state`, { cache: "no-store" });
    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Proxy GET failed" }, { status: 502 });
  }
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const baseUrl = searchParams.get("baseUrl");

  if (!baseUrl || !isValidBaseUrl(baseUrl)) {
    return NextResponse.json({ error: "Invalid or missing baseUrl" }, { status: 400 });
  }

  try {
    const body = await req.json();

    const r = await fetch(`${normalizeBaseUrl(baseUrl)}/json/state`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    // WLED often returns JSON, but we’ll be defensive
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Proxy POST failed" }, { status: 502 });
  }
}

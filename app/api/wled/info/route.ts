import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const baseUrl = searchParams.get("baseUrl");

  if (!baseUrl) {
    return NextResponse.json({ error: "Missing baseUrl" }, { status: 400 });
  }

  // Basic allowlist-ish validation (you can harden this further)
  if (!/^https?:\/\//i.test(baseUrl)) {
    return NextResponse.json({ error: "baseUrl must start with http:// or https://" }, { status: 400 });
  }

  try {
    const r = await fetch(`${baseUrl.replace(/\/+$/, "")}/json/info`, { cache: "no-store" });
    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Proxy fetch failed" }, { status: 502 });
  }
}

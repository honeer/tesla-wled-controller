"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type WledDeviceControllerProps = {
  title: string;
  baseUrl: string;
  connected: boolean;

  onOpenSettings?: () => void;

  solidPresets?: { label: string; ps: number }[];
  animatedPresets?: { label: string; ps: number }[];

  colorPresets?: { label: string; rgb: [number, number, number] }[];
};

type DeviceStatus = "idle" | "loading" | "ready" | "error";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function percentToBri(percent: number) {
  return Math.round((clamp(percent, 0, 100) / 100) * 255);
}

function briToPercent(bri: number) {
  return Math.round((clamp(bri, 0, 255) / 255) * 100);
}

function rgbToHex([r, g, b]: [number, number, number]) {
  const to = (x: number) => x.toString(16).padStart(2, "0");
  return `#${to(clamp(r, 0, 255))}${to(clamp(g, 0, 255))}${to(clamp(b, 0, 255))}`;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const v = hex.trim().replace(/^#/, "");
  if (v.length !== 6) return null;
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  if ([r, g, b].some((x) => Number.isNaN(x))) return null;
  return [r, g, b];
}

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

async function proxyGetState(baseUrl: string, signal?: AbortSignal) {
  const url = `/api/wled/state?baseUrl=${encodeURIComponent(baseUrl)}`;
  const res = await fetch(url, { method: "GET", cache: "no-store", signal });
  if (!res.ok) throw new Error(`GET state failed: HTTP ${res.status}`);
  return res.json();
}

async function proxyPostState(baseUrl: string, body: any, signal?: AbortSignal) {
  const url = `/api/wled/state?baseUrl=${encodeURIComponent(baseUrl)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) throw new Error(`POST state failed: HTTP ${res.status}`);
  return res.json().catch(() => ({}));
}

export function WledDeviceController({
  title,
  baseUrl,
  connected,
  onOpenSettings,
  solidPresets = [
    { label: "1", ps: 1 },
    { label: "2", ps: 2 },
    { label: "3", ps: 3 },
    { label: "4", ps: 4 },
    { label: "5", ps: 5 },
    { label: "6", ps: 6 },
  ],
  animatedPresets = [
    { label: "1", ps: 7 },
    { label: "2", ps: 8 },
    { label: "3", ps: 9 },
  ],
  colorPresets = [
    { label: "Warm", rgb: [255, 160, 60] },
    { label: "Cool", rgb: [180, 220, 255] },
    { label: "Red", rgb: [255, 0, 0] },
    { label: "Green", rgb: [0, 255, 0] },
    { label: "Blue", rgb: [0, 0, 255] },
  ],
}: WledDeviceControllerProps) {
  const normalized = React.useMemo(() => normalizeBaseUrl(baseUrl), [baseUrl]);

  const [status, setStatus] = React.useState<DeviceStatus>("idle");
  const [error, setError] = React.useState<string | null>(null);

  const [power, setPower] = React.useState(true);
  const [brightness, setBrightness] = React.useState(50); // 0..100 (%)

  const [rgb, setRgb] = React.useState<[number, number, number]>([255, 255, 255]);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const briTimer = React.useRef<number | null>(null);

  const disabled = !connected || !normalized || status === "loading";

  const refresh = React.useCallback(async () => {
    if (!normalized) return;
    const controller = new AbortController();
    setStatus("loading");
    setError(null);

    try {
      const s = await proxyGetState(normalized, controller.signal);

      setPower(Boolean(s?.on));

      if (typeof s?.bri === "number") {
        setBrightness(briToPercent(s.bri));
      } else {
        setBrightness(50);
      }

      const col = s?.seg?.[0]?.col?.[0];
      if (Array.isArray(col) && col.length >= 3) {
        setRgb([clamp(col[0], 0, 255), clamp(col[1], 0, 255), clamp(col[2], 0, 255)]);
      }

      setStatus("ready");
    } catch (e: any) {
      setStatus("error");
      setError(e?.message ?? "Failed to refresh state");
    }
  }, [normalized]);

  React.useEffect(() => {
    if (!connected) return;
    refresh();
  }, [connected, refresh]);

  const post = React.useCallback(
    async (body: any) => {
      if (!normalized) return;
      try {
        await proxyPostState(normalized, body);
      } catch (e: any) {
        setStatus("error");
        setError(e?.message ?? "Failed to send command");
      }
    },
    [normalized]
  );

  const setOn = async (on: boolean) => {
    setPower(on);
    await post({ on });
  };

  const setBrightnessPercent = (nextPercent: number) => {
    const p = clamp(nextPercent, 0, 100);
    setBrightness(p);

    if (briTimer.current) window.clearTimeout(briTimer.current);
    briTimer.current = window.setTimeout(() => {
      post({ bri: percentToBri(p) });
      // Optional: if (p > 0) post({ on: true, bri: percentToBri(p) });
    }, 90);
  };

  const applyRgb = async (next: [number, number, number]) => {
    setRgb(next);
    await post({ seg: [{ id: 0, col: [next] }] });
  };

  const applyPreset = async (ps: number) => {
    await post({ ps });
  };

  const hex = rgbToHex(rgb);

  return (
    <Card className="w-full">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="break-all">{normalized || "No address set"}</CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {!connected ? (
              <Badge variant="outline">Not connected</Badge>
            ) : status === "ready" ? (
              <Badge>Online</Badge>
            ) : status === "loading" ? (
              <Badge variant="secondary">Loading…</Badge>
            ) : status === "error" ? (
              <Badge variant="destructive">Offline</Badge>
            ) : (
              <Badge variant="outline">Idle</Badge>
            )}

            <Button variant="outline" size="sm" onClick={refresh} disabled={disabled}>
              Refresh
            </Button>
          </div>
        </div>

        {!connected ? (
          <div className="rounded-lg border p-3 text-sm">
            <div className="font-medium">Device not connected</div>
            <div className="mt-1 text-muted-foreground">
              Open Settings and click <span className="font-medium">Test</span> to enable controls.
            </div>
            <div className="mt-3">
              <Button onClick={onOpenSettings} disabled={!onOpenSettings}>
                Open Settings
              </Button>
            </div>
          </div>
        ) : null}

        {connected && error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
            <div className="font-medium text-destructive">Device unreachable</div>
            <div className="mt-1 text-muted-foreground">{error}</div>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" onClick={refresh} disabled={status === "loading"}>
                Retry
              </Button>
              <Button variant="outline" onClick={onOpenSettings} disabled={!onOpenSettings}>
                Settings
              </Button>
            </div>
          </div>
        ) : null}
      </CardHeader>

      <CardContent className={cn("space-y-6", !connected && "opacity-60")}>
        {/* Power */}
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="font-medium">Power</div>
            <div className="text-sm text-muted-foreground">{power ? "On" : "Off"}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={power ? "default" : "outline"} onClick={() => setOn(true)} disabled={disabled}>
              On
            </Button>
            <Button variant={!power ? "default" : "outline"} onClick={() => setOn(false)} disabled={disabled}>
              Off
            </Button>
          </div>
        </div>

        <Separator />

        {/* Brightness (0-100%) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium">Brightness</div>
              <div className="text-sm text-muted-foreground">{brightness}%</div>
            </div>
            <div
              className="h-7 w-12 rounded-md border"
              style={{ backgroundColor: power ? hex : "transparent", opacity: power ? 1 : 0.35 }}
              aria-label="Current color preview"
            />
          </div>

          <Slider
            value={[brightness]}
            min={0}
            max={100}
            step={1}
            onValueChange={(v) => setBrightnessPercent(v[0] ?? 0)}
            disabled={disabled}
          />
        </div>

        <Separator />

        {/* Color presets + picker */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="font-medium">Color</div>
              <div className="text-sm text-muted-foreground">{hex.toUpperCase()}</div>
            </div>

            <Button variant="outline" onClick={() => setPickerOpen((s) => !s)} disabled={disabled}>
              {pickerOpen ? "Close picker" : "Open picker"}
            </Button>
          </div>

          {pickerOpen ? (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
              <div className="space-y-1">
                <Label htmlFor={`${title}-color`}>Pick color</Label>
                <input
                  id={`${title}-color`}
                  type="color"
                  value={hex}
                  onChange={(e) => {
                    const parsed = hexToRgb(e.target.value);
                    if (parsed) applyRgb(parsed);
                  }}
                  disabled={disabled}
                  className={cn(
                    "h-10 w-14 cursor-pointer rounded-md border bg-transparent p-1",
                    "disabled:cursor-not-allowed disabled:opacity-60"
                  )}
                />
              </div>

              <div className="text-sm text-muted-foreground">Presets below apply instantly too.</div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {colorPresets.map((c) => {
              const chipHex = rgbToHex(c.rgb);
              const isActive = chipHex.toLowerCase() === hex.toLowerCase();
              return (
                <Button
                  key={c.label}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyRgb(c.rgb)}
                  disabled={disabled}
                  className="gap-2"
                >
                  <span className="inline-block h-4 w-4 rounded-sm border" style={{ backgroundColor: chipHex }} />
                  {c.label}
                </Button>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Solid presets */}
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="font-medium">Solid Presets</div>
            <div className="text-sm text-muted-foreground">Static colors and brightness presets.</div>
          </div>

          <div className="flex flex-wrap gap-2">
            {solidPresets.map((p) => (
              <Button
                key={`solid-${p.label}-${p.ps}`}
                variant="secondary"
                onClick={() => applyPreset(p.ps)}
                disabled={disabled}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Animated presets */}
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="font-medium">Animated Presets</div>
            <div className="text-sm text-muted-foreground">Motion and effect-based presets.</div>
          </div>

          <div className="flex flex-wrap gap-2">
            {animatedPresets.map((p) => (
              <Button
                key={`anim-${p.label}-${p.ps}`}
                variant="outline"
                onClick={() => applyPreset(p.ps)}
                disabled={disabled}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="justify-end gap-2">
        <Button variant="outline" onClick={() => applyRgb([255, 255, 255])} disabled={disabled}>
          White
        </Button>
        <Button variant="ghost" onClick={onOpenSettings} disabled={!onOpenSettings}>
          Settings
        </Button>
      </CardFooter>
    </Card>
  );
}

"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useWledDevices, type WledDeviceId } from "@/components/wled/wled-devices-provider";

type TestStatus = "idle" | "testing" | "ok" | "fail";

async function testViaProxy(baseUrl: string) {
  const url = `/api/wled/state?baseUrl=${encodeURIComponent(baseUrl)}`;
  const res = await fetch(url, { method: "GET", cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function WledSettingsPanel() {
  const { devices, setDevice, reset } = useWledDevices();
  const [testStatus, setTestStatus] = React.useState<Record<WledDeviceId, TestStatus>>({
    esp1: "idle",
    esp2: "idle",
    esp3: "idle",
  });
  const [testError, setTestError] = React.useState<Record<WledDeviceId, string | null>>({
    esp1: null,
    esp2: null,
    esp3: null,
  });

  const ids: WledDeviceId[] = ["esp1", "esp2", "esp3"];

  const runTest = async (id: WledDeviceId) => {
    const baseUrl = devices[id].baseUrl;

    setTestStatus((p) => ({ ...p, [id]: "testing" }));
    setTestError((p) => ({ ...p, [id]: null }));

    try {
      await testViaProxy(baseUrl);

      setTestStatus((p) => ({ ...p, [id]: "ok" }));
      setDevice(id, { connected: true, lastCheckedAt: Date.now() });
    } catch (e: any) {
      setTestStatus((p) => ({ ...p, [id]: "fail" }));
      setTestError((p) => ({ ...p, [id]: e?.message ?? "Failed" }));
      setDevice(id, { connected: false, lastCheckedAt: Date.now() });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>WLED Settings</CardTitle>
        <CardDescription>
          Set the 3 WLED base URLs. “Test” uses your Next.js proxy: <code>/api/wled/state</code>.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {ids.map((id, idx) => {
          const d = devices[id];
          const status = testStatus[id];

          return (
            <div key={id} className="space-y-3">
              {idx > 0 && <Separator />}

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="font-medium">{d.name}</div>
                  {d.connected ? <Badge>Connected</Badge> : <Badge variant="outline">Not connected</Badge>}
                  {status === "testing" ? <Badge variant="secondary">Testing…</Badge> : null}
                  {status === "ok" ? <Badge>OK</Badge> : null}
                  {status === "fail" ? <Badge variant="destructive">Failed</Badge> : null}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDevice(id, { connected: false });
                      setTestStatus((p) => ({ ...p, [id]: "idle" }));
                      setTestError((p) => ({ ...p, [id]: null }));
                    }}
                  >
                    Disconnect
                  </Button>
                  <Button size="sm" onClick={() => runTest(id)} disabled={!d.baseUrl || status === "testing"}>
                    Test
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor={`${id}-name`}>Name</Label>
                  <Input
                    id={`${id}-name`}
                    value={d.name}
                    onChange={(e) => setDevice(id, { name: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor={`${id}-url`}>Base URL</Label>
                  <Input
                    id={`${id}-url`}
                    placeholder="http://192.168.1.50"
                    value={d.baseUrl}
                    onChange={(e) => setDevice(id, { baseUrl: e.target.value, connected: false })}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    inputMode="url"
                  />
                </div>
              </div>

              {testError[id] ? (
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
                  <div className="font-medium text-destructive">Test failed</div>
                  <div className="mt-1 text-muted-foreground">{testError[id]}</div>
                </div>
              ) : null}

              {d.lastCheckedAt ? (
                <div className="text-xs text-muted-foreground">
                  Last checked: {new Date(d.lastCheckedAt).toLocaleString()}
                </div>
              ) : null}
            </div>
          );
        })}
      </CardContent>

      <CardFooter className="justify-end gap-2">
        <Button variant="outline" onClick={reset}>
          Reset defaults
        </Button>
      </CardFooter>
    </Card>
  );
}

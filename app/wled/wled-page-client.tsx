"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { WledDeviceController } from "@/components/wled/wled-device-controller";
import { useWledDevices } from "@/components/wled/wled-devices-provider";
import { WledSettingsModal } from "@/components/wled/wled-settings-modal";

export default function WledPageClient() {
  const { devices } = useWledDevices();
  const list = [devices.esp1, devices.esp2, devices.esp3];

  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const searchParams = useSearchParams();

  React.useEffect(() => {
    if (searchParams.get("settings") === "1") setSettingsOpen(true);
  }, [searchParams]);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Ambient Lights</h1>
          <p className="text-muted-foreground">
            Control each WLED instance. Open Settings to connect devices.
          </p>
        </div>

        <Button variant="outline" onClick={() => setSettingsOpen(true)}>
          Settings
        </Button>
      </div>

      <WledSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />

      <div className="grid gap-4 md:grid-cols-3">
        {list.map((d) => (
          <WledDeviceController
            key={d.id}
            title={d.name}
            baseUrl={d.baseUrl}
            connected={d.connected}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        ))}
      </div>
    </div>
  );
}

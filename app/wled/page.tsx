"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { WledDeviceController } from "@/components/wled/wled-device-controller";
import { useWledDevices } from "@/components/wled/wled-devices-provider";
import { WledSettingsModal } from "@/components/wled/wled-settings-modal";
import { Home } from "lucide-react";

export default function WledControlPage() {
  const { devices } = useWledDevices();
  const list = [devices.esp1, devices.esp2, devices.esp3];

  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const searchParams = useSearchParams();

  React.useEffect(() => {
    // If navigated with /wled?settings=1 open modal on load
    if (searchParams.get("settings") === "1") setSettingsOpen(true);
  }, [searchParams]);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Ambient Lights</h1>
        </div>

            <Button asChild variant="outline" size="lg" className="gap-2">
      <Link href="/">
        <Home className="h-5 w-5" />
        Home
      </Link>
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

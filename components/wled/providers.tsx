"use client";

import * as React from "react";
import { WledDevicesProvider } from "@/components/wled/wled-devices-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <WledDevicesProvider>{children}</WledDevicesProvider>;
}

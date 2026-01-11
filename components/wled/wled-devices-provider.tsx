"use client";

import * as React from "react";

export type WledDeviceId = "esp1" | "esp2" | "esp3";

export type WledDeviceConfig = {
  id: WledDeviceId;
  name: string;
  baseUrl: string; // e.g. http://192.168.1.50
  connected: boolean;
  lastCheckedAt?: number; // ms epoch
};

type WledDevicesState = {
  devices: Record<WledDeviceId, WledDeviceConfig>;
  setDevice: (id: WledDeviceId, patch: Partial<WledDeviceConfig>) => void;
  reset: () => void;
};

const STORAGE_KEY = "wled:devices:v1";

function normalizeBaseUrl(value: string) {
  let v = value.trim();
  if (!v) return "";
  if (!/^https?:\/\//i.test(v)) v = `http://${v}`;
  return v.replace(/\/+$/, "");
}

const DEFAULTS: Record<WledDeviceId, WledDeviceConfig> = {
  esp1: { id: "esp1", name: "Driver Door", baseUrl: "http://192.168.1.50", connected: false },
  esp2: { id: "esp2", name: "Front Dashboard", baseUrl: "http://192.168.1.51", connected: false },
  esp3: { id: "esp3", name: "Passenger Door", baseUrl: "http://192.168.1.52", connected: false },
};

const WledDevicesContext = React.createContext<WledDevicesState | null>(null);

export function WledDevicesProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = React.useState<Record<WledDeviceId, WledDeviceConfig>>(DEFAULTS);

  // Load from localStorage
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<Record<WledDeviceId, WledDeviceConfig>>;

      setDevices((prev) => {
        const next = { ...prev };
        (Object.keys(DEFAULTS) as WledDeviceId[]).forEach((id) => {
          const incoming = parsed?.[id];
          if (incoming) {
            next[id] = {
              ...prev[id],
              ...incoming,
              baseUrl: normalizeBaseUrl(incoming.baseUrl ?? prev[id].baseUrl),
              id,
            };
          }
        });
        return next;
      });
    } catch {
      // ignore
    }
  }, []);

  // Persist to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(devices));
    } catch {
      // ignore
    }
  }, [devices]);

  const setDevice = React.useCallback((id: WledDeviceId, patch: Partial<WledDeviceConfig>) => {
    setDevices((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...patch,
        baseUrl:
          patch.baseUrl !== undefined ? normalizeBaseUrl(patch.baseUrl) : prev[id].baseUrl,
      },
    }));
  }, []);

  const reset = React.useCallback(() => setDevices(DEFAULTS), []);

  const value = React.useMemo(() => ({ devices, setDevice, reset }), [devices, setDevice, reset]);

  return <WledDevicesContext.Provider value={value}>{children}</WledDevicesContext.Provider>;
}

export function useWledDevices() {
  const ctx = React.useContext(WledDevicesContext);
  if (!ctx) throw new Error("useWledDevices must be used within WledDevicesProvider");
  return ctx;
}

export function useWledDevice(id: WledDeviceId) {
  const { devices, setDevice } = useWledDevices();
  return { device: devices[id], setDevice: (patch: Partial<WledDeviceConfig>) => setDevice(id, patch) };
}

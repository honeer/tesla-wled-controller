"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { WledSettingsPanel } from "@/components/wled/wled-settings-panel";

type WledSettingsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function WledSettingsModal({ open, onOpenChange }: WledSettingsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>WLED Settings</DialogTitle>
          <DialogDescription>Configure the three ESP modules. Changes save automatically.</DialogDescription>
        </DialogHeader>

        <div className="p-6 pt-4">
          <WledSettingsPanel />
        </div>
      </DialogContent>
    </Dialog>
  );
}

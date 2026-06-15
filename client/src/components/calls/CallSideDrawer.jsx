import React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "../ui/drawer";
import CallSidePanel from "./CallSidePanel";

export default function CallSideDrawer({
  open,
  onOpenChange,
  activeTab,
  onTabChange,
  messageCount = 0,
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[84vh] rounded-t-2xl border-surface-border bg-surface-page office-panel office-sheet-content">
        <DrawerHeader className="office-panel-header border-surface-border/60 bg-surface-card pb-2">
          <DrawerTitle className="font-heading text-text-heading">
            {activeTab === "messages" ? "Messages" : "Participants"}
          </DrawerTitle>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-hidden rounded-t-2xl bg-surface-card md:hidden">
          <CallSidePanel
            activeTab={activeTab}
            onTabChange={onTabChange}
            messageCount={messageCount}
            className="!flex h-full w-full"
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

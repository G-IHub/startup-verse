import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { callShell } from "./callStyles";
import CallParticipantsPanel from "./CallParticipantsPanel";
import CallChatPanel from "./CallChatPanel";

export default function CallSidePanel({
  activeTab = "participants",
  onTabChange,
  messageCount = 0,
  className = "",
}) {
  return (
    <aside
      className={`${callShell.sidePanel} ${className}`.trim()}
      aria-label="Call side panel"
    >
      <Tabs
        value={activeTab}
        onValueChange={onTabChange}
        className="flex h-full min-h-0 flex-col gap-0"
      >
        <div className={callShell.sidePanelHeader}>
          <TabsList className="h-10 w-full justify-start gap-4 bg-transparent p-0">
            <TabsTrigger
              value="participants"
              className="rounded-none border-b-2 border-transparent px-1 pb-2 font-body text-sm text-text-muted data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-medium data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Participants
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              className="rounded-none border-b-2 border-transparent px-1 pb-2 font-body text-sm text-text-muted data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-medium data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Messages{messageCount > 0 ? ` (${messageCount})` : ""}
            </TabsTrigger>
          </TabsList>
        </div>
        <div className={callShell.sidePanelBody}>
          <TabsContent value="participants" className="mt-0 h-full data-[state=inactive]:hidden">
            <CallParticipantsPanel />
          </TabsContent>
          <TabsContent value="messages" className="mt-0 h-full data-[state=inactive]:hidden">
            <CallChatPanel />
          </TabsContent>
        </div>
      </Tabs>
    </aside>
  );
}

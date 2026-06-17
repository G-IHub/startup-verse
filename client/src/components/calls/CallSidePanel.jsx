import React from "react";
import { ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { callShell } from "./callStyles";
import CallParticipantsPanel from "./CallParticipantsPanel";
import CallChatPanel from "./CallChatPanel";

export default function CallSidePanel({
  id,
  activeTab = "participants",
  onTabChange,
  messageCount = 0,
  onCollapse,
  className = "",
}) {
  return (
    <aside
      id={id}
      className={`${callShell.sidePanel} ${className}`.trim()}
      aria-label="Call side panel"
    >
      <Tabs
        value={activeTab}
        onValueChange={onTabChange}
        className="flex h-full min-h-0 flex-col gap-0"
      >
        <div className={callShell.sidePanelHeader}>
          <div className="flex items-center gap-2">
            <TabsList className="h-10 min-w-0 flex-1 justify-start gap-4 bg-transparent p-0">
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
            {onCollapse ? (
              <button
                type="button"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-surface-border bg-surface-page text-text-muted transition-colors hover:border-primary/30 hover:bg-primary-tint hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                onClick={onCollapse}
                aria-label="Collapse panel"
                title="Collapse panel"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
          </div>
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

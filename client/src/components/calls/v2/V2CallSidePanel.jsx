import React from "react";
import { ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { v2CallShell } from "./v2CallStyles";
import V2CallParticipantsPanel from "./V2CallParticipantsPanel";
import V2CallChatPanel from "./V2CallChatPanel";

export default function V2CallSidePanel({
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
      className={`${v2CallShell.sidePanel} ${className}`.trim()}
      aria-label="Call side panel"
    >
      <Tabs
        value={activeTab}
        onValueChange={onTabChange}
        className="flex h-full min-h-0 flex-col gap-0"
      >
        <div className={v2CallShell.sidePanelHeader}>
          <div className="flex items-center gap-2">
            <TabsList className="h-10 min-w-0 flex-1 justify-start gap-4 bg-transparent p-0">
              <TabsTrigger
                value="participants"
                className="rounded-none border-b-2 border-transparent px-1 pb-2 font-body text-sm text-v2-muted data-[state=active]:border-v2-blue data-[state=active]:bg-transparent data-[state=active]:font-medium data-[state=active]:text-v2-blue-dark data-[state=active]:shadow-none"
              >
                Participants
              </TabsTrigger>
              <TabsTrigger
                value="messages"
                className="rounded-none border-b-2 border-transparent px-1 pb-2 font-body text-sm text-v2-muted data-[state=active]:border-v2-blue data-[state=active]:bg-transparent data-[state=active]:font-medium data-[state=active]:text-v2-blue-dark data-[state=active]:shadow-none"
              >
                Messages{messageCount > 0 ? ` (${messageCount})` : ""}
              </TabsTrigger>
            </TabsList>
            {onCollapse ? (
              <button
                type="button"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-v2-border bg-v2-page text-v2-muted transition-colors hover:border-v2-blue/30 hover:bg-v2-blue-tint hover:text-v2-blue-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v2-blue/35"
                onClick={onCollapse}
                aria-label="Collapse panel"
                title="Collapse panel"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
          </div>
        </div>
        <div className={v2CallShell.sidePanelBody}>
          <TabsContent value="participants" className="mt-0 h-full data-[state=inactive]:hidden">
            <V2CallParticipantsPanel />
          </TabsContent>
          <TabsContent value="messages" className="mt-0 h-full data-[state=inactive]:hidden">
            <V2CallChatPanel />
          </TabsContent>
        </div>
      </Tabs>
    </aside>
  );
}

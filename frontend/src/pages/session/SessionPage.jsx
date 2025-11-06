import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useState } from "react";
import ProblemPanel from "@/components/collab/ProblemPanel";
import CodeEditorPanel from "@/components/collab/CodeEditorPanel";
import ChatPanel from "@/components/collab/ChatPanel";
import MainLayout from "@/layout/MainLayout";
import LeaveSessionDialog from "@/components/collab/LeaveSessionDialog";
import { useSession } from "@/hooks/useSession";
import AIPanel from "@/components/collab/AIPanel";

export default function SessionPage() {
  // Pull the currently selected problem (resolved from session.questionId) via the hook
  const { problem } = useSession();
  const [displayAIPanel, setDisplayAIPanel] = useState(false);

  return (
    <MainLayout>
      <div className="h-screen w-full overflow-hidden flex flex-col">
        {/* Header with Leave Button */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
          <h1 className="text-lg font-semibold">Collaborative Session</h1>
          <LeaveSessionDialog />
        </div>

        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            {/* Problem Panel */}
            <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
              {/* ProblemPanel uses useSession() internally; no prop required */}
              <ProblemPanel />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Code Editor Panel */}
            <ResizablePanel defaultSize={50} minSize={30}>
              {/* Pass problem so the editor can load the correct starter code when not in collab,
                  and seed the session if the server code is a placeholder */}
              <CodeEditorPanel
                problem={problem ?? undefined}
                setDisplayAIPanel={setDisplayAIPanel}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Chat Panel */}
            <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
              {displayAIPanel ? (
                <AIPanel setDisplayAIPanel={setDisplayAIPanel} />
              ) : (
                <ChatPanel />
              )}
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </MainLayout>
  );
}

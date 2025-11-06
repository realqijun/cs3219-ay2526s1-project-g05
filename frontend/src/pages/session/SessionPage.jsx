import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import ProblemPanel from "@/components/collab/ProblemPanel";
import CodeEditorPanel from "@/components/collab/CodeEditorPanel";
import ChatPanel from "@/components/collab/ChatPanel";
import MainLayout from "@/layout/MainLayout";
import LeaveSessionDialog from "@/components/collab/LeaveSessionDialog";
import SessionEndRequestDialog from "@/components/collab/SessionEndRequestDialog";
import { useSessionEnd } from "@/hooks/useSessionEnd";
import { useSession } from "@/hooks/useSession";

export default function SessionPage() {
  const {
    requestRejected,
    lastRequestTime,
    incomingRequest,
    sendEndRequest,
    acceptEndRequest,
    rejectEndRequest,
  } = useSessionEnd();

  // Pull the currently selected problem (resolved from session.questionId) via the hook
  const { problem } = useSession();

  return (
    <MainLayout>
      <div className="h-screen w-full overflow-hidden flex flex-col">
        {/* Header with Leave Button */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
          <h1 className="text-lg font-semibold">Collaborative Session</h1>
          <LeaveSessionDialog
            onRequestEnd={sendEndRequest}
            lastRequestTime={lastRequestTime}
            requestRejected={requestRejected}
          />
        </div>

        {/* Session End Request Dialog for Receiver */}
        <SessionEndRequestDialog
          open={incomingRequest}
          onAccept={acceptEndRequest}
          onReject={rejectEndRequest}
          partnerName="John Doe"
        />

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
              <CodeEditorPanel problem={problem ?? undefined} />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Chat Panel */}
            <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
              <ChatPanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </MainLayout>
  );
}

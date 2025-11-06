import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { useCollaborationSession } from "@/context/CollaborationSessionContext";
import { useEffect } from "react";
import { collaborationApi } from "@/lib/collaborationApi";

export default function AIPanel({ setDisplayAIPanel }) {
  const [loading, setLoading] = useState(false);

  const handleExplainCode = async () => {
    setLoading(true);
    await collaborationApi.explainCode();
    setLoading(false);
  };
  useEffect(() => {
    handleExplainCode();
  }, []);

  return (
    <Card className="h-full flex flex-col border-0 rounded-none shadow-none">
      <CardHeader className="border-b">
        <div className="w-full flex justify-between items-center">
          <span className="text-xl font-semibold tracking-wider">
            AI Explanation
          </span>
          <Button
            onClick={() => {
              setDisplayAIPanel(false);
              setLoading(false);
            }}
          >
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          {true ? (
            <div className="flex flex-col items-center">
              <h1 className="text-xl tracking-wider">Explaining Code...</h1>
              <Loader2 className="w-12 h-12 mt-4 text-primary animate-spin" />
            </div>
          ) : (
            <></>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

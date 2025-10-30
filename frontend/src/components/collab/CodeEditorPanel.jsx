import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play } from "lucide-react";
import { EditorView, keymap, highlightActiveLine, lineNumbers, highlightActiveLineGutter } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from "@codemirror/language";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { toast } from "sonner";
import { useCollaborationSession } from "@/context/CollaborationSessionContext";

const languageExtensions = {
  javascript: javascript(),
  python: python(),
};

const defaultCode = {
  javascript: `function twoSum(nums, target) {
  // Write your solution here
  
}`,
  python: `def two_sum(nums, target):
    # Write your solution here
    pass`
};

export default function CodeEditorPanel() {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const applyingRemoteRef = useRef(false);
  const sendOperationRef = useRef(null);
  const sendCursorRef = useRef(null);
  const fetchSnapshotRef = useRef(null);
  const connectedRef = useRef(false);
  const isJoiningRef = useRef(false);
  const sessionIdRef = useRef(null);
  const versionRef = useRef(0);
  const lastCursorRef = useRef(null);
  const [language, setLanguage] = useState("javascript");

  const {
    session,
    code,
    version,
    connected,
    isJoining,
    sendOperation,
    sendCursor,
    fetchSessionSnapshot,
  } = useCollaborationSession();

  useEffect(() => {
    sendOperationRef.current = sendOperation;
  }, [sendOperation]);

  useEffect(() => {
    sendCursorRef.current = sendCursor;
  }, [sendCursor]);

  useEffect(() => {
    fetchSnapshotRef.current = fetchSessionSnapshot;
  }, [fetchSessionSnapshot]);

  useEffect(() => {
    connectedRef.current = connected;
  }, [connected]);

  useEffect(() => {
    isJoiningRef.current = isJoining;
  }, [isJoining]);

  useEffect(() => {
    sessionIdRef.current = session?.id ?? null;
  }, [session?.id]);

  useEffect(() => {
    versionRef.current = version ?? 0;
  }, [version]);

  useEffect(() => {
    if (!session?.language) return;
    setLanguage((prev) => (prev === session.language ? prev : session.language));
  }, [session?.language]);

  const effectiveLanguage = useMemo(() => {
    return languageExtensions[language] ? language : "javascript";
  }, [language]);

  const getChangeRange = useCallback((changes) => {
    let start = null;
    let endExclusive = null;
    changes.iterChanges((from, to) => {
      start = start === null ? from : Math.min(start, from);
      endExclusive = endExclusive === null ? to : Math.max(endExclusive, to);
    });
    if (start === null) return null;
    return { start, endExclusive };
  }, []);

  const applyRemoteCode = useCallback((nextCode) => {
    if (!viewRef.current || typeof nextCode !== "string") return;
    const editor = viewRef.current;
    const current = editor.state.doc.toString();
    if (current === nextCode) return;

    applyingRemoteRef.current = true;
    editor.dispatch({
      changes: { from: 0, to: current.length, insert: nextCode },
    });
    applyingRemoteRef.current = false;
  }, []);

  const handleEditorUpdate = useCallback(
    (update) => {
      if (
        !sessionIdRef.current ||
        !connectedRef.current ||
        isJoiningRef.current ||
        !sendOperationRef.current
      ) {
        return;
      }

      if (update.docChanged) {
        if (applyingRemoteRef.current) {
          return;
        }

        const nextDoc = update.state.doc.toString();
        const changeRange = getChangeRange(update.changes);
        const normalizedRange = changeRange
          ? {
              start: changeRange.start,
              end:
                changeRange.endExclusive <= changeRange.start
                  ? changeRange.start
                  : changeRange.endExclusive - 1,
            }
          : undefined;

        sendOperationRef.current({
          type: "replace",
          content: nextDoc,
          range: normalizedRange,
          version: versionRef.current,
        }).catch((error) => {
          console.error("Failed to sync code change:", error);
          toast.error(error.message ?? "Failed to sync change.");
          if (sessionIdRef.current) {
            fetchSnapshotRef.current?.(sessionIdRef.current);
          }
        });
      }

      if (update.selectionSet && sendCursorRef.current) {
        const main = update.state.selection.main;
        if (!main) return;

        const pos = main.head;
        const lineInfo = update.state.doc.lineAt(pos);
        const cursorPosition = {
          line: Math.max(0, lineInfo.number - 1),
          column: Math.max(0, pos - lineInfo.from),
        };

        const last = lastCursorRef.current;
        if (
          !last ||
          last.line !== cursorPosition.line ||
          last.column !== cursorPosition.column
        ) {
          lastCursorRef.current = cursorPosition;
          sendCursorRef.current({
            cursor: cursorPosition,
            version: versionRef.current,
          }).catch(() => {
            /* ignore cursor sync errors */
          });
        }
      }
    },
    [getChangeRange],
  );

  useEffect(() => {
    if (!editorRef.current) return;

    const initialDoc =
      session?.id != null ? "" : defaultCode[effectiveLanguage] ?? "";

    const state = EditorState.create({
      doc: initialDoc,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        highlightSelectionMatches(),
        syntaxHighlighting(defaultHighlightStyle),
        keymap.of([
          indentWithTab,
          ...defaultKeymap,
          ...historyKeymap,
          ...searchKeymap,
          ...completionKeymap,
          ...closeBracketsKeymap
        ]),
        languageExtensions[effectiveLanguage],
        EditorView.updateListener.of(handleEditorUpdate),
        EditorView.theme({
          "&": {
            height: "100%",
            fontSize: "14px"
          },
          ".cm-scroller": {
            overflow: "auto",
            fontFamily: "'Fira Code', 'Monaco', 'Courier New', monospace"
          }
        })
      ]
    });

    viewRef.current = new EditorView({
      state,
      parent: editorRef.current
    });

    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, [effectiveLanguage, handleEditorUpdate, session?.id]);

  useEffect(() => {
    if (!viewRef.current) return;
    if (session?.id != null) {
      applyRemoteCode(typeof code === "string" ? code : "");
    }
  }, [code, session?.id, applyRemoteCode]);

  const handleRun = () => {
    const code = viewRef.current?.state.doc.toString() || "";
    console.log("Running code:", code);
    // TODO: Implement code execution
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
  };

  const connectionLabel = useMemo(() => {
    if (!session?.id) return "Waiting for session";
    if (isJoining) return "Joining session...";
    return connected ? "Live" : "Reconnecting...";
  }, [session?.id, connected, isJoining]);

  return (
    <Card className="h-full flex flex-col border-0 rounded-none shadow-none">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <CardTitle className="text-xl">Code Editor</CardTitle>
            <span className="text-xs text-muted-foreground">{connectionLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleRun} size="sm">
              <Play className="w-4 h-4 mr-2" />
              Run
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <div ref={editorRef} className="h-full w-full" />
      </CardContent>
    </Card>
  );
}

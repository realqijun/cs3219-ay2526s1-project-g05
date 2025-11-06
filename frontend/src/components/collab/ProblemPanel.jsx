import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSession } from "@/hooks/useSession";

function badgeVariantForDifficulty(diff) {
  const d = (diff || "").toLowerCase();
  if (d === "easy") return "secondary";
  if (d === "medium") return "default";
  if (d === "hard") return "destructive";
  return "outline";
}

function renderCodeish(val) {
  if (val == null) return null;
  const text = typeof val === "string" ? val : JSON.stringify(val, null, 2);
  return (
    <code className="text-sm whitespace-pre-wrap break-words">{text}</code>
  );
}

export default function ProblemPanel() {
  const { problem } = useSession();

  if (!problem) {
    return (
      <Card className="h-full flex flex-col border-0 rounded-none shadow-none">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">No problem selected</CardTitle>
            <Badge variant="outline">—</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-6 text-sm text-muted-foreground">
          Choose a question to see its details here.
        </CardContent>
      </Card>
    );
  }

  const {
    title = "Untitled Problem",
    difficulty = "Unknown",
    topics = [],
    descriptionHtml,
    descriptionText = "",
    examples = [],
    constraints = [],
    hints = [],
    codeBlock,
  } = problem;

  const renderDescription = () => {
    if (descriptionHtml) {
      return (
        <div
          className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: descriptionHtml /* safe */ }}
        />
      );
    }
    if (descriptionText) {
      return (
        <p className="text-muted-foreground leading-relaxed">
          {descriptionText}
        </p>
      );
    }
    return (
      <p className="text-muted-foreground italic">No description provided.</p>
    );
  };

  return (
    <Card className="h-full flex flex-col border-0 rounded-none shadow-none">
      <CardHeader className="border-b !h-20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{title}</CardTitle>
          <Badge
            variant={badgeVariantForDifficulty(difficulty)}
            className="ml-2"
          >
            {difficulty}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden !p-2">
        <ScrollArea className="h-full">
          <div className="p-3 space-y-6">
            {/* Topics */}
            {Array.isArray(topics) && topics.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {topics.map((t) => (
                  <Badge key={t} variant="outline">
                    {t}
                  </Badge>
                ))}
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              {renderDescription()}
            </div>

            {/* Examples */}
            {Array.isArray(examples) && examples.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Examples</h3>
                <div className="space-y-4">
                  {examples.map((ex, idx) => (
                    <div
                      key={idx}
                      className="bg-secondary/50 rounded-lg p-4 space-y-2"
                    >
                      {"input" in ex && (
                        <div>
                          <span className="text-sm font-medium">Input: </span>
                          {renderCodeish(ex.input)}
                        </div>
                      )}
                      {"output" in ex && (
                        <div>
                          <span className="text-sm font-medium">Output: </span>
                          {renderCodeish(ex.output)}
                        </div>
                      )}
                      {ex.explanation && (
                        <div>
                          <span className="text-sm font-medium">
                            Explanation:{" "}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {ex.explanation}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Constraints */}
            {Array.isArray(constraints) && constraints.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Constraints</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {constraints.map((c, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-2">•</span>
                      <code className="flex-1 whitespace-pre-wrap break-words">
                        {typeof c === "string" ? c : JSON.stringify(c)}
                      </code>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Hints (HTML array) */}
            {Array.isArray(hints) && hints.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Hints</h3>
                <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                  {hints.map((h, i) => (
                    <li key={i} dangerouslySetInnerHTML={{ __html: h }} />
                    // if sanitizing: dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(h) }}
                  ))}
                </ul>
              </div>
            )}

            {/* Optional: single code block if present */}
            {codeBlock && (
              <div>
                <h3 className="font-semibold mb-2">Starter Code</h3>
                <pre className="bg-muted/50 p-3 rounded overflow-auto text-sm">
                  {codeBlock}
                </pre>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

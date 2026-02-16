import { Copy, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface CodeViewerProps {
  code: string;
  title: string;
  filename?: string;
  showLineNumbers?: boolean;
  highlightedLines?: number[];
}

export function CodeViewer({
  code,
  title,
  filename,
  showLineNumbers = true,
  highlightedLines = [],
}: CodeViewerProps) {
  const [copied, setCopied] = useState(false);
  const lines = code.split("\n");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "skill-code.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-2 bg-muted/50 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleCopy} data-testid={`button-copy-${title.toLowerCase().replace(/\s/g, "-")}`}>
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDownload} data-testid={`button-download-${title.toLowerCase().replace(/\s/g, "-")}`}>
            <Download className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      <div className="overflow-auto max-h-[500px] bg-background dark:bg-background/40">
        <pre className="text-xs leading-relaxed">
          <code>
            {lines.map((line, i) => {
              const lineNum = i + 1;
              const isHighlighted = highlightedLines.includes(lineNum);
              return (
                <div
                  key={i}
                  className={`flex ${isHighlighted ? "bg-red-500/10 dark:bg-red-500/15" : ""}`}
                >
                  {showLineNumbers && (
                    <span className="inline-block w-12 shrink-0 text-right pr-4 select-none text-muted-foreground/50 font-mono">
                      {lineNum}
                    </span>
                  )}
                  <span className="font-mono flex-1 px-4 py-[1px] whitespace-pre">{line}</span>
                </div>
              );
            })}
          </code>
        </pre>
      </div>
    </div>
  );
}

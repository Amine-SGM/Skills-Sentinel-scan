import { useState } from "react";
import { Shield, Scan, Loader2, ExternalLink, ArrowRight, ShieldCheck, ShieldX, FileCode2, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SecurityScore } from "@/components/security-score";
import { VulnerabilityList } from "@/components/vulnerability-list";
import { CodeViewer } from "@/components/code-viewer";
import { SettingsDialog } from "@/components/settings-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { getGeminiKey, getOpenRouterKey, hasApiKeys } from "@/lib/api-keys";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ScanResult } from "@shared/schema";

export default function Home() {
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanPhase, setScanPhase] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const { toast } = useToast();

  const handleScan = async () => {
    if (!url.trim()) {
      toast({ title: "Enter a URL", description: "Please paste a skill link to scan.", variant: "destructive" });
      return;
    }

    if (!hasApiKeys()) {
      toast({ title: "API keys required", description: "Please configure your API keys in Settings first.", variant: "destructive" });
      return;
    }

    setScanning(true);
    setResult(null);
    setScanPhase("Fetching skill code...");

    try {
      setScanPhase("Analyzing with Gemini & OpenRouter...");
      const response = await apiRequest("POST", "/api/scan", {
        skillUrl: url.trim(),
        geminiApiKey: getGeminiKey(),
        openrouterApiKey: getOpenRouterKey(),
      });
      const data = await response.json();
      setResult(data);
      setScanPhase("");
    } catch (error: any) {
      toast({
        title: "Scan failed",
        description: error.message || "Something went wrong during the scan.",
        variant: "destructive",
      });
      setScanPhase("");
    } finally {
      setScanning(false);
    }
  };

  const affectedLines = result?.vulnerabilities
    .flatMap((v) => v.lineNumbers || [])
    .filter((v, i, arr) => arr.indexOf(v) === i) || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-semibold text-lg tracking-tight">SkillGuard</span>
          </div>
          <div className="flex items-center gap-1">
            <SettingsDialog />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {!result && !scanning && (
          <div className="text-center space-y-4 py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">AI Skill Security Scanner</h1>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
              Analyze AI agent skills for malicious code, vulnerabilities, and security threats before deployment.
              Powered by dual-model analysis using Gemini and OpenRouter.
            </p>
            <div className="flex items-center justify-center gap-6 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Scan className="w-3.5 h-3.5" />
                <span>Deep Analysis</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Auto-Fix</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Dual AI Models</span>
              </div>
            </div>
          </div>
        )}

        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste skill link (GitHub raw URL, Gist, or any code URL)..."
                  className="pl-9 font-mono text-xs"
                  disabled={scanning}
                  onKeyDown={(e) => e.key === "Enter" && handleScan()}
                  data-testid="input-skill-url"
                />
              </div>
              <Button onClick={handleScan} disabled={scanning} data-testid="button-scan">
                {scanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scanning
                  </>
                ) : (
                  <>
                    <Scan className="w-4 h-4" />
                    Scan
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {scanning && (
          <Card>
            <CardContent className="p-8 flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-primary/20 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-medium text-sm">{scanPhase}</p>
                <p className="text-xs text-muted-foreground mt-1">This may take a moment — two AI models are reviewing the code</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-[10px]">Gemini</Badge>
                <Badge variant="secondary" className="text-[10px]">OpenRouter</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {result && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="md:col-span-1">
                <CardContent className="p-6 flex flex-col items-center gap-4">
                  <SecurityScore score={result.securityScore} size="lg" />
                  <div className="flex items-center gap-2">
                    {result.isSecure ? (
                      <Badge className="bg-emerald-500 dark:bg-emerald-600 text-white no-default-hover-elevate">
                        <ShieldCheck className="w-3 h-3 mr-1" /> Passed
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500 dark:bg-red-600 text-white no-default-hover-elevate">
                        <ShieldX className="w-3 h-3 mr-1" /> Issues Found
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0">
                      <CardTitle className="text-lg truncate" data-testid="text-skill-name">{result.skillName}</CardTitle>
                      <CardDescription className="truncate font-mono text-xs mt-1">{result.skillUrl}</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {new Date(result.scanDate).toLocaleString()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm leading-relaxed" data-testid="text-summary">{result.summary}</p>

                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="text-center p-2 rounded-md bg-muted/50">
                      <p className="text-lg font-bold" data-testid="text-total-issues">{result.vulnerabilities.length}</p>
                      <p className="text-[10px] text-muted-foreground">Total Issues</p>
                    </div>
                    <div className="text-center p-2 rounded-md bg-muted/50">
                      <p className="text-lg font-bold text-red-500 dark:text-red-400" data-testid="text-critical-count">
                        {result.vulnerabilities.filter((v) => v.severity === "critical" || v.severity === "high").length}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Critical/High</p>
                    </div>
                    <div className="text-center p-2 rounded-md bg-muted/50">
                      <p className="text-lg font-bold" data-testid="text-code-lines">{result.originalCode.split("\n").length}</p>
                      <p className="text-[10px] text-muted-foreground">Lines of Code</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {result.vulnerabilities.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShieldX className="w-5 h-5 text-destructive" />
                    Vulnerabilities
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <VulnerabilityList vulnerabilities={result.vulnerabilities} />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileCode2 className="w-5 h-5 text-muted-foreground" />
                  Code Review
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Tabs defaultValue={result.securedCode ? "secured" : "original"}>
                  <TabsList className="mb-3">
                    <TabsTrigger value="original" data-testid="tab-original">
                      Original Code
                    </TabsTrigger>
                    {result.securedCode && (
                      <TabsTrigger value="secured" data-testid="tab-secured">
                        <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                        Secured Code
                      </TabsTrigger>
                    )}
                  </TabsList>
                  <TabsContent value="original">
                    <CodeViewer
                      code={result.originalCode}
                      title="Original Skill Code"
                      filename={`${result.skillName}-original.txt`}
                      highlightedLines={affectedLines}
                    />
                  </TabsContent>
                  {result.securedCode && (
                    <TabsContent value="secured">
                      <CodeViewer
                        code={result.securedCode}
                        title="Secured Skill Code"
                        filename={`${result.skillName}-secured.txt`}
                      />
                      <div className="mt-3 flex items-center gap-2 p-3 rounded-md bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20">
                        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                          This version has been automatically remediated. All identified vulnerabilities have been addressed while preserving the skill's core functionality.
                        </p>
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-muted-foreground" />
                  AI Analysis Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Tabs defaultValue="gemini">
                  <TabsList className="mb-3">
                    <TabsTrigger value="gemini" data-testid="tab-gemini">Gemini Analysis</TabsTrigger>
                    <TabsTrigger value="openrouter" data-testid="tab-openrouter">OpenRouter Analysis</TabsTrigger>
                  </TabsList>
                  <TabsContent value="gemini">
                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap" data-testid="text-gemini-analysis">
                      {result.geminiAnalysis}
                    </div>
                  </TabsContent>
                  <TabsContent value="openrouter">
                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap" data-testid="text-openrouter-analysis">
                      {result.openrouterAnalysis}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <div className="flex justify-center pb-8">
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setUrl("");
                }}
                data-testid="button-new-scan"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Scan Another Skill
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

import { useState } from "react";
import { Settings, Eye, EyeOff, Check, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getGeminiKey, getOpenRouterKey, setGeminiKey, setOpenRouterKey } from "@/lib/api-keys";
import { useToast } from "@/hooks/use-toast";

export function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const [gemini, setGemini] = useState(getGeminiKey);
  const [openrouter, setOpenrouter] = useState(getOpenRouterKey);
  const [showGemini, setShowGemini] = useState(false);
  const [showOpenrouter, setShowOpenrouter] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    setGeminiKey(gemini);
    setOpenRouterKey(openrouter);
    toast({ title: "Settings saved", description: "Your API keys have been stored locally." });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" data-testid="button-settings">
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-muted-foreground" />
            API Configuration
          </DialogTitle>
          <DialogDescription>
            Enter your API keys to power the security analysis. Keys are stored locally in your browser.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="gemini-key">Google AI Studio (Gemini) API Key</Label>
            <div className="relative">
              <Input
                id="gemini-key"
                type={showGemini ? "text" : "password"}
                value={gemini}
                onChange={(e) => setGemini(e.target.value)}
                placeholder="AIza..."
                className="pr-10 font-mono text-xs"
                data-testid="input-gemini-key"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0"
                onClick={() => setShowGemini(!showGemini)}
                type="button"
                data-testid="button-toggle-gemini"
              >
                {showGemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Get yours at{" "}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="underline">
                aistudio.google.com
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="openrouter-key">OpenRouter API Key</Label>
            <div className="relative">
              <Input
                id="openrouter-key"
                type={showOpenrouter ? "text" : "password"}
                value={openrouter}
                onChange={(e) => setOpenrouter(e.target.value)}
                placeholder="sk-or-..."
                className="pr-10 font-mono text-xs"
                data-testid="input-openrouter-key"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0"
                onClick={() => setShowOpenrouter(!showOpenrouter)}
                type="button"
                data-testid="button-toggle-openrouter"
              >
                {showOpenrouter ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Get yours at{" "}
              <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline">
                openrouter.ai
              </a>
            </p>
          </div>

          <Button onClick={handleSave} className="w-full" data-testid="button-save-settings">
            <Check className="w-4 h-4 mr-2" />
            Save Keys
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { GoogleGenAI } from "@google/genai";
import type { Vulnerability, ScanResult } from "@shared/schema";
import { randomUUID } from "crypto";

const SECURITY_ANALYSIS_PROMPT = `You are an expert security analyst specializing in AI agent skills and code security. Analyze the following code for security vulnerabilities, malicious patterns, and potential threats.

Focus on these categories:
1. **Code Injection** - eval(), exec(), dynamic code execution, template injection
2. **Malicious Imports** - suspicious packages, typosquatted modules, known malware
3. **Data Exfiltration** - unauthorized network calls, data leaks, covert channels
4. **File System Abuse** - unauthorized file access, path traversal, destructive operations
5. **Privilege Escalation** - attempts to gain elevated permissions, shell execution
6. **Credential Theft** - accessing env vars, secrets, tokens without authorization
7. **Obfuscation** - base64 encoded payloads, encoded strings, hidden functionality
8. **Supply Chain Risks** - dependency confusion, unsafe package sources
9. **Unsafe Operations** - unbounded loops, resource exhaustion, denial of service

Respond with ONLY valid JSON in this exact format:
{
  "securityScore": <number 0-100, where 100 is perfectly secure>,
  "isSecure": <boolean, true if score >= 80>,
  "summary": "<brief 2-3 sentence summary of findings>",
  "vulnerabilities": [
    {
      "id": "<unique id>",
      "severity": "<critical|high|medium|low|info>",
      "category": "<category name>",
      "title": "<short title>",
      "description": "<detailed description>",
      "lineNumbers": [<affected line numbers>],
      "recommendation": "<how to fix>",
      "codeSnippet": "<relevant code snippet>"
    }
  ],
  "analysis": "<detailed analysis text explaining your findings>"
}

CODE TO ANALYZE:
`;

const SECURE_CODE_PROMPT = `You are an expert security engineer. Given the following code that has security vulnerabilities, create a SECURED version that:
1. Fixes all identified security vulnerabilities
2. Preserves the core functionality of the skill
3. Adds proper input validation and sanitization
4. Removes any malicious or dangerous code
5. Adds security comments explaining the changes made

Return ONLY the secured code, nothing else. No markdown formatting, no code blocks, just the raw code.

ORIGINAL CODE WITH VULNERABILITIES:
`;

const ALLOWED_HOSTS = [
  "github.com",
  "raw.githubusercontent.com",
  "gist.github.com",
  "gist.githubusercontent.com",
  "gitlab.com",
  "bitbucket.org",
  "pastebin.com",
  "hastebin.com",
  "dpaste.org",
  "replit.com",
];

function validateUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL format");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are supported");
  }

  const hostname = parsed.hostname.toLowerCase();
  const isAllowed = ALLOWED_HOSTS.some(
    (h) => hostname === h || hostname.endsWith("." + h),
  );

  if (!isAllowed) {
    throw new Error(
      `Host "${hostname}" is not in the allowed list. Supported hosts: ${ALLOWED_HOSTS.join(", ")}`,
    );
  }
}

async function fetchSkillCode(url: string): Promise<{ code: string; name: string }> {
  validateUrl(url);

  let fetchUrl = url;

  if (url.includes("github.com") && !url.includes("raw.githubusercontent.com")) {
    fetchUrl = url
      .replace("github.com", "raw.githubusercontent.com")
      .replace("/blob/", "/");
  }

  if (url.includes("gist.github.com") && !url.includes("gist.githubusercontent.com")) {
    fetchUrl = url.replace("gist.github.com", "gist.githubusercontent.com");
    if (!fetchUrl.includes("/raw")) {
      fetchUrl += "/raw";
    }
  }

  const response = await fetch(fetchUrl, {
    headers: { "User-Agent": "SkillGuard-Scanner/1.0" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch skill code: ${response.status} ${response.statusText}`);
  }

  const code = await response.text();

  let name = "Unknown Skill";
  try {
    const urlParts = new URL(url).pathname.split("/").filter(Boolean);
    name = urlParts[urlParts.length - 1] || "Unknown Skill";
    name = name.replace(/\.[^.]+$/, "");
  } catch {}

  return { code, name };
}

async function analyzeWithGemini(
  code: string,
  apiKey: string,
): Promise<{ analysis: string; vulnerabilities: Vulnerability[]; score: number; isSecure: boolean; summary: string }> {
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: SECURITY_ANALYSIS_PROMPT + code,
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response.text || "{}";
  
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("Failed to parse Gemini response as JSON");
    }
  }

  return {
    analysis: parsed.analysis || "Analysis completed.",
    vulnerabilities: (parsed.vulnerabilities || []).map((v: any, i: number) => ({
      id: v.id || `gemini-${i}`,
      severity: v.severity || "info",
      category: v.category || "General",
      title: v.title || "Finding",
      description: v.description || "",
      lineNumbers: v.lineNumbers || [],
      recommendation: v.recommendation || "",
      codeSnippet: v.codeSnippet || "",
    })),
    score: typeof parsed.securityScore === "number" ? parsed.securityScore : 50,
    isSecure: parsed.isSecure ?? false,
    summary: parsed.summary || "",
  };
}

async function analyzeWithOpenRouter(
  code: string,
  apiKey: string,
): Promise<{ analysis: string; vulnerabilities: Vulnerability[]; score: number; isSecure: boolean; summary: string }> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://skillguard.replit.app",
      "X-Title": "SkillGuard Security Scanner",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-maverick",
      messages: [
        {
          role: "system",
          content: "You are an expert security analyst. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: SECURITY_ANALYSIS_PROMPT + code,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "{}";
  
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("Failed to parse OpenRouter response as JSON");
    }
  }

  return {
    analysis: parsed.analysis || "Analysis completed.",
    vulnerabilities: (parsed.vulnerabilities || []).map((v: any, i: number) => ({
      id: v.id || `openrouter-${i}`,
      severity: v.severity || "info",
      category: v.category || "General",
      title: v.title || "Finding",
      description: v.description || "",
      lineNumbers: v.lineNumbers || [],
      recommendation: v.recommendation || "",
      codeSnippet: v.codeSnippet || "",
    })),
    score: typeof parsed.securityScore === "number" ? parsed.securityScore : 50,
    isSecure: parsed.isSecure ?? false,
    summary: parsed.summary || "",
  };
}

async function generateSecuredCode(
  code: string,
  apiKey: string,
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: SECURE_CODE_PROMPT + code,
  });

  return response.text || code;
}

function mergeVulnerabilities(geminiVulns: Vulnerability[], openrouterVulns: Vulnerability[]): Vulnerability[] {
  const merged: Vulnerability[] = [...geminiVulns];

  for (const orVuln of openrouterVulns) {
    const isDuplicate = geminiVulns.some(
      (gv) =>
        gv.title.toLowerCase() === orVuln.title.toLowerCase() ||
        (gv.category === orVuln.category && gv.severity === orVuln.severity &&
          gv.lineNumbers?.some((l) => orVuln.lineNumbers?.includes(l))),
    );

    if (!isDuplicate) {
      merged.push({ ...orVuln, id: `or-${orVuln.id}` });
    }
  }

  return merged;
}

export async function scanSkill(
  skillUrl: string,
  geminiApiKey: string,
  openrouterApiKey: string,
): Promise<ScanResult> {
  const { code, name } = await fetchSkillCode(skillUrl);

  const [geminiResult, openrouterResult] = await Promise.all([
    analyzeWithGemini(code, geminiApiKey),
    analyzeWithOpenRouter(code, openrouterApiKey),
  ]);

  const mergedVulns = mergeVulnerabilities(geminiResult.vulnerabilities, openrouterResult.vulnerabilities);
  const avgScore = Math.round((geminiResult.score + openrouterResult.score) / 2);
  const isSecure = avgScore >= 80;

  let securedCode: string | undefined;
  if (!isSecure && mergedVulns.length > 0) {
    try {
      securedCode = await generateSecuredCode(code, geminiApiKey);
    } catch (err) {
      console.error("Failed to generate secured code:", err);
    }
  }

  const summary = geminiResult.summary || openrouterResult.summary ||
    `Scanned ${code.split("\n").length} lines of code. Found ${mergedVulns.length} potential issues.`;

  return {
    id: randomUUID(),
    skillUrl,
    skillName: name,
    scanDate: new Date().toISOString(),
    isSecure,
    securityScore: avgScore,
    originalCode: code,
    securedCode,
    vulnerabilities: mergedVulns,
    geminiAnalysis: geminiResult.analysis,
    openrouterAnalysis: openrouterResult.analysis,
    summary,
  };
}

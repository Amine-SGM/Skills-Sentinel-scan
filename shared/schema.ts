import { z } from "zod";

export const severityEnum = z.enum(["critical", "high", "medium", "low", "info"]);
export type Severity = z.infer<typeof severityEnum>;

export const vulnerabilitySchema = z.object({
  id: z.string(),
  severity: severityEnum,
  category: z.string(),
  title: z.string(),
  description: z.string(),
  lineNumbers: z.array(z.number()).optional(),
  recommendation: z.string(),
  codeSnippet: z.string().optional(),
});
export type Vulnerability = z.infer<typeof vulnerabilitySchema>;

export const scanResultSchema = z.object({
  id: z.string(),
  skillUrl: z.string(),
  skillName: z.string(),
  scanDate: z.string(),
  isSecure: z.boolean(),
  securityScore: z.number().min(0).max(100),
  originalCode: z.string(),
  securedCode: z.string().optional(),
  vulnerabilities: z.array(vulnerabilitySchema),
  geminiAnalysis: z.string(),
  openrouterAnalysis: z.string(),
  summary: z.string(),
});
export type ScanResult = z.infer<typeof scanResultSchema>;

export const scanRequestSchema = z.object({
  skillUrl: z.string().url("Please enter a valid URL"),
  geminiApiKey: z.string().min(1, "Gemini API key is required"),
  openrouterApiKey: z.string().min(1, "OpenRouter API key is required"),
});
export type ScanRequest = z.infer<typeof scanRequestSchema>;

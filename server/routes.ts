import type { Express } from "express";
import { createServer, type Server } from "http";
import { scanRequestSchema } from "@shared/schema";
import { scanSkill } from "./scanner";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/scan", async (req, res) => {
    try {
      const parsed = scanRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid request",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const { skillUrl, geminiApiKey, openrouterApiKey } = parsed.data;
      const result = await scanSkill(skillUrl, geminiApiKey, openrouterApiKey);
      res.json(result);
    } catch (error: any) {
      console.error("Scan error:", error);
      res.status(500).json({
        error: error.message || "Failed to scan skill",
      });
    }
  });

  return httpServer;
}

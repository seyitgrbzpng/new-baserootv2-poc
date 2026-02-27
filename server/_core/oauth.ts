/**
 * Firebase Migration Note:
 * OAuth is now handled via Firebase Auth.
 * This file is kept for backward compatibility but routes are disabled.
 */

import type { Express, Request, Response } from "express";

export function registerOAuthRoutes(app: Express) {
  // OAuth routes disabled - using Firebase Auth instead
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    res.status(410).json({ 
      error: "OAuth callback deprecated. Please use Firebase Auth." 
    });
  });
}

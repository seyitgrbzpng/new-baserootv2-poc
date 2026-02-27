import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic } from "./vite";
import { webhookRouter } from "../webhook-router"; // ChainGPT PoC

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// Create Express app (exported for Vercel)
export const app = express();

// Configure body parser with larger size limit for file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// OAuth callback under /api/oauth/callback
registerOAuthRoutes(app);

// ChainGPT PoC — Webhook endpoint (Express, not tRPC)
app.use("/v1/events", webhookRouter);

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Serve static files in production
if (process.env.NODE_ENV !== "development") {
  serveStatic(app);
}

// Start server only if not in Vercel environment
if (process.env.VERCEL !== "1") {
  const startServer = async () => {
    const server = createServer(app);

    // development mode uses Vite
    if (process.env.NODE_ENV === "development") {
      const { setupVite } = await import("./vite");
      await setupVite(app, server);
    }

    const preferredPort = parseInt(process.env.PORT || "3000");
    const port = await findAvailablePort(preferredPort);

    if (port !== preferredPort) {
      console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
    }

    server.listen(port, () => {
      console.log(`Server running on http://localhost:${port}/`);
    });
  }

  startServer().catch(console.error);
}

// Export for Vercel serverless function
export default app;

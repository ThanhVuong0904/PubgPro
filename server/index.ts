import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Log the request details
  if (path.startsWith("/api")) {
    // console.log(`[SERVER] Request: ${req.method} ${path}`, {
    //   headers: req.headers,
    //   query: req.query,
    //   body: req.body,
    //   params: req.params
    // });
  }

  // Capture the response
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;

      // Log truncated response in the standard log format
      if (capturedJsonResponse) {
        let responseStr = JSON.stringify(capturedJsonResponse);
        if (responseStr.length > 80) {
          responseStr = responseStr.slice(0, 79) + "…";
        }
        logLine += ` :: ${responseStr}`;
      }
      log(logLine);

      // Also log detailed response to console
      // console.log(
      //   `[SERVER] Response: ${req.method} ${path} ${res.statusCode} in ${duration}ms`,
      //   {
      //     status: res.statusCode,
      //     headers: res.getHeaders(),
      //     data: capturedJsonResponse,
      //   },
      // );
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();

// Vercel Serverless Function Entry Point
// This wraps the Express app for Vercel's serverless environment

let app;

async function getApp() {
  if (!app) {
    // Dynamically import the built server (ESM format)
    const module = await import('../dist/index.js');
    app = module.default || module.app;
  }
  return app;
}

export default async function handler(req, res) {
  try {
    const expressApp = await getApp();
    return expressApp(req, res);
  } catch (error) {
    console.error('[Vercel Function Error]', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

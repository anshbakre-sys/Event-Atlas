import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './server/config/database.ts';
import authRoutes from './server/routes/authRoutes.ts';
import userRoutes from './server/routes/userRoutes.ts';
import eventRoutes from './server/routes/eventRoutes.ts';
import assistantRoutes from './server/routes/assistantRoutes.ts';
import sourceRoutes from './server/routes/sourceRoutes.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Body & Cookie parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// REST API routes under /api
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/sources', sourceRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function startServer() {
  // Connect to MongoDB with resilient fallback
  await connectDB();

  // Full-stack Vite integration:
  // In dev mode, mount Vite middleware directly onto Express.
  // Frontend and Backend share port 3000 and same origin, eliminating any need for CORS!
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Event Atlas] Server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});

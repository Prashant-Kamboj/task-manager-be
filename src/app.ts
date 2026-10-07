import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { workspacesRouter } from './modules/workspaces/workspaces.routes.js';

export const app = express();
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors({
  origin: env.CORS_ORIGINS,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.get('/health', (_req, res) => { res.json({ status: 'ok' }); });
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/workspaces', workspacesRouter);
app.use(notFound);
app.use(errorHandler);

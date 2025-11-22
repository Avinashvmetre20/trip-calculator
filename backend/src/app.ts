import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import { supabase } from './supabaseClient';
import pool from './db';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';

import authRoutes from './routes/auth.routes';
import tripRoutes from './routes/trip.routes';
import expenseRoutes from './routes/expense.routes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request Logger
const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.url}`);
  next();
};

app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', tripRoutes);
app.use('/api', expenseRoutes);

// Upload Route
const upload = multer();

interface FileRequest extends Request {
  file?: Express.Multer.File;
}

app.post('/upload', upload.single('file'), async (req: FileRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = `${Date.now()}-${file.originalname}`;

    const { error } = await supabase.storage
      .from('uploads')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) {
        logger.error('Supabase upload error:', error);
        return res.status(500).json({ error: error.message });
    }

    // Get public URL
    const { data } = supabase.storage
      .from('uploads')
      .getPublicUrl(fileName);
      
    const publicURL = data.publicUrl;

    // Save publicURL in Neon PostgreSQL
    await pool.query('INSERT INTO uploaded_files (url, uploaded_at) VALUES ($1, NOW())', [publicURL]);

    logger.info(`File uploaded successfully: ${publicURL}`);
    res.json({ url: publicURL });
  } catch (err) {
    next(err);
  }
});

// Error Handling Middleware
app.use(errorHandler);

export default app;

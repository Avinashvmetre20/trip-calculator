import app from './app';
import { logger } from './utils/logger';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || 5000;

app.listen(port, () => {
  logger.info(`Server running on http://localhost:${port}`);
});

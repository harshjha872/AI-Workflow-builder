import { createApp } from './app.js';
import config from './config.js';
import logger from './middleware/requestLogger.js';

async function main() {
  const app = await createApp();
  app.listen(config.port, () => {
    logger.info(`Server running on http://localhost:${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
  });
}

main().catch((err) => {
  logger.error(err, 'Failed to start server');
  process.exit(1);
});

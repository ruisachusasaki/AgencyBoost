import { Express } from 'express';
import gmailOAuthRouter from './gmailOAuth';

// Mount Gmail OAuth + sync trigger routes
export function setupGmail(app: Express) {
  console.log('📧 Mounting Gmail OAuth routes at /api/gmail');
  app.use('/api/gmail', gmailOAuthRouter);
}

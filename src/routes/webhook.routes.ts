import express from 'express';
import { WebhookController } from '../controllers/WebhookController';

const router = express.Router();

router.post('/ce57fe6a7161c8c04ba2ee2dc5b18d0b32d/paystack', WebhookController.handlePaystackWebhook);

export default router;

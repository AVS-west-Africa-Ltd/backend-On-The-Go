import express from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { authProfile } from '../middlewares/authProfile';
import { validateQuery, validateParams } from '../middlewares/validateMiddleware';
import { getTransactionsSchema, getTransactionByIdSchema } from '../validators/transaction.validator';

const router = express.Router();

router.use(authProfile);

router.get('/', validateQuery(getTransactionsSchema), TransactionController.getTransactions);
router.get('/:id', validateParams(getTransactionByIdSchema), TransactionController.getTransactionById);

export default router;

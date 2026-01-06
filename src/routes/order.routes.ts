import express from 'express';
import { OrderController } from '../controllers/OrderController';
import { authProfile } from '../middlewares/authProfile';
import { validateBody, validateQuery, validateParams } from '../middlewares/validateMiddleware';
import {
    createOrderSchema,
    getUserOrdersSchema,
    getOrderByIdSchema,
    initiateCheckoutSchema,
    verifyPaymentSchema
} from '../validators/order.validator';

const router = express.Router();

router.use(authProfile);

router.post('/', validateBody(createOrderSchema), OrderController.createOrder);

router.get('/user', validateQuery(getUserOrdersSchema), OrderController.getUserOrders);
// router.get('/business', validateQuery(getUserOrdersSchema), OrderController.getBusinessOrders);
router.get('/user/:id', validateParams(getOrderByIdSchema), OrderController.getOrderById);

router.post("/checkout", validateBody(initiateCheckoutSchema), OrderController.initiateCheckout);
router.get("/verify", validateQuery(verifyPaymentSchema), OrderController.verifyPayment);

export default router;

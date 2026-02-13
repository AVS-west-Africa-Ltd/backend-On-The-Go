import express from "express";
import * as ChatController from "../controllers/chat.controller";
import { authProfile } from "../middlewares/authProfile";

const router = express.Router();

router.use(authProfile);

router.post("/", ChatController.createChat);
// router.post("/request", ChatController.sendRequest);
router.get("/requests", ChatController.getPendingRequests);
// router.post("/requests/:id/respond", ChatController.respondToRequest);

export default router;

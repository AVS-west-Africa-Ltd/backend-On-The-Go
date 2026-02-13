import express from "express";
import * as MikrotikController from "../controllers/mikrotik.controller";
import { authProfile } from "../middlewares/authProfile";

const router = express.Router();

router.use(authProfile);

router.post("/router", MikrotikController.addRouter);
router.get("/router", MikrotikController.fetchRouter);
router.put("/router", MikrotikController.editRouter);
router.get("/router/check-connection", MikrotikController.checkRouterConnection);
router.post("/router/sync-profiles", MikrotikController.syncProfiles);
router.get("/profiles", MikrotikController.fetchTicketProfile);
router.put("/profiles", MikrotikController.editTicketProfile);
router.put("/profiles/price", MikrotikController.addTicketPrice);
router.put("/profiles/status", MikrotikController.changeTicketStatus);
router.post("/router/command", MikrotikController.routerCommand);

export default router;

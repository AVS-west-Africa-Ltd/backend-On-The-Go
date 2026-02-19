import express from "express";
import * as SearchController from "../controllers/search.controller";
import { validateQuery } from "../middlewares/validateMiddleware";
import { discoverSchema, globalSearchSchema } from "../validators/search.validator";

const router = express.Router();

// Public routes (mostly)
router.get("/discover", validateQuery(discoverSchema), SearchController.discover);
router.get("/global", validateQuery(globalSearchSchema), SearchController.globalSearch);

export default router;

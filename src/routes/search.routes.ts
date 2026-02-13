import express from "express";
import * as SearchController from "../controllers/search.controller";

const router = express.Router();

// Public routes (mostly)
router.get("/discover", SearchController.discover);
router.get("/global", SearchController.globalSearch);

export default router;

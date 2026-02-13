
import express from "express";
import * as ProductController from "../controllers/product.controller";
import { authProfile } from "../middlewares/authProfile";
import { validateBody, validateQuery } from "../middlewares/validateMiddleware";
import { createProductSchema, filterBranchProductsSchema, updateProductSchema } from "../validators/product.validator";
import { upload } from "../middlewares/upload";

const router = express.Router();
router.use(authProfile);

router.post("/", upload.array("media"), validateBody(createProductSchema), ProductController.create);
router.get("/", ProductController.getBranchProducts);
router.get("/:productId", ProductController.getProduct);
router.patch("/:productId", upload.array("media"), validateBody(updateProductSchema), ProductController.update);
router.delete("/:productId", ProductController.deleteProduct);

export default router;

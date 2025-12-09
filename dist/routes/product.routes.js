"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ProductController = __importStar(require("../controllers/ProductController"));
const authProfile_1 = require("../middlewares/authProfile");
const validateMiddleware_1 = require("../middlewares/validateMiddleware");
const product_validator_1 = require("../validators/product.validator");
const upload_1 = require("../middlewares/upload");
const router = express_1.default.Router();
router.use(authProfile_1.authProfile);
router.post("/", upload_1.upload.array("media"), (0, validateMiddleware_1.validateBody)(product_validator_1.createProductSchema), ProductController.create);
router.get("/", ProductController.getBranchProducts);
router.get("/:productId", ProductController.getProduct);
router.patch("/:id", upload_1.upload.array("media"), (0, validateMiddleware_1.validateBody)(product_validator_1.updateProductSchema), ProductController.update);
router.delete("/:productId", ProductController.deleteProduct);
exports.default = router;

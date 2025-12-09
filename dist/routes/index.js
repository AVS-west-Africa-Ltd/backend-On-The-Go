"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_routes_1 = __importDefault(require("./auth.routes"));
const profile_routes_1 = __importDefault(require("./profile.routes"));
const app_routes_1 = __importDefault(require("./app.routes"));
const community_routes_1 = __importDefault(require("./community.routes"));
const branch_routes_1 = __importDefault(require("./branch.routes"));
const product_routes_1 = __importDefault(require("./product.routes"));
const amenities_routes_1 = __importDefault(require("./amenities.routes"));
const router = express_1.default.Router();
// Mount routes with versioning
router.use("/auth", auth_routes_1.default);
router.use("/profile", profile_routes_1.default);
router.use("/app", app_routes_1.default);
router.use("/community", community_routes_1.default);
router.use("/branches", branch_routes_1.default);
router.use("/products", product_routes_1.default);
router.use("/amenities", amenities_routes_1.default);
exports.default = router;

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
const BranchController = __importStar(require("../controllers/BranchController"));
const authProfile_1 = require("../middlewares/authProfile");
const validateMiddleware_1 = require("../middlewares/validateMiddleware");
const branch_validator_1 = require("../validators/branch.validator");
const router = express_1.default.Router();
router.use(authProfile_1.authProfile);
router.post("/create", (0, validateMiddleware_1.validateBody)(branch_validator_1.createBranchSchema), authProfile_1.authProfile, BranchController.create);
router.get("/", authProfile_1.authProfile, BranchController.getBranches);
router.get("/:branchId", authProfile_1.authProfile, BranchController.getBranch);
router.delete("/:branchId", authProfile_1.authProfile, BranchController.deleteBranch);
router.patch("/:branchId/status", authProfile_1.authProfile, BranchController.updateBranchStatus);
exports.default = router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const domain_1 = require("domain");
const express_1 = __importDefault(require("express"));
const CommunityController_1 = require("../controllers/CommunityController");
const authProfile_1 = require("../middlewares/authProfile");
const upload_1 = require("../middlewares/upload");
const router = express_1.default.Router();
router.use(authProfile_1.authProfile);
router.post("/create", upload_1.upload.single("photo"), domain_1.create);
router.post("/add-members", CommunityController_1.addMembers);
router.get("/fetch-members", CommunityController_1.fetchMembers);
exports.default = router;

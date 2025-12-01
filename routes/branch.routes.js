const express = require("express");
const router = express.Router();
const branchController = require("../controllers/BranchController");
const Upload = require("../middlewares/upload");
const authProfile = require("../middlewares/authProfile");

router.use(authProfile);

router.post("/create", authProfile, branchController.create);
router.get("/", authProfile, branchController.getBranches);
router.get("/:branchId", authProfile, branchController.getBranch);
router.delete("/:branchId", authProfile, branchController.deleteBranch);
module.exports = router;
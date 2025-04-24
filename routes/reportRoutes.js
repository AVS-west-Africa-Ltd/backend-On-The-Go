// routes/reportRoutes.js
const express = require("express");
const router = express.Router();
const ReportController = require("../controllers/ReportController");
const authMiddleware = require("../middlewares/authMiddleware");
const { catchErrors } = require("../handlers/errorHandler");

// Create a new report
router.post("/", authMiddleware, catchErrors(ReportController.createReport));

// Get all reports (admin only)
router.get("/", authMiddleware, catchErrors(ReportController.getAllReports));

// Get reports by status (admin only)
router.get("/status/:status", authMiddleware, catchErrors(ReportController.getReportsByStatus));

// Get reports submitted by a specific user
router.get("/user/:userId", authMiddleware, catchErrors(ReportController.getUserReports));

// Get a specific report by ID
router.get("/:id", authMiddleware, catchErrors(ReportController.getReportById));

// Update report status (admin only)
router.put("/:id/status", authMiddleware, catchErrors(ReportController.updateReportStatus));

// Delete a report (admin only)
router.delete("/:id", authMiddleware, catchErrors(ReportController.deleteReport));

// Get reports about a specific entity
router.get("/entity/:entityType/:entityId", authMiddleware, catchErrors(ReportController.getEntityReports));

module.exports = router;
// controllers/ReportController.js
const Report = require('../models/Report');
const { sequelize } = require('../models/Report');

// Create a new report
exports.createReport = async (req, res) => {
  const { title, content, reporter_id, entity_type, entity_id } = req.body;

  try {
    if (!title || !content || !reporter_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, content, and reporter_id are required'
      });
    }

    const report = await Report.create({
      title,
      content,
      reporter_id,
      entity_type: entity_type || null,
      entity_id: entity_id || null
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: report
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting report',
      error: error.message
    });
  }
};

// Get all reports
exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reports',
      error: error.message
    });
  }
};

// Get reports by status
exports.getReportsByStatus = async (req, res) => {
  const { status } = req.params;

  try {
    const reports = await Report.findAll({
      where: { status },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Error fetching reports by status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reports',
      error: error.message
    });
  }
};

// Get reports submitted by a specific user
exports.getUserReports = async (req, res) => {
  const { userId } = req.params;

  try {
    const reports = await Report.findAll({
      where: { reporter_id: userId },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user reports',
      error: error.message
    });
  }
};

// Get a single report by ID
exports.getReportById = async (req, res) => {
  const { id } = req.params;

  try {
    const report = await Report.findByPk(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching report',
      error: error.message
    });
  }
};

// Update a report status
exports.updateReportStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const report = await Report.findByPk(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (!['pending', 'reviewing', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    await report.update({ status });

    res.status(200).json({
      success: true,
      message: 'Report status updated successfully',
      data: report
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating report status',
      error: error.message
    });
  }
};

// Delete a report
exports.deleteReport = async (req, res) => {
  const { id } = req.params;

  try {
    const report = await Report.findByPk(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    await report.destroy();

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting report',
      error: error.message
    });
  }
};

// Get reports about a specific entity
exports.getEntityReports = async (req, res) => {
  const { entityType, entityId } = req.params;

  try {
    const reports = await Report.findAll({
      where: { 
        entity_type: entityType,
        entity_id: entityId
      },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Error fetching entity reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching entity reports',
      error: error.message
    });
  }
};
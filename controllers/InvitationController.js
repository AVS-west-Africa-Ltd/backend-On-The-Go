// controllers/InvitationController.js
const Invitation = require('../models/Invitation');

// Create an invitation
exports.createInvitation = async (req, res) => {
  const { inviter_id, room_id, invitees } = req.body;

  try {
    const invitation = await Invitation.create({ inviter_id, room_id, invitees });
    res.status(201).json({
      success: true,
      message: 'Invitation created successfully',
      data: invitation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating invitation',
      error: error.message
    });
  }
};

// Get all invitations
exports.getAllInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.findAll();
    res.status(200).json({
      success: true,
      data: invitations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching invitations',
      error: error.message
    });
  }
};

// Get a single invitation by ID
exports.getInvitationById = async (req, res) => {
  const { id } = req.params;

  try {
    const invitation = await Invitation.findByPk(id);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    res.status(200).json({
      success: true,
      data: invitation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching invitation',
      error: error.message
    });
  }
};

// Update an invitation
exports.updateInvitation = async (req, res) => {
  const { id } = req.params;
  const { inviter_id, room_id, invitees } = req.body;

  try {
    const invitation = await Invitation.findByPk(id);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    await invitation.update({ inviter_id, room_id, invitees });

    res.status(200).json({
      success: true,
      message: 'Invitation updated successfully',
      data: invitation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating invitation',
      error: error.message
    });
  }
};

// Delete an invitation
exports.deleteInvitation = async (req, res) => {
  const { id } = req.params;

  try {
    const invitation = await Invitation.findByPk(id);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    await invitation.destroy();

    res.status(200).json({
      success: true,
      message: 'Invitation deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting invitation',
      error: error.message
    });
  }
};

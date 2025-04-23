// controllers/InvitationController.js
const Invitation = require('../models/Invitation');
const Room = require('../models/Room');
const RoomMember = require('../models/RoomMember');
const { sequelize } = require('../models/Invitation');
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

// Remove user from invitees array
exports.removeUserFromInvitation = async (roomId, userId) => {
  try {
    const invitation = await Invitation.findOne({
      where: { room_id: roomId }
    });

    if (!invitation) {
      console.log('No invitation found for room:', roomId);
      return false;
    }

    // Ensure invitees is parsed as an array
    let inviteesArray = [];
    try {
      // Handle cases where invitees might be stored as a string
      if (typeof invitation.invitees === 'string') {
        inviteesArray = JSON.parse(invitation.invitees);
      } else if (Array.isArray(invitation.invitees)) {
        inviteesArray = invitation.invitees;
      } else {
        console.log('Invalid invitees format:', invitation.invitees);
        return false;
      }

      // Convert userId to number if invitees are stored as numbers
      const userIdToRemove = typeof inviteesArray[0] === 'number' ? Number(userId) : userId;

      // Remove userId from invitees array
      const updatedInvitees = inviteesArray.filter(id =>
        typeof id === 'number' ? id !== userIdToRemove : id !== userId.toString()
      );

      // If the array changed, update the invitation
      if (updatedInvitees.length !== inviteesArray.length) {
        await invitation.update({
          invitees: updatedInvitees
        });

        // If no invitees left, delete the invitation
        if (updatedInvitees.length === 0) {
          await invitation.destroy();
        }
      }

      return true;
    } catch (parseError) {
      console.error('Error parsing invitees:', parseError);
      return false;
    }
  } catch (error) {
    console.error('Error removing user from invitation:', error);
    throw error;
  }
};

// controllers/RoomController.js
exports.addMember = async (req, res) => {
  const { room_id, user_id, is_invite_acceptance = false } = req.body;

  try {
    const room = await Room.findByPk(room_id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const existingMember = await RoomMember.findOne({
      where: { room_id, user_id },
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: "User is already a member of the room",
      });
    }

    // Start transaction
    const result = await sequelize.transaction(async (t) => {
      // Add member to room
      await room.increment("total_members", { by: 1 }, { transaction: t });

      const member = await RoomMember.create({
        room_id,
        user_id,
      }, { transaction: t });

      // If this is an invite acceptance, remove user from invitees
      if (is_invite_acceptance) {
        try {
          const inviteRemoved = await InvitationController.removeUserFromInvitation(room_id, user_id);
          console.log('Invitation removal result:', inviteRemoved);
        } catch (inviteError) {
          console.error('Error removing user from invitation:', inviteError);
          // Continue with member addition even if invitation removal fails
        }
      }

      return member;
    });

    // Get updated room data
    const updatedRoom = await Room.findByPk(room_id, {
      include: [{
        model: RoomMember,
        as: "members",
        attributes: ["user_id"],
      }],
    });

    // Emit socket events for member addition
    if (io) {
      io.emit('room_updated', updatedRoom);
      io.emit(`user_${user_id}_rooms_updated`, {
        type: 'joined_room',
        room: updatedRoom
      });
    }

    res.status(201).json({
      success: true,
      message: "Member added successfully",
      data: result,
    });
  } catch (error) {
    console.error('Error in addMember:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
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

// Get invitations for a specific user
exports.getUserInvitations = async (req, res) => {
  const { userId } = req.params;

  console.log(`Received request to get invitations for userId: ${userId}`);

  try {
    const query = `JSON_CONTAINS(invitees, ${JSON.stringify(userId)})`;
    console.log(`Generated JSON_CONTAINS query: ${query}`);

    const invitations = await Invitation.findAll({
      where: sequelize.literal(query), 
      include: [{
        model: Room,
        as: 'room',
        required: true,
        attributes: [
          'id', 'name', 'type', 'description', 'image_url', 'status', 
          'total_members', 'created_by', 'createdAt', 'updatedAt'
        ],
        include: [{
          model: RoomMember,
          as: 'members',
          attributes: ['user_id']
        }]
      }],
      logging: (sql) => console.log(`Executing SQL Query: ${sql}`) // Logs exact SQL
    });

    console.log(`Fetched invitations: ${JSON.stringify(invitations, null, 2)}`);

    const transformedInvitations = invitations.map(invitation => {
      const invitationData = invitation.toJSON();
      const roomData = invitationData.room;

      return {
        invitation: {
          id: invitationData.id,
          inviter_id: invitationData.inviter_id,
          room_id: invitationData.room_id,
          invitees: invitationData.invitees,
          created_at: invitationData.createdAt,
          updated_at: invitationData.updatedAt
        },
        room: {
          id: roomData.id,
          name: roomData.name,
          type: roomData.type,
          description: roomData.description,
          image_url: roomData.image_url,
          status: roomData.status,
          total_members: roomData.total_members,
          created_by: roomData.created_by,
          members: roomData.members,
          created_at: roomData.createdAt,
          updated_at: roomData.updatedAt
        }
      };
    });

    console.log(`Transformed invitations: ${JSON.stringify(transformedInvitations, null, 2)}`);

    res.status(200).json({
      success: true,
      data: transformedInvitations
    });
  } catch (error) {
    console.error('Error fetching user invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user invitations',
      error: error.message
    });
  }
};

// Get all invitations for a specific room
exports.getRoomInvites = async (req, res) => {
  const { roomId } = req.params;

  try {
    const invitations = await Invitation.findAll({
      where: { room_id: roomId },
      include: [{
        model: Room,
        as: 'room',
        attributes: ['id', 'name', 'type', 'description', 'image_url']
      }]
    });

    // Transform the data to match frontend expectations
    const transformedInvites = invitations.map(invite => {
      const inviteData = invite.toJSON();
      return {
        id: inviteData.id,
        inviter_id: inviteData.inviter_id,
        room_id: inviteData.room_id,
        invitees: inviteData.invitees,
        created_at: inviteData.createdAt,
        room: inviteData.room
      };
    });

    res.status(200).json({
      success: true,
      data: transformedInvites
    });
  } catch (error) {
    console.error('Error fetching room invites:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching room invites',
      error: error.message
    });
  }
};
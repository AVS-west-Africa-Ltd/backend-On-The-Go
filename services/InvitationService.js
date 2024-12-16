const Invitation = require('../models/Invitation');
const { Op } = require('sequelize');

class InvitationService {
    static async createInvitation(inviter_id, room_id, invitees) {
        try {
            return await Invitation.create({ 
                inviter_id, 
                room_id, 
                invitees 
            });
        } catch (error) {
            throw new Error(`Failed to create invitation: ${error.message}`);
        }
    }

    static async getInvitationById(id) {
        try {
            const invitation = await Invitation.findByPk(id);
            if (!invitation) {
                throw new Error('Invitation not found');
            }
            return invitation;
        } catch (error) {
            throw new Error(`Failed to retrieve invitation: ${error.message}`);
        }
    }

    static async getAllInvitations(filters = {}) {
        try {
            return await Invitation.findAll({
                where: filters,
                order: [['created_at', 'DESC']]
            });
        } catch (error) {
            throw new Error(`Failed to retrieve invitations: ${error.message}`);
        }
    }

    static async updateInvitation(id, updateData) {
        try {
            const [updated] = await Invitation.update(updateData, {
                where: { id }
            });
            if (updated === 0) {
                throw new Error('Invitation not found');
            }
            return this.getInvitationById(id);
        } catch (error) {
            throw new Error(`Failed to update invitation: ${error.message}`);
        }
    }

    static async deleteInvitation(id) {
        try {
            const deleted = await Invitation.destroy({
                where: { id }
            });
            if (deleted === 0) {
                throw new Error('Invitation not found');
            }
            return true;
        } catch (error) {
            throw new Error(`Failed to delete invitation: ${error.message}`);
        }
    }

    static async getInvitationsByUser(userId) {
        try {
            return await Invitation.findAll({
                where: {
                    [Op.or]: [
                        { inviter_id: userId },
                        { invitees: { [Op.like]: `%${userId}%` } }
                    ]
                },
                order: [['created_at', 'DESC']]
            });
        } catch (error) {
            throw new Error(`Failed to retrieve user invitations: ${error.message}`);
        }
    }
}

module.exports = InvitationService;
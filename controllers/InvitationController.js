const InvitationService = require('../services/InvitationService');

class InvitationController {
    static async createInvitation(req, res) {
        const { inviter_id, room_id, invitees } = req.body;

        if (!inviter_id || !room_id || !invitees) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        try {
            const invitation = await InvitationService.createInvitation(
                inviter_id, 
                room_id, 
                invitees
            );
            return res.status(201).json({ 
                message: 'Invitation created successfully', 
                invitation 
            });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    static async getInvitation(req, res) {
        const { id } = req.params;

        try {
            const invitation = await InvitationService.getInvitationById(id);
            return res.status(200).json({ invitation });
        } catch (err) {
            return res.status(404).json({ error: err.message });
        }
    }

    static async getAllInvitations(req, res) {
        const { inviter_id, room_id } = req.query;
        const filters = {};

        if (inviter_id) filters.inviter_id = inviter_id;
        if (room_id) filters.room_id = room_id;

        try {
            const invitations = await InvitationService.getAllInvitations(filters);
            return res.status(200).json({ invitations });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    static async getUserInvitations(req, res) {
        const { userId } = req.params;

        try {
            const invitations = await InvitationService.getInvitationsByUser(userId);
            return res.status(200).json({ invitations });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    static async updateInvitation(req, res) {
        const { id } = req.params;
        const updateData = req.body;

        try {
            const updatedInvitation = await InvitationService.updateInvitation(id, updateData);
            return res.status(200).json({ 
                message: 'Invitation updated successfully', 
                invitation: updatedInvitation 
            });
        } catch (err) {
            return res.status(404).json({ error: err.message });
        }
    }

    static async deleteInvitation(req, res) {
        const { id } = req.params;

        try {
            await InvitationService.deleteInvitation(id);
            return res.status(200).json({ message: 'Invitation deleted successfully' });
        } catch (err) {
            return res.status(404).json({ error: err.message });
        }
    }
}

module.exports = InvitationController;
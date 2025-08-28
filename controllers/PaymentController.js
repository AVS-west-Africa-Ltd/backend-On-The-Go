const { Transaction,  TicketProfile, Business, User } = require('../models');
const { generateTicket } = require('../services/MikrotikService');

const createTransaction = async(req, res)=>{

    const { ticketId } = req.body;
    const userID = req.userId;
    try {
        const ticket = await TicketProfile.findOne({ where:{ id: ticketId, isActive: true }});
    
        if(!ticket) res.status(400).json({message: "Failed ticket not found"});

        const business = await Business.findOne({ where:{ userId: ticket.userId }});

        if( !business ) res.status(400).json({message: "Failed business not found "});

        const user = await User.findOne({ where:{ id: userID}});

        if( !user ) res.status(400).json({message: "Failed user not found "});

        const transaction = await Transaction.create({
            reference: `TXN-${Date.now()}`,
            userId: userID,
            businessId: business.id,
            ticketId: ticket.id,
            amount: ticket.price
        });

        res.status(200).json({ transaction, email:user.email, message: "Transaction was initialized"});

    } catch (error) {
        res.status(400).json({ message:" Failed to create transaction" });
    }
    
}

const verifyPayment = async(req, res)=>{
    
    try {
      const { reference } = req.body;

      const transaction = await Transaction.findOne({
        where: { reference: reference },
      });

      if (!transaction){
        res
          .status(400)
          .json({ message: "Failed to fetch payment transaction" });
      }

      const ticketProfile = await TicketProfile.findOne({
        where: { id: transaction.ticketId },
      });

      if (!ticketProfile){
        res.status(400).json({ message: "Failed to fetch ticket profile" });
      }

      const hotspotTicket = await generateTicket(ticketProfile.toJSON());

      await transaction.update({
        status: "completed",
        hotspotTicket: hotspotTicket,
      });

      res.status(200).json({ transaction });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ message: "Failed to verify payment" });
    }
    
}

module.exports = { createTransaction, verifyPayment };
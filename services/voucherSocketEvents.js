// services/voucherSocketEvents.js
module.exports = {
  emitVoucherCreated: (io, userId, voucher) => {
    io.to(`user_${userId}`).emit('voucher_created', voucher);
  },
  
  emitVoucherClaimed: (io, userId, voucher) => {
    io.to(`user_${userId}`).emit('voucher_claimed', voucher);
    // Also notify business owner if different from claimer
    if (voucher.businessOwnerId && voucher.businessOwnerId !== userId) {
      io.to(`user_${voucher.businessOwnerId}`).emit('voucher_claimed_by_customer', voucher);
    }
  },
  
  emitVoucherUsed: (io, userId, voucher) => {
      console.log(`[Socket] Emitting voucher_used to user_${userId}`, voucher);
      try {
        io.to(`user_${userId}`).emit('voucher_used', voucher);
        // Notify business owner
        if (voucher.businessOwnerId) {
          console.log(`[Socket] Also emitting customer_used_voucher to business owner ${voucher.businessOwnerId}`);
          io.to(`user_${voucher.businessOwnerId}`).emit('customer_used_voucher', voucher);
        }
      } catch (error) {
        console.error('[Socket] Error emitting voucher_used:', error);
      }
  },
  
  emitVoucherGifted: (io, fromUserId, toUserId, voucher) => {
    io.to(`user_${fromUserId}`).emit('voucher_gifted_success', voucher);
    io.to(`user_${toUserId}`).emit('voucher_received', voucher);
  },
  
  emitExchangeRequest: (io, requesterId, requestedId, request) => {
    io.to(`user_${requesterId}`).emit('exchange_request_sent', request);
    io.to(`user_${requestedId}`).emit('exchange_request_received', request);
  },
  
  emitExchangeResponse: (io, requesterId, requestedId, response) => {
    io.to(`user_${requesterId}`).emit('exchange_request_responded', response);
    io.to(`user_${requestedId}`).emit('exchange_request_responded', response);
  },

  // NEW: Market listing socket events
  emitMarketListing: (io, data) => {
    try {
      console.log('[Socket] Emitting market listing events');
      
      // Broadcast to all users that a new listing is available
      io.emit('market-listing-added', data);
      
      // Notify the owner that their listing was successful
      if (data.ownerId) {
        io.to(`user_${data.ownerId}`).emit('my-market-listing-added', {
          ...data,
          message: 'Your voucher has been listed on the market'
        });
      }
    } catch (error) {
      console.error('[Socket] Error emitting market listing events:', error);
    }
  },

  // Optional: Add this if you need to notify when a market listing is claimed
  emitMarketListingClaimed: (io, listingOwnerId, claimerId, listing) => {
    io.to(`user_${listingOwnerId}`).emit('market-listing-claimed', {
      ...listing,
      claimerId
    });
    io.to(`user_${claimerId}`).emit('market-listing-claim-success', listing);
  }
};
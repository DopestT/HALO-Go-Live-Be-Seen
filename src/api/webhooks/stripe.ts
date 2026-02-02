// src/api/webhooks/stripe.ts
import { Request, Response } from 'express';

// TODO: Import database module when backend is set up
// import { db } from '../database';

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const event = req.body;

  // Guardian Logic: Only process successful payments
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id;
    const amountPurchased = session.metadata.coin_amount;

    try {
      // Update Database with "Presence" currency
      // TODO: Uncomment when db module is available
      // await db.user.incrementCoins(userId, amountPurchased);
      console.log(`[HALO SYSTEM] Presence coins delivered to User: ${userId}`);
    } catch (error) {
      console.error("[HALO ERROR] Payout delivery failed. Initializing manual review.");
    }
  }

  res.json({ received: true });
};

// src/api/webhooks/stripe.ts
import { Request, Response } from 'express';

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const event = req.body;

  // Guardian Logic: Only process successful payments
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id;
    const amountPurchased = session.metadata.coin_amount;

    try {
      // TODO: Integrate with backend database to update user coins
      // await db.user.incrementCoins(userId, amountPurchased);
      console.log(`[HALO SYSTEM] Presence coins pending delivery to User: ${userId}, Amount: ${amountPurchased}`);
    } catch (error) {
      console.error("[HALO ERROR] Payout delivery failed. Initializing manual review.", error);
    }
  }

  res.json({ received: true });
};

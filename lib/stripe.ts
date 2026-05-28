import Stripe from "stripe";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-04-22.dahlia",
    })
  : new Proxy({} as Stripe, {
      get() {
        throw new Error("STRIPE_SECRET_KEY is not configured in environment variables.");
      },
    });

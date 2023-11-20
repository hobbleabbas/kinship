import Stripe from "stripe";
import { env } from "~/env.mjs";

const globalForStripe = globalThis as unknown as {
  stripe: Stripe | undefined;
};

export const stripeClient =
  globalForStripe.stripe ??
  new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16"
  });

if (env.NODE_ENV !== "production") globalForStripe.stripe = stripeClient;
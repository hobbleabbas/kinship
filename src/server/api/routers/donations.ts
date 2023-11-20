import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const donationsRouter = createTRPCRouter({
    // (Webhook only) createDonationByWebhook
    // (Manual) createDonationByManualEntry
    // Fetch all donations for user
    // Fetch specific donation
    initializeStripeCharge: publicProcedure
        .input(z.object({
            donorDetails: z.object({
                firstName: z.string().min(1),
                lastName: z.string().min(1),
                email: z.string().email(),
                address: z.object({
                    street: z.string(),
                    city: z.string(),
                    zip: z.string(),
                    state: z.string(),
                    country: z.string()
                })
            }),
            donationDetails: z.object({
                adheringLabels: z.array(z.string()),
                amountDonatingInCents: z.number().int(),
                cause: z.object({
                    name: z.string(),
                    region: z.string()
                }).optional()
            })
        }))
        .query(({ input }) => {
            return {
              greeting: `Hello ${input.donorDetails.firstName}`,
            };
        }),
})
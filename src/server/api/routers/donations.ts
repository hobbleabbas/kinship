import { z } from "zod";

import { adminProcedure, createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";
import { ValidDonationId } from "~/server/methods/utils";

export const donationsRouter = createTRPCRouter({
    manuallyCreateDonation: adminProcedure
        .mutation(({ ctx }) => {
            return {
                message: "successfully accessed admin endpoint"
            }
        }),
    webhookCreationDonation: adminProcedure
        .mutation(({ ctx }) => {
            return {
                message: "successfully accessed admin endpoint"
            }
        }),
    /**
     * Fetch all donations for currentUser
     */
    queryForUser: privateProcedure
        .query(({ ctx }) => {
            return {
                greeting: `Your donations, ${ctx.currentUserId}`,
            };
        }),
    /**
     * Fetch a specific donation. Accepts Kinship ID or a Stripe ID
     */
    getDonation: publicProcedure
        .input(z.object({ donationId: ValidDonationId }))
        .query(({ ctx, input }) => {
            return ctx.db.post.findFirst({
                orderBy: { createdAt: "desc" },
            });
        }),

    /**
     * For frontend use
     */
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
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const donationsRouter = createTRPCRouter({
    // (Webhook only) createDonationByWebhook
    // (Manual) createDonationByManualEntry
    // Fetch all donations for user
    // Fetch specific donation
    
    hello: publicProcedure
        .input(z.object({ text: z.string() }))
        .query(({ input }) => {
            return {
            greeting: `Hello ${input.text}`,
            };
        }),

    create: publicProcedure
        .input(z.object({ name: z.string().min(1) }))
        .mutation(async ({ ctx, input }) => {
            // simulate a slow db call
            await new Promise((resolve) => setTimeout(resolve, 1000));

            return ctx.db.post.create({
            data: {
                name: input.name,
            },
            });
        }),

    getLatest: publicProcedure
        .query(({ ctx }) => {
            return ctx.db.post.findFirst({
                orderBy: { createdAt: "desc" },
            });
        }),
});

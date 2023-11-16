import { z } from "zod";

import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";

export const donorsRouter = createTRPCRouter({
    // Create donor profile
    // Update donor profile
    // Fetch donor profile
    fetch: privateProcedure
        .query(({ ctx }) => {
            return ctx.db.post.findFirst({
                where: {
                    name: ctx.currentUserId
                }
            });
        }),
    
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

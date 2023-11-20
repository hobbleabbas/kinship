import { z } from "zod"

export const ValidDonationId = z
    .union([
        z.string().uuid(),
        z.string().refine(str => str.startsWith("ch_") || str.startsWith("pi_"), {
            message: "String must start with 'ch_' or 'pi_'",
            path: ['donationId']
        })
    ]);

export type ValidDonationId = z.infer<typeof ValidDonationId>

export const verifyDonationId = (donationId: string): donationId is ValidDonationId => {
    const result = ValidDonationId.safeParse(donationId);
    return result.success;
}
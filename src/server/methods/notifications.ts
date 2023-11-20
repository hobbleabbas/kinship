import { Donation } from "@prisma/client"

export const emailDonor = (
    email_template: "donation_made" | "receipt_issued" | "proof_available",
    donation: Donation
) => {
    throw new Error("Not implemented")
}
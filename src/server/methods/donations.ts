import { Currency, Donation, DonationStatus, TransactionStatus } from '@prisma/client';
import Stripe from 'stripe';
import { z } from 'zod';

type FullStripeObject = {
    payment_intent: Stripe.PaymentIntent,
    customer: Stripe.Customer
    charge: Stripe.Charge,
    balance_transaction: Stripe.BalanceTransaction | undefined
}

const StripeDonationMetadata = z.object({
    internal_donation_id: z.string(),
    cause: z.object({
        name: z.string(),
        region: z.string()
    }).optional(),
    internal_donation_status: z.union([
        z.literal("processing"),
        z.literal("delivered_to_partners"),
        z.literal("partially_distributed"),
        z.literal("fully_distributed")
    ]),
    amount_donated_in_cents: z.number().int()
});
  
const ValidStripeResponse = z.object({
    payment_intent: z.object({}),
    customer: z.object({
        name: z.string().min(3).includes(" "),
        email: z.string().email(),
        address: z.object({
            city: z.string(),
            country: z.string(),
            line1: z.string(),
            postal_code: z.string(),
            state: z.string()
        })
    }),
    charge: z.object({
        metadata: StripeDonationMetadata,
        payment_method_details: z.object({
            card: z.object({}).optional(),
            acss_debit: z.object({}).optional(),
        }).refine(data => data.card || data.acss_debit, {
            message: "Either card or acss_debit must exist",
            path: ['payment_method_details']
        }),
        currency: z.string().refine((str) => str == "cad", "Only cad donations accepted currently")
    }),
    balance_transaction: z.object({}).optional()
})

const verifyStripeObject = (data: any): data is z.infer<typeof ValidStripeResponse> => {
    const result = ValidStripeResponse.safeParse(data);
    return result.success;
}

const _fetchFullDonationFromStripe = async (
    donationId: string,
    stripeClient: Stripe
): Promise<FullStripeObject> => {
    if (donationId.startsWith("ch_")) {
        return await _fetchStripeObjectFromCharge(donationId, stripeClient)
    } else if (donationId.startsWith("pi_")) {
        return await _fetchStripeObjectFromPaymentIntent(donationId, stripeClient)
    } else {
        throw new Error(`Invalid donationId to fetch from Stripe: ${donationId}`)
    }
}

const _fetchStripeObjectFromPaymentIntent = async (donationId: string, stripeClient: Stripe): Promise<FullStripeObject> => {
    const params: Stripe.PaymentIntentRetrieveParams = {
        expand: ["latest_charge", "payment_method", "customer"]
    }
    
    const paymentIntentObject = await stripeClient.paymentIntents.retrieve(donationId, params)

    /**
     * Note: This still works with pending donations, like acss_debit donations, because a pending charge object is still created
     */
    if (!paymentIntentObject.latest_charge) {
        throw new Error(`Incomplete donation ${donationId}, no successful charge attached`)
    }

    const fullStripeObject: FullStripeObject = {
        payment_intent: paymentIntentObject,
        customer: paymentIntentObject.customer as Stripe.Customer,
        charge: paymentIntentObject.latest_charge as Stripe.Charge,
        balance_transaction: undefined
    }

    return fullStripeObject
}

const _fetchStripeObjectFromCharge = async (donationId: string, stripeClient: Stripe): Promise<FullStripeObject> => {
    const params: Stripe.ChargeRetrieveParams = {
        expand: ["customer", "payment_intent"]
    }

    const chargeObject = await stripeClient.charges.retrieve(donationId, params)

    const fullStripeObject: FullStripeObject = {
        payment_intent: chargeObject.payment_intent as Stripe.PaymentIntent,
        customer: chargeObject.customer as Stripe.Customer,
        charge: chargeObject,
        balance_transaction: undefined
    }

    return fullStripeObject
}

export const formatDonationFromStripe = async (
    donationFromStripe: string | FullStripeObject,
    stripeClient: Stripe
): Promise<Donation> => {
    let fullDonationObject: FullStripeObject

    // If we are passed a donation id, fetch the full donation object
    // Otherwise use the existing object passed in
    if (typeof donationFromStripe == "string") {
        fullDonationObject = await _fetchFullDonationFromStripe(donationFromStripe, stripeClient)
    } else { fullDonationObject = donationFromStripe }

    if (!verifyStripeObject(fullDonationObject)) {
        throw new Error(`Malformed response from Stripe for donation: ${fullDonationObject.charge.id}`)
    }

    // Split out reused variables
    const customer = fullDonationObject.customer
    const customerName = customer.name.split(" ")
    const customerAddress = customer.address

    const charge = fullDonationObject.charge
    const metadata = charge.metadata

    const paymentIntent = fullDonationObject.payment_intent

    const paymentMethodCard = charge.payment_method_details.card
    const paymentMethodAcssDebit = charge.payment_method_details.acss_debit

    const formattedDonation: Donation = {
        id: charge.metadata.internal_donation_id,
        // Modify Stripe.Charge.created format from seconds to milliseconds
        createdAt: new Date(charge.created * 1000),
        proofDetails: [],
        donationDetails: {
            status: metadata.internal_donation_status 
                == "fully_distributed" ? DonationStatus.FULLY_DISTRIBUTED : DonationStatus.DELIVERED_TO_PARTNERS,
            cause: metadata.cause || null,
            adheringLabels: [],
            donatedAt: new Date(charge.created * 1000),
            amountDonatedInCents: metadata.amount_donated_in_cents
        },
        donorDetails: {
            firstName: customerName[0] as string,
            lastName: customerName[1] as string,
            email: customer.email,
            address: {
                street: customerAddress.line1,
                city: customerAddress.city,
                zip: customerAddress.postal_code,
                state: customerAddress.state,
                country: customerAddress.country
            },
            stripeCustomerIds: [fullDonationObject.customer.id]
        },
        paymentDetails: {
            transactionStatus: 
                {
                    "succeeded": TransactionStatus.SUCCEEDED,
                    "pending": TransactionStatus.PENDING,
                    "failed": TransactionStatus.FAILED
                }[charge.status],
            amountChargedInCents: fullDonationObject.charge.amount,
            // We currently only accept cad, as verified by the zod object above
            currency: Currency.CAD,
            paymentMethod: {
                creditCard: paymentMethodCard && {
                    processorFeeInCents: fullDonationObject.balance_transaction ? fullDonationObject.balance_transaction.fee : 0,
                    ccEndsIn: paymentMethodCard.last4,
                    ccExpiryMonth: paymentMethodCard.exp_month,
                    ccExpiryYear: paymentMethodCard.exp_year,
                    stripePaymentIntentId: paymentIntent.id,
                    stripeCustomerId: customer.id,
                    stripeBalanceTxnId: "",
                    stripeChargeId: charge.id
                } || null,
                acssDebit: paymentMethodAcssDebit && {
                    processorFeeInCents: fullDonationObject.balance_transaction ? fullDonationObject.balance_transaction.fee : 0,
                    bankName: paymentMethodAcssDebit.bank_name,
                    fingerPrint: paymentMethodAcssDebit.fingerprint,
                    institutionNumber: paymentMethodAcssDebit.institution_number,
                    accountEndsIn: paymentMethodAcssDebit.last4,
                    transitNumber: paymentMethodAcssDebit.transit_number,
                    stripePaymentIntentId: paymentIntent.id,
                    stripeBalanceTxnId: "",
                    stripeCustomerId: customer.id,
                    stripeChargeId: charge.id
                } || null,
                cash: false
            }
        }
    }

    return formattedDonation
}
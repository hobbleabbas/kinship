"use client"

import Head from "next/head"
import { Button } from "~/components/ui-primitives/button"
import { Input } from "~/components/ui-primitives/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui-primitives/tabs"
import { api } from "~/utils/api";
import { useForm } from "react-hook-form"

export default function Donate() {
    // Collect donation object details - amount, cause, address, adhering labels, payment method
    // Show appropriate confirmation view

    const formSchema = z.object({
        donorDetails: z.object({
            firstName: z.string().min(1, { message: "Please fill in a first name"}),
            lastName: z.string().min(1, { message: "Please fill in a first name"}),
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
    })

    const [address, setAddress] = useState("")

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            donorDetails: {
                firstName: "",
                lastName: "",
                email: "",
                address: {
                    street: "",
                    city: "",
                    zip: "",
                    state: "",
                    country: ""
                }
            },
            donationDetails: {
                adheringLabels: [],
                amountDonatingInCents: 0,
            }
        },
    })
    
    // 2. Define a submit handler.
    function onSubmit(values: z.infer<typeof formSchema>) {
        // Do something with the form values.
        // ✅ This will be type-safe and validated.
        console.log(values)
    }
    const donate = async () => {
        // await api.donation.initializeStripeCharge.useQuery({ 
            
        // });
    }

    return (
        <>
            <Head>
                <title>Donate With Kinship Canada</title>
                <meta name="description" content="Donate with Kinship Canada. All proceeds go to those who need it most." />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <main className="space-y-8">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="donorDetails.firstName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount</FormLabel>
                                    <FormDescription>
                                        How much would you like to donate today?
                                    </FormDescription>
                                    <FormControl>
                                        <Input placeholder="50" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <SearchAddressBox onSelectAddress={(address: any)=>{setAddress(address)}} defaultValue={""} />
                        <Tabs defaultValue="account" className="w-[400px]">
                            <TabsList>
                                <TabsTrigger value="account">Pay With Credit Card</TabsTrigger>
                                <TabsTrigger value="password">Pay With Bank Transfer</TabsTrigger>
                            </TabsList>
                            <TabsContent value="account">
                                <Button type="submit">Donate</Button>
                            </TabsContent>
                            <TabsContent value="password">
                                <Button type="submit">Donate</Button>
                            </TabsContent>
                        </Tabs>
                    </form>
                </Form>


                
            </main>
        </>
    )
}

import { useGoogleMapsScript, Libraries } from "use-google-maps-script"
import usePlacesAutocomplete from "use-places-autocomplete"
import { ChangeEvent, useState } from "react"
import { Cause, Donation, DonationDetails, DonorDetails } from "@prisma/client"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui-primitives/form"

function SearchAddressBox({ onSelectAddress, defaultValue }: any) {
    const libraries: Libraries = ["places"]

    const { isLoaded, loadError } = useGoogleMapsScript({
        googleMapsApiKey: "AIzaSyBimjBAxzzGXeDQfEyD4iH4U-67P5gh3KU",
        libraries
    })

    if (!isLoaded) return null
    if (loadError) return <p>Error loading google maps api.</p>

    return (
        <ReadySearchBox />
    )
}

function ReadySearchBox({ onSelectAddress, defaultValue }: any) {
    const {
        ready,
        value,
        setValue,
        suggestions: {status, data},
        clearSuggestions
    } = usePlacesAutocomplete({ debounce: 300, defaultValue })

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value)
    }
    const handleSelect = (googleMapsPlace: any) => {
        console.log(googleMapsPlace)
        setValue(googleMapsPlace.description, false)
        clearSuggestions()
    }
    return (
        <div>
            <div className="flex flex-row space-x-4 text-slate-600 underline-offset-4 underline">
                <a type="button" href="#" onClick={clearSuggestions}>Clear suggestions?</a>
                <a type="button" href="#">Enter Manually</a>
            </div>
            <input className="p-2 rounded border border-slate-400 w-full" disabled={!ready} autoComplete="off" value={value} onChange={handleChange} placeholder="type your address"/>
            {status === "OK" && data.map((googleMapsPlace)=>(<a href="#" onClick={(e)=>{
                handleSelect(googleMapsPlace)
            }} key={googleMapsPlace.place_id}>{googleMapsPlace.description}</a>))}

            <input placeholder="address line address" />
            <input placeholder="address zip" />
        </div>
        
    )
}
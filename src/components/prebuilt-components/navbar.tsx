import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import { useRouter } from "next/router"
import { Button } from "../ui-primitives/button"

export default function Navbar() {

    const user = useUser()
    const currentPath = useRouter().pathname

    const paths = [
        {
            name: "Home",
            path: "/"
        },
        {
            name: "Donate",
            path: "/donate"
        },
    ]

    return (
        <nav className="w-full flex content-center justify-between p-4">
            <div className="space-x-4">
                {paths.map((path) => (
                    <Link href={path.path} key={path.name} className={path.path == currentPath ? "p-4 underline underline-offset-2" : "p-4"}>{path.name}</Link>
                ))}
            </div>
            <Link className={("/dashboard" == currentPath) ? "underline underline-offset-2" : ""} href={user.isSignedIn ? "/dashboard" : "/auth"}><Button variant={"default"}>My Receipts</Button></Link>
        </nav>
    )
}
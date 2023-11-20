import Head from "next/head";
import Link from "next/link";
import { SignOutButton, SignInButton, useUser } from "@clerk/nextjs";
import { api } from "~/utils/api";
import { Post } from "@prisma/client";

const PostWrapper = (post: Post) => (
  <p key={post.id}>
    <Link href={`/posts/${post.id}`}>
      {post.name}
    </Link>
  </p>
)

export default function Home() {
  const hello = api.post.hello.useQuery({ text: "from tRPC" });
  const getLatestQuery = api.post.getLatest.useQuery();

  const user = useUser();

  return (
    <>
      <Head>
        <title>Kinship Canada</title>
        <meta name="description" content="Kinship Canada. All proceeds go to those who need it most." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b">
        {/* {hello.data ? hello.data.greeting : "Loading tRPC query..."} */}
        {getLatestQuery.isLoading ? 
          "Loading posts..." : 
          getLatestQuery.data ?

          <PostWrapper id={getLatestQuery.data.id} name={getLatestQuery.data.name} createdAt={getLatestQuery.data.createdAt} updatedAt={getLatestQuery.data.updatedAt} />

          : getLatestQuery.error ?

          "Error loading posts"

          : "No posts found"
        }
        {user.isSignedIn && <SignOutButton />}
        {!user.isSignedIn && <SignInButton />}
      </main>
    </>
  );
}

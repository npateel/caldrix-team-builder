import { auth, signIn, signOut } from "@/auth";

export function SignInButtons({ className = "flex gap-2" }: { className?: string }) {
  return (
    <div className={className}>
      <form
        action={async () => {
          "use server";
          await signIn("github");
        }}
      >
        <button
          type="submit"
          className="rounded border border-black/10 px-3 py-1.5 text-sm dark:border-white/10"
        >
          Sign in with GitHub
        </button>
      </form>
      <form
        action={async () => {
          "use server";
          await signIn("google");
        }}
      >
        <button
          type="submit"
          className="rounded border border-black/10 px-3 py-1.5 text-sm dark:border-white/10"
        >
          Sign in with Google
        </button>
      </form>
    </div>
  );
}

export async function AuthNav() {
  const session = await auth();

  if (!session?.user) {
    return <SignInButtons />;
  }

  return (
    <div className="flex min-w-0 items-center gap-3 text-sm">
      <span className="hidden truncate text-zinc-500 sm:inline dark:text-zinc-400">
        {session.user.name ?? session.user.email}
      </span>
      <form
        action={async () => {
          "use server";
          await signOut();
        }}
      >
        <button
          type="submit"
          className="shrink-0 whitespace-nowrap rounded border border-black/10 px-3 py-1.5 dark:border-white/10"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      }}
      className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 underline"
    >
      Sign out
    </button>
  );
}

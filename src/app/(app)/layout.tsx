import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar displayName={profile?.full_name || user.email || ""} />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-5 sm:pt-8 pb-[calc(env(safe-area-inset-bottom)+6rem)] md:pb-12">
        {children}
      </main>
    </div>
  );
}

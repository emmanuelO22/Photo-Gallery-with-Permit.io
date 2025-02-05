import { redirect } from "next/navigation";
import { createClient } from "../../utils/superbase/server";
import Gallery from "../app/components/Gallery";

export default async function HomePage() {
  const supabase = await createClient();

  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If no session exists, redirect to login page
  if (!session) {
    redirect("/login");
  }

  return (
    <>
      <Gallery />
    </>
  );
}

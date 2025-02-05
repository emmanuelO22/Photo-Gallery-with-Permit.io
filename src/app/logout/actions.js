"use server";
import { createClient } from "../../../utils/superbase/server";
import { redirect } from "next/navigation";

export async function logOut() {
  // Create the client
  const supabase = await createClient();
  
  try {
    // Sign out
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // If successful, redirect to login page instead of root
    redirect('/login');
  } catch (error) {
    console.error('Logout error:', error);
    redirect('/');
  }
}
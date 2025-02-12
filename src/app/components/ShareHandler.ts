// utils/ShareHandler.ts
import { createClient } from "../../../utils/superbase/client";
import { syncUserToPermit } from "@/lib/permit";

export const handleShare = async (
  email: string,
  role: "viewer" | "curator",
  
) => {
  const supabase = createClient();

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Not authenticated");

    // Find the target user by email
    const {
      data: { users },
      error: targetUserError,
    } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    // Filter for the target email after getting the list
    const targetUser = users?.find((user) => user.email === email);

    if (targetUser) {
      console.log("😎😎😎😋😊😊😊😉😉", targetUser);
    }

    if (targetUserError || !targetUser) {
      console.log("😎😎😎😋😊😊😊😉😉", targetUserError, targetUser);
      throw new Error("Target user not found lalaa");
    }

    // Check if share already exists
    const { data: existingShare } = await supabase
      .from("gallery_shares_new")
      .select()
      .eq("owner_id", user.id)
      .eq("shared_with_email", email)
      .single();

    if (!existingShare) {
      console.log("Creating new share");
      // Create share record
      const { error: shareError } = await supabase
        .from("gallery_shares_new")
        .insert({
          owner_id: user.id,
          shared_with_email: email,
        });

      if (shareError) {
        console.error("Share error:", shareError);
        throw shareError;
      }
    }

    // Always sync permissions with Permit.io (for both new and existing shares)
    console.log("Syncing with Permit.io");
    const syncSuccess = await syncUserToPermit(
      {
        id: targetUser.id.toString(),
        email: targetUser.email as string,
      },
      role
    );

    if (!syncSuccess) {
      throw new Error("Failed to sync user permissions with Permit.io");
    }

    // Update relevant images to shared visibility
    const { error: updateError } = await supabase
      .from("gallery_images")
      .update({ visibility: "shared" })
      .eq("user_id", user.id)
      .eq("visibility", "public");

    if (updateError) throw updateError;

    return true;
  } catch (error) {
    console.error("Error in handleShare:", error);
    throw error;
  }
};



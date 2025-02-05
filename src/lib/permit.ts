import { Permit } from "permitio";
import { unstable_cache } from "next/cache";
import { createClient } from "../../utils/superbase/client";

const permit = new Permit({
    pdp: "https://cloudpdp.api.permit.io",
    token: "permit_key_ODvwfdICXFHxDR4AePTKidDmMGM3WyI8z03Srps86hL5WBYe9si0aPLZrZCYlakpm0Rav1XVF0ab7jw9uqzah9",
});

const TEN_MINUTES = 60 * 10;

export type Actions = "create" | "read" | "update" | "delete";
export type Resources = "PublicImages" | "PrivateImages" | "SharedImages";

// Enhanced logging for debugging
const logPermitAction = (action: string, details: any) => {
    console.log(`[Permit.io] ${action}:`, JSON.stringify(details, null, 2));
};

// Cache permission checks with better error handling
const check = unstable_cache(
    async (action: Actions, resource: Resources, userId: string) => {
        try {
            logPermitAction("Checking permission", { userId, action, resource });
            const permitted = await permit.check(userId, action, resource);
            logPermitAction("Permission result", { userId, action, resource, permitted });
            return permitted;
        } catch (error) {
            console.error("[Permit.io] Permission check failed:", error);
            return false;
        }
    },
    ["permitKey"],
    { revalidate: TEN_MINUTES }
);

// Enhanced permission checking function
export const checkPermission = async (action: Actions, resource: Resources) => {
    try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
            throw new Error(`Auth error: ${error.message}`);
        }

        if (!user) {
            throw new Error("No user found");
        }

        logPermitAction("User context", { userId: user.id, email: user.email });
        const hasPermission = await check(action, resource, user.id);
        return hasPermission;
    } catch (error) {
        console.error("[Permit.io] Permission check failed:", error);
        return false;
    }
};

// Sync user with Permit.io
export const syncUserToPermit = async (user: { id: string; email: string }) => {
    try {
        logPermitAction("Syncing user", { userId: user.id, email: user.email });

        // Create/update user in Permit.io
        await permit.api.syncUser({
            key: user.id,
            email: user.email,
            first_name: user.email.split('@')[0], // Basic first name from email
            attributes: {
                provider: "supabase",
                email_verified: true
            }
        });

        // Assign default role
        await permit.api.assignRole({
            role: "admin", // You might want to adjust this based on your needs
            tenant: "default",
            user: user.id
        });

        logPermitAction("User sync completed", { userId: user.id });
        return true;
    } catch (error) {
        console.error("[Permit.io] User sync failed:", error);
        return false;
    }
};

export default permit;
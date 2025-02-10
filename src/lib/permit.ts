// lib/permit.ts
import { Permit } from "permitio";
import { unstable_cache } from "next/cache";
import { createClient } from "../../utils/superbase/client";

// Initialize Permit with proper error handling
const initPermit = () => {
  try {
    return new Permit({
      pdp: "https://cloudpdp.api.permit.io",
      token:
        "permit_key_ODvwfdICXFHxDR4AePTKidDmMGM3WyI8z03Srps86hL5WBYe9si0aPLZrZCYlakpm0Rav1XVF0ab7jw9uqzah9",
    });
  } catch (error) {
    console.error("[Permit.io] Failed to initialize:", error);
    throw error;
  }
};

const permit = initPermit();
const TEN_MINUTES = 60 * 10;

export type Actions =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "view"
  | "comment"
  | "move";
export type Resources =
  | "PublicImages"
  | "PrivateImages"
  | "SharedImages"
  | "Comments";
export type UserRole = "admin" | "viewer" | "curator";

// Enhanced logging with timestamps
const logPermitAction = (action: string, details: any) => {
  const requestId = Math.random().toString(36).substring(7);
  const timestamp = new Date().toISOString();
  console.log(
    `[Permit.io] ${timestamp} (${requestId}) ${action}:`,
    JSON.stringify(details, null, 2)
  );
  return requestId;
};

// Verify user exists in Permit.io
export const verifyUserExists = async (userId: string): Promise<boolean> => {
  try {
    const user = await permit.api.getUser(userId);
    return !!user;
  } catch (error) {
    return false;
  }
};

// Enhanced permission check with retries
const check = async (action: Actions, resource: Resources, userId: string) => {
  try {
    const response = await fetch('/api/permit/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        action,
        resource
      })
    });

    const data = await response.json();
    return data.permitted;
  } catch (error) {
    console.error('Permission check failed:', error);
    return false;
  }
};

// Enhanced permission checking function
export const checkPermission = async (action: Actions, resource: Resources) => {
  const requestId = logPermitAction("checkPermission called", {
    action,
    resource,
  });

  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    console.log('Checking permissions for user:', user);
  
    const canMove = await permit.check('','move', 'gallery');
    console.log('Move permission result:', {
      user,
      canMove,
    });
    if (error) {
      throw new Error(`Auth error: ${error.message}`);
    }

    if (!user) {
      throw new Error("No user found");
    }

    logPermitAction(`User context (${requestId})`, {
      userId: user.id,
      email: user.email,
    });
    const hasPermission = await check(action, resource, user.id);
    return hasPermission;
  } catch (error) {
    console.error(`[Permit.io] (${requestId}) Permission check failed:`, error);
    return false;
  }
};

// Gallery specific permission checks with detailed logging
export const checkGalleryPermissions = async (userId: string) => {
  const requestId = logPermitAction("Checking gallery permissions", { userId });

  try {
    const [canView, canComment, canMove] = await Promise.all([
      check("view", "SharedImages", userId),
      check("comment", "SharedImages", userId),
      check("move", "SharedImages", userId),
    ]);

    const permissions = {
      canView,
      canComment,
      canMove,
    };

    logPermitAction(`Gallery permissions result (${requestId})`, {
      userId,
      permissions,
    });
    return permissions;
  } catch (error) {
    console.error(
      `[Permit.io] (${requestId}) Gallery permissions check failed:`,
      error
    );
    return {
      canView: false,
      canComment: false,
      canMove: false,
    };
  }
};

// Enhanced user sync with role management
export const syncUserToPermit = async (
  user: { id: string; email: string },
  role: UserRole = "admin"
) => {
  const requestId = logPermitAction("Starting user sync", {
    userId: user.id,
    email: user.email,
    role,
  });

  try {
    // First try to get the user to see if they exist
    const response = await fetch("/api/permit/sync-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user, role }),
    });

    if (!response.ok) {
      console.log(response)
      throw new Error("Failed to sync user permissions",);
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("[Permit.io] Failed to sync user:", error);
    return false;
  }
};

// export const syncUserToPermit = async (
//   user: { id: string; email: string },
//   role: UserRole = "admin"
// ) => {
//   const requestId = logPermitAction("Starting user sync", { userId: user.id, email: user.email, role });

//   try {
//     // First try to get the user to see if they exist
//     let userExists = false;
//     try {
//       await permit.api.getUser(user.id);
//       userExists = true;
//     } catch (error) {
//       console.log(`[Permit.io] (${requestId}) User not found, will create new user`);
//     }

//     // Sync user details
//     await permit.api.syncUser({
//       key: user.id,
//       email: user.email,
//       first_name: user.email.split('@')[0],
//       attributes: {
//         provider: "supabase",
//         email_verified: true,
//         last_sync: new Date().toISOString()
//       }
//     });

//     // Assign role - Permit.io will handle replacing existing roles
//     await permit.api.assignRole({
//       role,
//       tenant: "default",
//       user: user.id
//     });

//     logPermitAction(`User sync completed (${requestId})`, {
//       userId: user.id,
//       role,
//       userExists
//     });

//     return true;
//   } catch (error) {
//     console.error(`[Permit.io] (${requestId}) User sync failed:`, error);
//     return false;
//   }
// };

export default permit;

// import { Permit } from "permitio";
// import { unstable_cache } from "next/cache";
// import { createClient } from "../../utils/superbase/client";

// const permit = new Permit({
//     pdp: "https://cloudpdp.api.permit.io",
//     token: "permit_key_ODvwfdICXFHxDR4AePTKidDmMGM3WyI8z03Srps86hL5WBYe9si0aPLZrZCYlakpm0Rav1XVF0ab7jw9uqzah9",
// });

// const TEN_MINUTES = 60 * 10;

// export type Actions = "create" | "read" | "update" | "delete";
// export type Resources = "PublicImages" | "PrivateImages" | "SharedImages";

// // Enhanced logging for debugging
// const logPermitAction = (action: string, details: any) => {
//     console.log(`[Permit.io] ${action}:`, JSON.stringify(details, null, 2));
// };

// // Cache permission checks with better error handling
// const check = unstable_cache(
//     async (action: Actions, resource: Resources, userId: string) => {
//         try {
//             logPermitAction("Checking permission", { userId, action, resource });
//             const permitted = await permit.check(userId, action, resource);
//             logPermitAction("Permission result", { userId, action, resource, permitted });
//             return permitted;
//         } catch (error) {
//             console.error("[Permit.io] Permission check failed:", error);
//             return false;
//         }
//     },
//     ["permitKey"],
//     { revalidate: TEN_MINUTES }
// );

// // Enhanced permission checking function
// export const checkPermission = async (action: Actions, resource: Resources) => {
//     try {
//         const supabase = createClient();
//         const { data: { user }, error } = await supabase.auth.getUser();

//         if (error) {
//             throw new Error(`Auth error: ${error.message}`);
//         }

//         if (!user) {
//             throw new Error("No user found");
//         }

//         logPermitAction("User context", { userId: user.id, email: user.email });
//         const hasPermission = await check(action, resource, user.id);
//         return hasPermission;
//     } catch (error) {
//         console.error("[Permit.io] Permission check failed:", error);
//         return false;
//     }
// };

// // Sync user with Permit.io
// export const syncUserToPermit = async (user: { id: string; email: string }) => {
//     try {
//         logPermitAction("Syncing user", { userId: user.id, email: user.email });

//         // Create/update user in Permit.io
//         await permit.api.syncUser({
//             key: user.id,
//             email: user.email,
//             first_name: user.email.split('@')[0], // Basic first name from email
//             attributes: {
//                 provider: "supabase",
//                 email_verified: true
//             }
//         });

//         // Assign default role
//         await permit.api.assignRole({
//             role: "admin", // You might want to adjust this based on your needs
//             tenant: "default",
//             user: user.id
//         });

//         logPermitAction("User sync completed", { userId: user.id });
//         return true;
//     } catch (error) {
//         console.error("[Permit.io] User sync failed:", error);
//         return false;
//     }
// };

// export default permit;

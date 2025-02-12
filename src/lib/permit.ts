// lib/permit.ts
import { Permit } from "permitio";
import { createClient } from "../../utils/superbase/client";

// Initialize Permit with proper error handling
const initPermit = () => {
  try {
    return new Permit({
      pdp: "https://cloudpdp.api.permit.io",
      token:
      process.env.NEXT_PUBLIC_PERMIT_KEY,
    });
  } catch (error) {
    console.error("[Permit.io] Failed to initialize:", error);
    throw error;
  }
};

const permit = initPermit();


export type Actions =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "view"
  | "comment"
  | "move"
  | "download"
  ;
export type Resources =
  | "PublicImages"
  | "PrivateImages"
  | "SharedImages"
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
    const [canView, canComment, canMove, canDelete, canDownload ] = await Promise.all([
      check("view", "SharedImages", userId),
      check("comment", "SharedImages", userId),
      check("move", "SharedImages", userId),
      check("delete", "SharedImages", userId),
      check("download", "SharedImages", userId),
    ]);

    const permissions = {
      canView,
      canComment,
      canMove,
      canDelete,
      canDownload,
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
      canDelete: false,
      canDownload: false,
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

export default permit;




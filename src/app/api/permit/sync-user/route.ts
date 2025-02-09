

// // src/app/api/permit/sync-user/route.ts
import { NextResponse } from 'next/server';
import permit from '@/lib/permit';

export async function POST(request: Request) {
  try {
    const { user, role = "admin" } = await request.json();
    const requestId = `sync-${Date.now()}`;
    
    console.log('[Permit.io] Attempting to sync user:', {
      userId: user.id,
      email: user.email,
      requestId
    });

    // Check if user exists
    let userExists = false;
    try {
      console.log('[Permit.io] Checking if user exists with ID:', user.id);
      const existingUser = await permit.api.getUser(user.id);
      console.log('[Permit.io] Existing user found:', existingUser);
      userExists = true;
    } catch (error: any) {
      console.log('[Permit.io] User lookup error:', {
        status: error?.response?.status,
        message: error?.message,
        userEmail: user.email
      });
    }

    // Even if user doesn't exist, try to sync
    console.log('[Permit.io] Syncing user details for:', user.id);
    const syncResult = await permit.api.syncUser({
      key: user.id,
      email: user.email,
      first_name: user.email.split('@')[0],
      attributes: {
        provider: "supabase",
        email_verified: true,
        last_sync: new Date().toISOString()
      }
    });
    console.log('[Permit.io] Sync result:', syncResult);

    // unassign user former roles
    console.log('[Permit.io] Unassigning former roles:', {
      userId: user.id,
      tenant: "default"
    });
    const unassignResult = await permit.api.unassignRole({
      user: user.id,
      tenant: "default",
      role: "admin"
    });
    console.log('[Permit.io] Unassign result:', unassignResult);

    // Assign role
    console.log('[Permit.io] Assigning role:', {
      userId: user.id,
      role,
      tenant: "default"
    });
    const roleResult = await permit.api.assignRole({
      role,
      tenant: "default",
      user: user.id
    });
    console.log('[Permit.io] Role assignment result:', roleResult);

    return NextResponse.json({ 
      success: true,
      userExists,
      syncResult,
      roleResult
    });
  } catch (error: any) {
    console.error('[Permit.io] Sync failed:', {
      error: error?.message,
      status: error?.response?.status,
      details: error?.response?.data
    });
    return NextResponse.json(
      { error: 'Failed to sync user', details: error?.message },
      { status: 500 }
    );
  }
}
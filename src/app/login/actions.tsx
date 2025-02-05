'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '../../../utils/superbase/server'
import permit, { syncUserToPermit } from '../../lib/permit'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error, data: userData } = await supabase.auth.signInWithPassword(data)

    if (error) {
        console.error("Login error:", error);
        redirect('/error')
    }

    if (userData?.user) {
        // Sync user data on login
        await syncUserToPermit(userData.user)
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error, data: userData } = await supabase.auth.signUp(data)

    if (error) {
        console.error("Signup error:", error);
        redirect('/error')
    }

    if (userData?.user) {
        // Sync new user with Permit.io
        const syncResult = await syncUserToPermit(userData.user)
        
        if (!syncResult) {
            console.error("Failed to sync user with Permit.io");
            // You might want to handle this case differently
        }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}
import { createClient } from '../../../utils/superbase/server'

export default async function PrivatePage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  
  // If no user, return null
  if (!data?.user) {
    return null;
  }

  // Extract first part of email (before @)
  const emailFirstPart = data.user.email?.split('@')[0] || '';
  
  // Remove all numbers
  const nameWithoutNumbers = emailFirstPart.replace(/[0-9]/g, '');
  
  // Capitalize first letter and handle dots/underscores
  const formattedName = nameWithoutNumbers
    .replace(/[._]/g, ' ') // Replace dots and underscores with spaces
    .trim() // Remove leading/trailing spaces
    .toLowerCase() // Convert to lowercase
    .split(' ') // Split into words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter of each word
    .join(' '); // Join words back together

  return (
    <p className="mt-1 text-md font-bold text-gray-800">
      Welcome {formattedName}
    </p>
  )
}
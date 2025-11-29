/**
 * Generate gender-appropriate avatar URL using DiceBear API
 * @param {string} seed - Seed for avatar generation (usually username)
 * @param {string} gender - Optional: 'male', 'female', or null for neutral
 * @returns {string} Avatar URL
 */
export const generateAvatarUrl = (seed, gender = null) => {
  const cleanSeed = seed?.replace(/\s+/g, '-') || 'user'
  
  // If gender is specified, use personas style with gender parameter
  if (gender === 'male' || gender === 'female') {
    return `https://api.dicebear.com/7.x/personas/svg?seed=${cleanSeed}&gender=${gender}`
  }
  
  // Default: Use initials style (gender-neutral, professional)
  return `https://api.dicebear.com/7.x/initials/svg?seed=${cleanSeed}&backgroundColor=4f46e5&fontSize=40`
}


// =============================================
// PROFILES MANAGEMENT PATTERNS
// =============================================
// Save/load patterns for user profiles with proper auth sync

import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string; // UUID - matches auth.users.id
  full_name?: string;
  phone?: string;
  role?: string;
  avatar_url?: string;
  locale?: string;
  timezone?: string;
  notifications?: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  marketing_prefs?: any;
  crm_signature?: string;
  extra?: any;
  created_at: string;
  updated_at: string;
}

export interface ProfileWithEmail extends Profile {
  email?: string;
}

export interface ProfileForm {
  full_name?: string;
  phone?: string;
  role?: string;
  avatar_url?: string;
  locale?: string;
  timezone?: string;
  notifications?: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  marketing_prefs?: any;
  crm_signature?: string;
  extra?: any;
}

/**
 * Load current user's profile (with auto-creation if first time)
 */
export async function loadMyProfile(): Promise<Profile> {
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user) throw new Error("Not signed in");

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // If first time (no row yet), create a skeleton so form always has data
  if (!data) {
    const initial = {
      id: user.id,
      full_name: user.user_metadata?.full_name ?? "",
      avatar_url: user.user_metadata?.avatar_url ?? null,
      locale: "en",
      timezone: "Asia/Beirut",
      notifications: { email: true, sms: false, push: true },
      marketing_prefs: {},
      extra: {}
    };
    const { data: created, error: insertErr } = await supabase
      .from("profiles").insert([initial]).select().single();
    if (insertErr) throw insertErr;
    return created;
  }

  if (error) throw error;
  return data;
}

/**
 * Get current user's profile (legacy compatibility)
 */
export async function getCurrentUserProfile(): Promise<Profile | null> {
  try {
    return await loadMyProfile();
  } catch (error) {
    console.error('Error loading profile:', error);
    return null;
  }
}

/**
 * Get profile with email (using the view)
 */
export async function getCurrentUserProfileWithEmail(): Promise<ProfileWithEmail | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profile_accounts")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    // Profile doesn't exist yet - create it and return with email
    if (error.code === 'PGRST116') {
      const profile = await createUserProfile(user.id, {
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        role: 'ASSISTANT'
      });
      return { ...profile, email: user.email };
    }
    throw error;
  }
  
  return data;
}

/**
 * Create a new user profile (bootstrap on first login)
 */
export async function createUserProfile(userId: string, profileData: ProfileForm): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .insert([{
      id: userId,
      ...profileData,
      notifications: profileData.notifications || { email: true, sms: false, push: true },
      marketing_prefs: profileData.marketing_prefs || {},
      extra: profileData.extra || {}
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Save profile (syncs with auth and public.profiles)
 */
export async function saveMyProfile(input: {
  full_name?: string;
  phone?: string;
  avatar_url?: string | null;
  locale?: string;
  timezone?: string;
  notifications?: Record<string, any>;
  marketing_prefs?: Record<string, any>;
  crm_signature?: string;
  extra?: Record<string, any>;
}): Promise<Profile> {
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user) throw new Error("Not signed in");

  // 1) Update auth user metadata (optional but nice for consistency)
  const { error: authErr } = await supabase.auth.updateUser({
    data: {
      full_name: input.full_name ?? undefined,
      avatar_url: input.avatar_url ?? undefined,
    }
  });
  if (authErr) throw authErr;

  // 2) Upsert into public.profiles (id must be current user's id)
  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      full_name: input.full_name,
      phone: input.phone,
      avatar_url: input.avatar_url ?? null,
      locale: input.locale,
      timezone: input.timezone,
      notifications: input.notifications,
      marketing_prefs: input.marketing_prefs,
      crm_signature: input.crm_signature,
      extra: input.extra
    }, { onConflict: "id" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update current user's profile (legacy compatibility)
 */
export async function updateCurrentUserProfile(profileData: Partial<ProfileForm>): Promise<Profile> {
  return await saveMyProfile(profileData);
}

/**
 * Get all profiles (OWNER only)
 */
export async function getAllProfiles(): Promise<ProfileWithEmail[]> {
  const { data, error } = await supabase
    .from("profile_accounts")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Update any user's profile (OWNER only)
 */
export async function updateUserProfile(userId: string, profileData: Partial<ProfileForm>): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update(profileData)
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get profiles by role
 */
export async function getProfilesByRole(role: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", role)
    .order("full_name", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Update user notification preferences
 */
export async function updateNotificationPreferences(
  notifications: { email: boolean; sms: boolean; push: boolean }
): Promise<Profile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("profiles")
    .update({ notifications })
    .eq("id", user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update user timezone
 */
export async function updateUserTimezone(timezone: string): Promise<Profile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("profiles")
    .update({ timezone })
    .eq("id", user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update user locale
 */
export async function updateUserLocale(locale: string): Promise<Profile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("profiles")
    .update({ locale })
    .eq("id", user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update CRM signature
 */
export async function updateCRMSignature(crm_signature: string): Promise<Profile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("profiles")
    .update({ crm_signature })
    .eq("id", user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Upload avatar to storage and update profile
 */
export async function uploadAvatar(file: File): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const filePath = `${user.id}/avatar-${Date.now()}.png`;
  const { error: upErr } = await supabase.storage.from("avatars").upload(filePath, file, {
    upsert: true,
    contentType: file.type
  });
  if (upErr) throw upErr;

  const { data: pub } = await supabase.storage.from("avatars").getPublicUrl(filePath);
  // If your bucket isn't public, instead use signed URLs.
  return pub.publicUrl;
}

/**
 * Update avatar and save to profile
 */
export async function updateAvatar(file: File): Promise<Profile> {
  const avatarUrl = await uploadAvatar(file);
  return await saveMyProfile({ avatar_url: avatarUrl });
}

/**
 * Check if current user has role
 */
export async function hasRole(role: string): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  return profile?.role === role;
}

/**
 * Check if current user is owner
 */
export async function isOwner(): Promise<boolean> {
  return await hasRole('OWNER');
}

/**
 * Get user stats for dashboard
 */
export async function getUserStats() {
  const { data, error } = await supabase
    .from("profiles")
    .select("role");

  if (error) throw error;

  const stats = data?.reduce((acc, profile) => {
    acc[profile.role] = (acc[profile.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return {
    total: data?.length || 0,
    owners: stats['OWNER'] || 0,
    garage_managers: stats['GARAGE_MANAGER'] || 0,
    sales: stats['SALES'] || 0,
    assistants: stats['ASSISTANT'] || 0,
    technicians: stats['TECHNICIAN'] || 0,
  };
}

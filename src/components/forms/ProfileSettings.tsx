// =============================================
// PROFILE SETTINGS COMPONENT
// =============================================
// User profile management with all settings

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, User, Bell, Globe, Signature, Shield } from 'lucide-react';
import {
  loadMyProfile,
  saveMyProfile,
  updateAvatar,
  getCurrentUserProfileWithEmail,
  type ProfileWithEmail,
  type ProfileForm
} from '@/lib/profiles-patterns';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ProfileSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (profile: ProfileWithEmail) => void;
}

const ROLE_OPTIONS = [
  { value: 'OWNER', label: 'Owner', description: 'Full system access' },
  { value: 'GARAGE_MANAGER', label: 'Garage Manager', description: 'Manage service operations' },
  { value: 'SALES', label: 'Sales', description: 'Sales and customer management' },
  { value: 'ASSISTANT', label: 'Assistant', description: 'General assistance' },
  { value: 'TECHNICIAN', label: 'Technician', description: 'Technical service work' },
];

const TIMEZONE_OPTIONS = [
  { value: 'Asia/Beirut', label: 'Beirut (GMT+2/+3)' },
  { value: 'Europe/London', label: 'London (GMT+0/+1)' },
  { value: 'America/New_York', label: 'New York (GMT-5/-4)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (GMT-8/-7)' },
  { value: 'Asia/Dubai', label: 'Dubai (GMT+4)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)' },
];

const LOCALE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'Arabic' },
  { value: 'fr', label: 'French' },
];

export function ProfileSettings({ open, onOpenChange, onSuccess }: ProfileSettingsProps) {
  const [profile, setProfile] = useState<ProfileWithEmail | null>(null);
  const [form, setForm] = useState<ProfileForm>({
    full_name: '',
    phone: '',
    role: 'ASSISTANT',
    avatar_url: '',
    locale: 'en',
    timezone: 'Asia/Beirut',
    notifications: { email: true, sms: false, push: true },
    crm_signature: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Load profile when dialog opens
  useEffect(() => {
    if (open) {
      loadProfile();
    }
  }, [open]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const userProfile = await getCurrentUserProfileWithEmail();
      if (userProfile) {
        setProfile(userProfile);
        setForm({
          full_name: userProfile.full_name || '',
          phone: userProfile.phone || '',
          role: userProfile.role || 'ASSISTANT',
          avatar_url: userProfile.avatar_url || '',
          locale: userProfile.locale || 'en',
          timezone: userProfile.timezone || 'Asia/Beirut',
          notifications: userProfile.notifications || { email: true, sms: false, push: true },
          marketing_prefs: userProfile.marketing_prefs || {},
          crm_signature: userProfile.crm_signature || '',
          extra: userProfile.extra || {},
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const updatedProfile = await saveMyProfile(form);
      toast.success('Profile updated successfully');
      setProfile(prev => prev ? { ...prev, ...updatedProfile } : null);
      onSuccess?.({ ...updatedProfile, email: profile?.email });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof ProfileForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (type: 'email' | 'sms' | 'push', enabled: boolean) => {
    const newNotifications = { ...form.notifications!, [type]: enabled };
    setForm(prev => ({ ...prev, notifications: newNotifications }));
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const updatedProfile = await updateAvatar(file);
      setForm(prev => ({ ...prev, avatar_url: updatedProfile.avatar_url || '' }));
      toast.success('Avatar updated successfully');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error(error.message || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER': return 'bg-purple-100 text-purple-800';
      case 'GARAGE_MANAGER': return 'bg-blue-100 text-blue-800';
      case 'SALES': return 'bg-green-100 text-green-800';
      case 'TECHNICIAN': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Profile Settings
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading profile...</span>
          </div>
        ) : (
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            {/* Profile Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={form.avatar_url} />
                      <AvatarFallback>
                        {form.full_name ? getInitials(form.full_name) : 'UN'}
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-1 cursor-pointer hover:bg-blue-700">
                      <Upload className="h-3 w-3" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={uploadingAvatar}
                      />
                    </label>
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{form.full_name || 'Unknown User'}</h3>
                    <p className="text-sm text-muted-foreground">{profile?.email}</p>
                    <Badge className={getRoleColor(form.role || 'ASSISTANT')}>
                      {form.role}
                    </Badge>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>Member since</p>
                    <p>{profile?.created_at ? format(new Date(profile.created_at), 'MMM d, yyyy') : 'Unknown'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <form onSubmit={handleSubmit} className="space-y-4">
              <TabsContent value="general" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          value={form.full_name}
                          onChange={(e) => handleInputChange('full_name', e.target.value)}
                          placeholder="Your full name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={form.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="+961-70-123456"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={form.role} onValueChange={(value) => handleInputChange('role', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              <div>
                                <div className="font-medium">{role.label}</div>
                                <div className="text-sm text-muted-foreground">{role.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="crm_signature">CRM Signature</Label>
                      <Textarea
                        id="crm_signature"
                        value={form.crm_signature}
                        onChange={(e) => handleInputChange('crm_signature', e.target.value)}
                        placeholder="Your signature for CRM communications..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Bell className="h-5 w-5 mr-2" />
                      Notification Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="email-notifications">Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                        </div>
                        <Switch
                          id="email-notifications"
                          checked={form.notifications?.email || false}
                          onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="sms-notifications">SMS Notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                        </div>
                        <Switch
                          id="sms-notifications"
                          checked={form.notifications?.sms || false}
                          onCheckedChange={(checked) => handleNotificationChange('sms', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="push-notifications">Push Notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive push notifications in browser</p>
                        </div>
                        <Switch
                          id="push-notifications"
                          checked={form.notifications?.push || false}
                          onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preferences" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Globe className="h-5 w-5 mr-2" />
                      Language & Region
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="locale">Language</Label>
                        <Select value={form.locale} onValueChange={(value) => handleInputChange('locale', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            {LOCALE_OPTIONS.map((locale) => (
                              <SelectItem key={locale.value} value={locale.value}>
                                {locale.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select value={form.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIMEZONE_OPTIONS.map((timezone) => (
                              <SelectItem key={timezone.value} value={timezone.value}>
                                {timezone.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      Security Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <Label>User ID</Label>
                        <Input value={profile?.id || ''} readOnly className="font-mono text-sm" />
                        <p className="text-xs text-muted-foreground mt-1">Your unique user identifier</p>
                      </div>

                      <div>
                        <Label>Account Created</Label>
                        <Input 
                          value={profile?.created_at ? format(new Date(profile.created_at), 'PPP p') : 'Unknown'} 
                          readOnly 
                        />
                      </div>

                      <div>
                        <Label>Last Updated</Label>
                        <Input 
                          value={profile?.updated_at ? format(new Date(profile.updated_at), 'PPP p') : 'Unknown'} 
                          readOnly 
                        />
                      </div>

                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong>Note:</strong> Role changes require owner approval. Contact an owner to modify your role permissions.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

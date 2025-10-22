import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Palette, 
  Settings, 
  Monitor, 
  Smartphone, 
  Eye, 
  Save,
  RotateCcw,
  Zap,
  Crown
} from 'lucide-react';

interface CustomizationSettings {
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    sidebarStyle: 'modern' | 'classic' | 'minimal';
  };
  branding: {
    companyName: string;
    showLogo: boolean;
    welcomeMessage: string;
    footerText: string;
  };
  interface: {
    compactMode: boolean;
    showAnimations: boolean;
    highContrast: boolean;
    fontSize: 'small' | 'medium' | 'large';
  };
  dashboard: {
    showWeather: boolean;
    showQuickStats: boolean;
    defaultView: 'enhanced' | 'standard';
    autoRefresh: boolean;
  };
}

const defaultSettings: CustomizationSettings = {
  theme: {
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b',
    accentColor: '#f59e0b',
    sidebarStyle: 'modern'
  },
  branding: {
    companyName: 'Monza TECH S.A.L.',
    showLogo: true,
    welcomeMessage: 'Welcome back',
    footerText: 'Powered by Monza TECH'
  },
  interface: {
    compactMode: false,
    showAnimations: true,
    highContrast: false,
    fontSize: 'medium'
  },
  dashboard: {
    showWeather: true,
    showQuickStats: true,
    defaultView: 'enhanced',
    autoRefresh: true
  }
};

export function CustomizationPanel() {
  const [settings, setSettings] = useState<CustomizationSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('monza-customization');
    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsedSettings });
      } catch (error) {
        console.error('Failed to load customization settings:', error);
      }
    }
  }, []);

  // Apply settings to CSS variables
  useEffect(() => {
    if (previewMode) {
      const root = document.documentElement;
      root.style.setProperty('--primary-color', settings.theme.primaryColor);
      root.style.setProperty('--secondary-color', settings.theme.secondaryColor);
      root.style.setProperty('--accent-color', settings.theme.accentColor);
      
      // Apply font size
      const fontSizes = { small: '14px', medium: '16px', large: '18px' };
      root.style.setProperty('--base-font-size', fontSizes[settings.interface.fontSize]);
      
      // Apply compact mode
      if (settings.interface.compactMode) {
        document.body.classList.add('compact-mode');
      } else {
        document.body.classList.remove('compact-mode');
      }
    }
  }, [settings, previewMode]);

  const updateSetting = (path: string, value: any) => {
    const keys = path.split('.');
    const newSettings = { ...settings };
    let current: any = newSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    setSettings(newSettings);
    setHasChanges(true);
  };

  const saveSettings = () => {
    localStorage.setItem('monza-customization', JSON.stringify(settings));
    setHasChanges(false);
    setPreviewMode(true);
    
    // Show success message
    const event = new CustomEvent('monza-notification', {
      detail: { message: 'Customization settings saved successfully!', type: 'success' }
    });
    window.dispatchEvent(event);
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('monza-customization');
    setHasChanges(true);
    setPreviewMode(false);
    
    // Reset CSS
    const root = document.documentElement;
    root.style.removeProperty('--primary-color');
    root.style.removeProperty('--secondary-color');
    root.style.removeProperty('--accent-color');
    root.style.removeProperty('--base-font-size');
    document.body.classList.remove('compact-mode');
  };

  const presetThemes = [
    { name: 'Monza Blue', primary: '#3b82f6', secondary: '#64748b', accent: '#f59e0b' },
    { name: 'Racing Red', primary: '#dc2626', secondary: '#374151', accent: '#fbbf24' },
    { name: 'Professional Gray', primary: '#6b7280', secondary: '#9ca3af', accent: '#10b981' },
    { name: 'Luxury Gold', primary: '#d97706', secondary: '#78716c', accent: '#3b82f6' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Palette className="h-8 w-8 text-blue-600" />
            Monza TECH Customization
          </h1>
          <p className="text-gray-600">Personalize your automotive management system</p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
              Unsaved Changes
            </Badge>
          )}
          {previewMode && (
            <Badge className="bg-green-100 text-green-800">
              <Eye className="h-3 w-3 mr-1" />
              Preview Active
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="theme" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="theme">Theme & Colors</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="interface">Interface</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        {/* Theme & Colors */}
        <TabsContent value="theme" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Color Scheme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Preset Themes */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Quick Presets</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {presetThemes.map((preset, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-20 flex flex-col items-center gap-2"
                      onClick={() => {
                        updateSetting('theme.primaryColor', preset.primary);
                        updateSetting('theme.secondaryColor', preset.secondary);
                        updateSetting('theme.accentColor', preset.accent);
                      }}
                    >
                      <div className="flex gap-1">
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: preset.primary }}
                        />
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: preset.secondary }}
                        />
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: preset.accent }}
                        />
                      </div>
                      <span className="text-xs">{preset.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Colors */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={settings.theme.primaryColor}
                      onChange={(e) => updateSetting('theme.primaryColor', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      id="primary-color-text"
                      name="primary-color-text"
                      value={settings.theme.primaryColor}
                      onChange={(e) => updateSetting('theme.primaryColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={settings.theme.secondaryColor}
                      onChange={(e) => updateSetting('theme.secondaryColor', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      id="secondary-color-text"
                      name="secondary-color-text"
                      value={settings.theme.secondaryColor}
                      onChange={(e) => updateSetting('theme.secondaryColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="accent-color">Accent Color</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      id="accent-color"
                      type="color"
                      value={settings.theme.accentColor}
                      onChange={(e) => updateSetting('theme.accentColor', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      id="accent-color-text"
                      name="accent-color-text"
                      value={settings.theme.accentColor}
                      onChange={(e) => updateSetting('theme.accentColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding */}
        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Company Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  value={settings.branding.companyName}
                  onChange={(e) => updateSetting('branding.companyName', e.target.value)}
                  placeholder="Monza TECH S.A.L."
                />
              </div>
              <div>
                <Label htmlFor="welcome-message">Welcome Message</Label>
                <Input
                  id="welcome-message"
                  value={settings.branding.welcomeMessage}
                  onChange={(e) => updateSetting('branding.welcomeMessage', e.target.value)}
                  placeholder="Welcome back"
                />
              </div>
              <div>
                <Label htmlFor="footer-text">Footer Text</Label>
                <Input
                  id="footer-text"
                  value={settings.branding.footerText}
                  onChange={(e) => updateSetting('branding.footerText', e.target.value)}
                  placeholder="Powered by Monza TECH"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-logo"
                  checked={settings.branding.showLogo}
                  onCheckedChange={(checked) => updateSetting('branding.showLogo', checked)}
                />
                <Label htmlFor="show-logo">Show Company Logo</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Interface */}
        <TabsContent value="interface" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Interface Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="compact-mode"
                  checked={settings.interface.compactMode}
                  onCheckedChange={(checked) => updateSetting('interface.compactMode', checked)}
                />
                <Label htmlFor="compact-mode">Compact Mode (Smaller spacing)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-animations"
                  checked={settings.interface.showAnimations}
                  onCheckedChange={(checked) => updateSetting('interface.showAnimations', checked)}
                />
                <Label htmlFor="show-animations">Enable Animations</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="high-contrast"
                  checked={settings.interface.highContrast}
                  onCheckedChange={(checked) => updateSetting('interface.highContrast', checked)}
                />
                <Label htmlFor="high-contrast">High Contrast Mode</Label>
              </div>
              <div>
                <Label>Font Size</Label>
                <div className="flex gap-2 mt-2">
                  {['small', 'medium', 'large'].map((size) => (
                    <Button
                      key={size}
                      variant={settings.interface.fontSize === size ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSetting('interface.fontSize', size)}
                      className="capitalize"
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dashboard */}
        <TabsContent value="dashboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Dashboard Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-weather"
                  checked={settings.dashboard.showWeather}
                  onCheckedChange={(checked) => updateSetting('dashboard.showWeather', checked)}
                />
                <Label htmlFor="show-weather">Show Weather Widget</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-quick-stats"
                  checked={settings.dashboard.showQuickStats}
                  onCheckedChange={(checked) => updateSetting('dashboard.showQuickStats', checked)}
                />
                <Label htmlFor="show-quick-stats">Show Quick Stats</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-refresh"
                  checked={settings.dashboard.autoRefresh}
                  onCheckedChange={(checked) => updateSetting('dashboard.autoRefresh', checked)}
                />
                <Label htmlFor="auto-refresh">Auto-refresh Data</Label>
              </div>
              <div>
                <Label>Default Dashboard View</Label>
                <div className="flex gap-2 mt-2">
                  {['enhanced', 'standard'].map((view) => (
                    <Button
                      key={view}
                      variant={settings.dashboard.defaultView === view ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSetting('dashboard.defaultView', view)}
                      className="capitalize"
                    >
                      {view}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button
          variant="outline"
          onClick={resetSettings}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {previewMode ? 'Disable Preview' : 'Preview Changes'}
          </Button>
          <Button
            onClick={saveSettings}
            disabled={!hasChanges}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}

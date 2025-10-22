import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Rocket,
  Car,
  Wrench,
  DollarSign,
  Users,
  BarChart3,
  Settings,
  Zap,
  Shield,
  Smartphone,
  Activity,
  Palette,
  Keyboard,
  Clock,
  CheckCircle,
  Star,
  Award,
  Target,
  Lightbulb,
  Crown
} from 'lucide-react';

export default function FeatureShowcase() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const achievements = [
    {
      title: 'Click Issues Resolved',
      description: 'Permanently fixed all modal portal and overlay blocking issues',
      icon: <CheckCircle className="h-6 w-6 text-green-600" />,
      status: 'completed'
    },
    {
      title: 'Mobile Optimization',
      description: 'Fully responsive design with hamburger menu and touch-friendly interface',
      icon: <Smartphone className="h-6 w-6 text-blue-600" />,
      status: 'completed'
    },
    {
      title: 'Performance Optimized',
      description: 'Lazy loading, code splitting, and performance monitoring implemented',
      icon: <Zap className="h-6 w-6 text-yellow-600" />,
      status: 'completed'
    },
    {
      title: 'Production Ready',
      description: 'Security guidelines, deployment guides, and error boundaries in place',
      icon: <Shield className="h-6 w-6 text-purple-600" />,
      status: 'completed'
    }
  ];

  const businessFeatures = [
    {
      category: 'Vehicle Management',
      icon: <Car className="h-8 w-8 text-blue-600" />,
      features: [
        'Complete Car Inventory System',
        'New Car Arrivals Processing',
        'VIN Scanner Integration',
        'Test Drive Management',
        'Vehicle History Tracking'
      ],
      primaryAction: { label: 'Manage Vehicles', path: '/car-inventory' }
    },
    {
      category: 'Garage Operations',
      icon: <Wrench className="h-8 w-8 text-orange-600" />,
      features: [
        'Repair Management System',
        'Garage Scheduling & Capacity',
        'Technician Performance Tracking',
        'Parts & Tools Inventory',
        'Service History & Documentation'
      ],
      primaryAction: { label: 'Open Garage', path: '/garage-schedule' }
    },
    {
      category: 'Financial Management',
      icon: <DollarSign className="h-8 w-8 text-green-600" />,
      features: [
        'Revenue & Expense Tracking',
        'Profitability Analysis',
        'Owner Financial Dashboard',
        'Cost Center Management',
        'Financial Reporting'
      ],
      primaryAction: { label: 'View Finances', path: '/financial-dashboard' }
    },
    {
      category: 'Employee Management',
      icon: <Users className="h-8 w-8 text-purple-600" />,
      features: [
        'Staff Management System',
        'Role-Based Access Control',
        'Performance Analytics',
        'User Activity Monitoring',
        'Employee Audit Trails'
      ],
      primaryAction: { label: 'Manage Staff', path: '/employee-management' }
    }
  ];

  const techFeatures = [
    {
      title: 'Advanced Customization',
      description: 'Complete theme customization with color presets, branding options, and interface settings',
      icon: <Palette className="h-6 w-6 text-pink-600" />,
      action: { label: 'Customize', path: '/customization' }
    },
    {
      title: 'Performance Monitoring',
      description: 'Real-time performance metrics, component analysis, and optimization tracking',
      icon: <Activity className="h-6 w-6 text-red-600" />,
      action: { label: 'Monitor', path: '/performance' }
    },
    {
      title: 'Keyboard Shortcuts',
      description: 'Comprehensive keyboard shortcuts for power users with Alt+key navigation',
      icon: <Keyboard className="h-6 w-6 text-indigo-600" />,
      action: { label: 'View Shortcuts', path: '#shortcuts' }
    },
    {
      title: 'User Role Switching',
      description: 'Test different employee perspectives with easy user switching in development',
      icon: <Users className="h-6 w-6 text-teal-600" />,
      action: { label: 'Switch Users', path: '#user-switch' }
    },
    {
      title: 'System Status Dashboard',
      description: 'Comprehensive overview of all system features and health monitoring',
      icon: <BarChart3 className="h-6 w-6 text-blue-600" />,
      action: { label: 'System Status', path: '/system-status' }
    },
    {
      title: 'Quick Actions Panel',
      description: 'Floating quick actions for instant access to frequently used features',
      icon: <Zap className="h-6 w-6 text-yellow-600" />,
      action: { label: 'Power Panel', path: '#quick-actions' }
    }
  ];

  const handleSpecialAction = (path: string) => {
    if (path === '#shortcuts') {
      const event = new CustomEvent('toggle-shortcuts-help');
      window.dispatchEvent(event);
    } else if (path === '#user-switch') {
      // Focus on user switcher in navbar
      const userSwitcher = document.querySelector('[data-user-switcher]');
      if (userSwitcher) {
        (userSwitcher as HTMLElement).click();
      }
    } else if (path === '#quick-actions') {
      // Show notification about quick actions
      const event = new CustomEvent('monza-notification', {
        detail: { 
          message: 'Look for the ⚡ Quick Actions button in the bottom-left corner!', 
          type: 'info' 
        }
      });
      window.dispatchEvent(event);
    } else {
      navigate(path);
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Crown className="h-12 w-12 text-yellow-500" />
          <h1 className="text-4xl font-bold text-gray-900">Monza TECH</h1>
          <Crown className="h-12 w-12 text-yellow-500" />
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Complete Automotive Management System - From Concept to Production-Ready Platform
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          <Badge className="bg-green-100 text-green-800 px-4 py-2">50+ Pages</Badge>
          <Badge className="bg-blue-100 text-blue-800 px-4 py-2">100% Clickable</Badge>
          <Badge className="bg-purple-100 text-purple-800 px-4 py-2">Mobile Ready</Badge>
          <Badge className="bg-orange-100 text-orange-800 px-4 py-2">Production Ready</Badge>
        </div>
      </div>

      {/* Journey & Achievements */}
      <Card className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Award className="h-6 w-6" />
            Development Journey - From "NON CLICKABLE" to Production Ready
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {achievements.map((achievement, index) => (
              <div key={index} className="text-center p-4 bg-white rounded-lg border">
                <div className="flex justify-center mb-3">
                  {achievement.icon}
                </div>
                <h4 className="font-semibold text-sm mb-2">{achievement.title}</h4>
                <p className="text-xs text-gray-600">{achievement.description}</p>
                <Badge className="mt-2 bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Business Features */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Complete Business Operations</h2>
          <p className="text-gray-600">Everything you need to run a successful automotive business</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {businessFeatures.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  {feature.icon}
                  <span>{feature.category}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  {feature.features.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={() => navigate(feature.primaryAction.path)}
                  className="w-full"
                >
                  {feature.primaryAction.label}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Technical Features */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Advanced Technical Features</h2>
          <p className="text-gray-600">Professional-grade tools and optimizations</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {techFeatures.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  {feature.icon}
                  <span>{feature.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{feature.description}</p>
                <Button 
                  onClick={() => handleSpecialAction(feature.action.path)}
                  variant="outline"
                  className="w-full"
                >
                  {feature.action.label}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Target className="h-6 w-6" />
            System Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-blue-600">50+</p>
              <p className="text-sm text-gray-600">Total Pages</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600">9</p>
              <p className="text-sm text-gray-600">Employee Roles</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-600">100%</p>
              <p className="text-sm text-gray-600">Mobile Ready</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-orange-600">0</p>
              <p className="text-sm text-gray-600">Click Issues</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-red-600">15+</p>
              <p className="text-sm text-gray-600">Keyboard Shortcuts</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-indigo-600">∞</p>
              <p className="text-sm text-gray-600">Customization</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Lightbulb className="h-6 w-6" />
            Ready to Explore?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-lg text-gray-700">
              Welcome, <strong>{user?.name}</strong>! You're logged in as <Badge variant="outline">{user?.role}</Badge>
            </p>
            <p className="text-gray-600">
              Your Monza TECH system is fully operational. Start exploring the features that matter most to your business.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <Button onClick={() => navigate('/enhanced-dashboard')} size="lg">
                <BarChart3 className="h-5 w-5 mr-2" />
                View Dashboard
              </Button>
              <Button onClick={() => navigate('/system-status')} variant="outline" size="lg">
                <Activity className="h-5 w-5 mr-2" />
                System Status
              </Button>
              <Button onClick={() => navigate('/customization')} variant="outline" size="lg">
                <Palette className="h-5 w-5 mr-2" />
                Customize
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

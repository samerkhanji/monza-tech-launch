import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Users, 
  Car, 
  Wrench, 
  DollarSign, 
  BarChart3,
  Settings,
  Shield,
  Zap,
  Smartphone,
  Database,
  Cpu
} from 'lucide-react';

export default function SystemStatus() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const systemFeatures = [
    {
      category: "Core Business Operations",
      icon: <Car className="h-5 w-5" />,
      features: [
        { name: "Car Inventory Management", status: "operational", path: "/car-inventory" },
        { name: "New Car Arrivals", status: "operational", path: "/new-car-arrivals" },
        { name: "VIN Scanner", status: "operational", path: "/scan-vin" },
        { name: "Test Drive Management", status: "operational", path: "/test-drive-logs" },
      ]
    },
    {
      category: "Garage Operations",
      icon: <Wrench className="h-5 w-5" />,
      features: [
        { name: "Repair Management", status: "operational", path: "/repairs" },
        { name: "Garage Scheduling", status: "operational", path: "/garage-schedule" },
        { name: "Garage Inventory", status: "operational", path: "/garage-car-inventory" },
        { name: "Repair History", status: "operational", path: "/repair-history" },
      ]
    },
    {
      category: "Financial Management",
      icon: <DollarSign className="h-5 w-5" />,
      features: [
        { name: "Financial Dashboard", status: "operational", path: "/financial-dashboard" },
        { name: "Owner Finances", status: "operational", path: "/owner-finances" },
        { name: "Financial Analytics", status: "operational", path: "/financial-analytics" },
        { name: "Financial Management", status: "operational", path: "/financial-management" },
      ]
    },
    {
      category: "Employee Management",
      icon: <Users className="h-5 w-5" />,
      features: [
        { name: "Employee Management", status: "operational", path: "/employee-management" },
        { name: "User Management", status: "operational", path: "/user-management" },
        { name: "Employee Analytics", status: "operational", path: "/employee-analytics" },
        { name: "User Activity Dashboard", status: "operational", path: "/user-activity-dashboard" },
      ]
    },
    {
      category: "Analytics & Reporting",
      icon: <BarChart3 className="h-5 w-5" />,
      features: [
        { name: "Enhanced Dashboard", status: "operational", path: "/enhanced-dashboard" },
        { name: "Analytics", status: "operational", path: "/analytics" },
        { name: "Reports", status: "operational", path: "/reports" },
        { name: "Data Upload", status: "operational", path: "/data-upload" },
      ]
    },
    {
      category: "System Administration",
      icon: <Settings className="h-5 w-5" />,
      features: [
        { name: "System Settings", status: "operational", path: "/system-settings" },
        { name: "Audit Logs", status: "operational", path: "/audit-log" },
        { name: "API Documentation", status: "operational", path: "/api-documentation" },
        { name: "Network Auth Test", status: "operational", path: "/network-auth-test" },
      ]
    }
  ];

  const systemHealth = [
    { name: "Click Responsiveness", status: "operational", description: "All buttons and forms are clickable" },
    { name: "Modal Portal Management", status: "operational", description: "No more blocking overlays" },
    { name: "Authentication System", status: "operational", description: "MockAuth with real Monza employees" },
    { name: "Mobile Responsiveness", status: "operational", description: "Hamburger menu and responsive design" },
    { name: "Error Boundaries", status: "operational", description: "Individual page error protection" },
    { name: "Z-Index Hierarchy", status: "operational", description: "Proper layering, no extreme values" },
    { name: "Performance", status: "operational", description: "Fast loading with lazy-loaded pages" },
    { name: "Security", status: "development", description: "MockAuth - replace with RealAuth for production" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'development': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'development': return <Clock className="h-4 w-4 text-blue-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🚗 Monza TECH System Status</h1>
        <p className="text-gray-600">Complete overview of your automotive management system</p>
        <div className="mt-4 flex items-center space-x-4">
          <Badge className="bg-green-100 text-green-800">All Systems Operational</Badge>
          <Badge className="bg-blue-100 text-blue-800">Development Mode</Badge>
          <Badge className="bg-purple-100 text-purple-800">User: {user?.name} ({user?.role})</Badge>
        </div>
      </div>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span>System Health</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {systemHealth.map((item, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{item.name}</span>
                  {getStatusIcon(item.status)}
                </div>
                <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                  {item.status.toUpperCase()}
                </Badge>
                <p className="text-xs text-gray-500 mt-2">{item.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Features by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {systemFeatures.map((category, categoryIndex) => (
          <Card key={categoryIndex}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {category.icon}
                <span>{category.category}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {category.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(feature.status)}
                      <span className="text-sm font-medium">{feature.name}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(feature.path)}
                      className="text-xs"
                    >
                      Open
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Cpu className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">50+</p>
                <p className="text-sm text-gray-600">Total Pages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">9</p>
                <p className="text-sm text-gray-600">Monza Employees</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">100%</p>
                <p className="text-sm text-gray-600">Mobile Ready</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">Fixed</p>
                <p className="text-sm text-gray-600">Click Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={() => navigate('/enhanced-dashboard')} className="w-full">
              📊 View Dashboard
            </Button>
            <Button onClick={() => navigate('/car-inventory')} variant="outline" className="w-full">
              🚗 Manage Inventory
            </Button>
            <Button onClick={() => navigate('/system-settings')} variant="outline" className="w-full">
              ⚙️ System Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Development Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">Development Mode Active</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-blue-700">
            <p className="text-sm">
              🔧 <strong>UserSwitcher:</strong> Use the dropdown in the navbar to test different employee perspectives
            </p>
            <p className="text-sm">
              🔧 <strong>MockAuth:</strong> Currently using enhanced mock authentication with real Monza employees
            </p>
            <p className="text-sm">
              🔧 <strong>Production Ready:</strong> Switch to RealAuthProvider when deploying to production
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

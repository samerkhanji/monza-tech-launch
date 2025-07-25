import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Wifi, Building, Users, Home, XCircle, Clock, Bell, Car, Wrench, DollarSign, BarChart, User } from 'lucide-react';
import { useOfficeNetworkAuth } from '@/hooks/useOfficeNetworkAuth';
import { DEFAULT_OFFICE_NETWORK, isOwner } from '@/config/networkConfig';
import { useAuth } from '@/contexts/AuthContext';
import OwnerNotificationPanel from '@/components/OwnerNotificationPanel';

const NetworkAuthTest: React.FC = () => {
  const { user } = useAuth();
  const {
    isAuthorized,
    isLoading,
    networkInfo,
    networkConfig,
    checkAuthorization,
    authorizeNetwork,
    accessStatus,
    pendingRequest,
  } = useOfficeNetworkAuth();
  const [showOwnerPanel, setShowOwnerPanel] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Checking network authorization...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Monza Tech Software
          </h1>
          <p className="text-gray-600">
            Network Authorization System
          </p>
        </div>

        {/* Network Status */}
        <Card className={isAuthorized ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isAuthorized ? "text-green-800" : "text-orange-800"}`}>
              {isAuthorized ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Office Network Authorized
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5" />
                  Network Not Authorized
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {networkInfo && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Current Network Info</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>IP Address:</strong> {networkInfo.ip}</p>
                    <p><strong>Network Range:</strong> {networkInfo.range}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Office Network Config</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Authorized Range:</strong> {DEFAULT_OFFICE_NETWORK.networkRange}</p>
                    <p><strong>Network Name:</strong> {DEFAULT_OFFICE_NETWORK.networkName}</p>
                  </div>
                </div>
              </div>
            )}

            {isAuthorized && networkConfig && (
              <div className="bg-green-100 p-4 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">{networkConfig.networkName}</span>
                </div>
                <p className="text-sm text-green-700 mb-2">{networkConfig.description}</p>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">
                    All employees on this network have full access to Monza Tech Software
                  </span>
                </div>
              </div>
            )}

            {!isAuthorized && (
              <div className="bg-orange-100 p-4 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="font-medium text-orange-800">Network Not in Authorized List</span>
                </div>
                <p className="text-sm text-orange-700 mb-3">
                  This network is not automatically authorized. You can manually authorize it if this is your office network.
                </p>
                <div className="space-y-2">
                  <Button 
                    onClick={authorizeNetwork}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Building className="h-4 w-4 mr-2" />
                    Authorize This Network as Office
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={checkAuthorization}
                  >
                    <Wifi className="h-4 w-4 mr-2" />
                    Recheck Network
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Access Features */}
        {isAuthorized && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Available Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                      { name: 'Car Inventory', icon: 'Car', description: 'Manage showroom and inventory' },
    { name: 'Garage Operations', icon: 'Wrench', description: 'Schedule repairs and maintenance' },
    { name: 'Financial Management', icon: 'DollarSign', description: 'Track sales and expenses' },
                                      { name: 'Employee Management', icon: 'Users', description: 'Manage staff and permissions' },
                    { name: 'Analytics Dashboard', icon: 'BarChart', description: 'View reports and insights' },
                    { name: 'Client Management', icon: 'User', description: 'Manage customer relationships' },
                ].map((feature) => {
                  const IconComponent = {
                    'Car': Car,
                    'Wrench': Wrench,
                    'DollarSign': DollarSign,
                    'Users': Users,
                    'BarChart': BarChart,
                    'User': User
                  }[feature.icon] || Car;
                  
                  return (
                    <div key={feature.name} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-center gap-2 mb-2">
                        <IconComponent className="w-6 h-6 text-blue-600" />
                        <h4 className="font-medium">{feature.name}</h4>
                      </div>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                      <Badge className="mt-2 bg-green-100 text-green-800">Available</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Access Status */}
        {accessStatus && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Access Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border ${
                  accessStatus.allowed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {accessStatus.allowed ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      {accessStatus.allowed ? 'Access Granted' : 'Access Denied'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{accessStatus.reason}</p>
                  {accessStatus.requiresNotification && (
                    <p className="text-sm text-orange-600 mt-2">
                      <strong>Notification:</strong> {accessStatus.notificationMessage}
                    </p>
                  )}
                </div>

                {pendingRequest && (
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Access Request Pending</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Your access request has been sent to the owner for approval. You'll be notified once a decision is made.
                    </p>
                  </div>
                )}

                {user && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">User Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <p><strong>Name:</strong> {user.name || user.email}</p>
                      <p><strong>Email:</strong> {user.email}</p>
                      <p><strong>Role:</strong> {user.role}</p>
                      <p><strong>Owner Status:</strong> {isOwner(user.role) ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Owner Controls */}
        {user && isOwner(user.role) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Owner Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  As an owner, you can access Monza Tech Software from any network. You can also manage access requests from employees.
                </p>
                <Button 
                  onClick={() => setShowOwnerPanel(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  View Access Requests & Notifications
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Owner Access</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Owners can access from any network</li>
                  <li>• Full access to all Monza Tech features</li>
                  <li>• Can approve/deny employee access requests</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Employee Access</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Employees can only access from office network (178.135.15.x)</li>
                  <li>• External access requires owner approval</li>
                  <li>• Notifications sent to owners for approval</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Owner Notification Panel */}
        <OwnerNotificationPanel 
          isOpen={showOwnerPanel} 
          onClose={() => setShowOwnerPanel(false)} 
        />
      </div>
    </div>
  );
};

export default NetworkAuthTest; 
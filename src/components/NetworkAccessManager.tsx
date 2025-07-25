import React, { useState } from 'react';
import { useNetworkAccess } from '@/hooks/useNetworkAccess';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Wifi, WifiOff, Shield, Globe, Users, Activity } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const NetworkAccessManager: React.FC = () => {
  const {
    currentNetwork,
    isAuthorized,
    accessLevel,
    authorizedNetworks,
    networkStats,
    registerCurrentNetwork,
    addNetwork,
    removeNetwork,
    refreshNetworks,
    isLoading,
  } = useNetworkAccess();

  const [isRegistering, setIsRegistering] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newNetwork, setNewNetwork] = useState({
    networkName: '',
    networkAddress: '',
    accessLevel: 'full',
    description: '',
  });

  const handleRegisterCurrentNetwork = async () => {
    setIsRegistering(true);
    try {
      const success = await registerCurrentNetwork(
        'Monza Tech Network',
        'full',
        'Auto-registered network for Monza Tech Software access'
      );
      
      if (success) {
        setShowAddDialog(false);
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleAddNetwork = async () => {
    if (!newNetwork.networkName || !newNetwork.networkAddress) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await addNetwork({
        networkName: newNetwork.networkName,
        networkAddress: newNetwork.networkAddress,
        subnetMask: '255.255.255.0',
        gateway: newNetwork.networkAddress.replace('/24', '.1'),
        isActive: true,
        allowedPorts: [5173, 3000, 8080],
        accessLevel: newNetwork.accessLevel,
        description: newNetwork.description,
        registeredBy: 'manual',
      });

      setNewNetwork({
        networkName: '',
        networkAddress: '',
        accessLevel: 'full',
        description: '',
      });
      setShowAddDialog(false);
    } catch (error) {
      console.error('Failed to add network:', error);
    }
  };

  const handleRemoveNetwork = async (networkId: string, networkName: string) => {
    if (confirm(`Are you sure you want to remove access for "${networkName}"?`)) {
      await removeNetwork(networkId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Checking network access...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Network Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Current Network Status
          </CardTitle>
          <CardDescription>
            Network access control for Monza Tech Software
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentNetwork && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Local IP</Label>
                <p className="text-sm text-muted-foreground">{currentNetwork.localIP}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Network Address</Label>
                <p className="text-sm text-muted-foreground">{currentNetwork.networkAddress}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Gateway</Label>
                <p className="text-sm text-muted-foreground">{currentNetwork.gateway}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Public IP</Label>
                <p className="text-sm text-muted-foreground">{currentNetwork.publicIP}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <Badge variant={isAuthorized ? "default" : "destructive"} className="flex items-center gap-1">
              {isAuthorized ? <Shield className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isAuthorized ? "Authorized" : "Not Authorized"}
            </Badge>
            
            {accessLevel && (
              <Badge variant="outline">
                Access Level: {accessLevel}
              </Badge>
            )}
          </div>

          {!isAuthorized && (
            <Alert>
              <WifiOff className="h-4 w-4" />
              <AlertTitle>Network Not Authorized</AlertTitle>
              <AlertDescription>
                This network is not registered for Monza Tech Software access. 
                Register it to enable full functionality.
              </AlertDescription>
              <Button 
                onClick={handleRegisterCurrentNetwork}
                disabled={isRegistering}
                className="mt-2"
              >
                {isRegistering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Register This Network
              </Button>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Network Statistics */}
      {networkStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Network Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{networkStats.totalNetworks}</div>
                <div className="text-sm text-muted-foreground">Total Networks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{networkStats.activeNetworks}</div>
                <div className="text-sm text-muted-foreground">Active Networks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{networkStats.totalAccesses}</div>
                <div className="text-sm text-muted-foreground">Total Accesses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{networkStats.recentAccesses.length}</div>
                <div className="text-sm text-muted-foreground">Recent Accesses</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Authorized Networks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Authorized Networks
              </CardTitle>
              <CardDescription>
                Networks with access to Monza Tech Software
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={refreshNetworks}>
                <Activity className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Wifi className="mr-2 h-4 w-4" />
                    Add Network
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Authorized Network</DialogTitle>
                    <DialogDescription>
                      Add a new network to the authorized list
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="networkName">Network Name</Label>
                      <Input
                        id="networkName"
                        value={newNetwork.networkName}
                        onChange={(e) => setNewNetwork(prev => ({ ...prev, networkName: e.target.value }))}
                        placeholder="e.g., Office Network"
                      />
                    </div>
                    <div>
                      <Label htmlFor="networkAddress">Network Address</Label>
                      <Input
                        id="networkAddress"
                        value={newNetwork.networkAddress}
                        onChange={(e) => setNewNetwork(prev => ({ ...prev, networkAddress: e.target.value }))}
                        placeholder="e.g., 192.168.1.0/24"
                      />
                    </div>
                    <div>
                      <Label htmlFor="accessLevel">Access Level</Label>
                      <Select
                        value={newNetwork.accessLevel}
                        onValueChange={(value) => setNewNetwork(prev => ({ ...prev, accessLevel: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full">Full Access</SelectItem>
                          <SelectItem value="readonly">Read Only</SelectItem>
                          <SelectItem value="limited">Limited</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={newNetwork.description}
                        onChange={(e) => setNewNetwork(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Optional description"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddNetwork} className="flex-1">
                        Add Network
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Network Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Access Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Access Count</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {authorizedNetworks.map((network) => (
                <TableRow key={network.id}>
                  <TableCell className="font-medium">{network.networkName}</TableCell>
                  <TableCell>{network.networkAddress}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{network.accessLevel}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={network.isActive ? "default" : "secondary"}>
                      {network.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{network.accessCount}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveNetwork(network.id, network.networkName)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {authorizedNetworks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No authorized networks found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}; 
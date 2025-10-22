import React, { useMemo, useState } from 'react';
import DeviceTrustService, { TrustedDevice } from '@/services/deviceTrustService';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2, ShieldCheck, MonitorSmartphone, Plus, RefreshCw } from 'lucide-react';

const OwnerTrustedDevicesManager: React.FC = () => {
  const { user } = useAuth();
  const deviceTrust = useMemo(() => DeviceTrustService.getInstance(), []);
  const [label, setLabel] = useState('');
  const [refresh, setRefresh] = useState(0);

  if (!user || user.role?.toUpperCase() !== 'OWNER') {
    return null;
  }

  const devices: TrustedDevice[] = deviceTrust.listTrustedDevices(user.id);
  const currentDeviceId = deviceTrust.getCurrentDeviceId();
  const isCurrentTrusted = deviceTrust.isTrustedOwnerDevice(user.id);

  const handleRegister = () => {
    deviceTrust.registerCurrentDevice(user.id, label);
    setLabel('');
    setRefresh(v => v + 1);
  };

  const handleRemove = (deviceId: string) => {
    deviceTrust.removeTrustedDevice(user.id, deviceId);
    setRefresh(v => v + 1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Trusted Owner Devices
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            Register this device so owner access is always allowed, regardless of network.
          </div>
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Optional label (e.g., Office Laptop)"
              className="sm:max-w-sm"
            />
            <div className="flex gap-2">
              <Button onClick={handleRegister} className="min-w-[140px]">
                <Plus className="h-4 w-4" />
                Trust This Device
              </Button>
              <Button variant="outline" onClick={() => setRefresh(v => v + 1)}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Device ID: {currentDeviceId} {isCurrentTrusted && (<span className="ml-2 text-green-700">(trusted)</span>)}
          </div>
        </div>

        <div className="border rounded-none">
          {devices.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No trusted devices yet.</div>
          ) : (
            <ul className="divide-y">
              {devices.map((d) => (
                <li key={d.deviceId} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <MonitorSmartphone className="h-4 w-4" />
                    <div>
                      <div className="font-medium text-sm">{d.label || 'Trusted Device'}</div>
                      <div className="text-xs text-gray-500 break-all">{d.deviceId}</div>
                      <div className="text-xs text-gray-500">{d.platform} • {d.locale} • {d.timezone}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {d.deviceId === currentDeviceId && (
                      <span className="text-xs text-green-700">This device</span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemove(d.deviceId)}
                      className="text-red-700 border-red-300 hover:bg-red-50"
                      title="Remove trusted device"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OwnerTrustedDevicesManager;



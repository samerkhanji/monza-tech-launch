
export interface Destination {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export interface ScanVINState {
  scanning: boolean;
  manualVIN: string;
  foundCar: unknown | null;
  showDestinationDialog: boolean;
  vehicleCategory: 'EV' | 'REV';
}

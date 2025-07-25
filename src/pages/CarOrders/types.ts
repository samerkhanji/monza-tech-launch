export interface OrderedCar {
  id: string;
  model: string;
  vinNumber: string;
  orderDate: string;
  expectedArrivalDate: string;
  status: 'pending' | 'in_transit' | 'arrived';
  shipmentCode?: string;
  customerInfo?: {
    name: string;
    phone: string;
    email: string;
  };
} 
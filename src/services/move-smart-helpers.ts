export type Floor = 
  | 'CAR_INVENTORY'
  | 'SHOWROOM_1'
  | 'SHOWROOM_2'
  | 'GARAGE_INVENTORY'
  | 'SCHEDULE';
export type TableContext =
  | 'FLOOR_1'
  | 'FLOOR_2'
  | 'CAR_INVENTORY'
  | 'GARAGE_INVENTORY'
  | 'SCHEDULE'
  | 'ORDERED_CARS';

export const FLOOR_LABEL: Record<Floor, string> = {
  CAR_INVENTORY:    'Car Inventory',
  SHOWROOM_1:       'Showroom • Floor 1',
  SHOWROOM_2:       'Showroom • Floor 2',
  GARAGE_INVENTORY: 'Garage Inventory',
  SCHEDULE:         'Schedule',
};

// Allowed destinations per page (we'll still exclude the current floor)
export function allowedDestinations(ctx: TableContext): Floor[] {
  switch (ctx) {
    case 'FLOOR_1':
      return ['SHOWROOM_2', 'CAR_INVENTORY', 'GARAGE_INVENTORY', 'SCHEDULE'];
    case 'FLOOR_2':
      return ['SHOWROOM_1', 'CAR_INVENTORY', 'GARAGE_INVENTORY', 'SCHEDULE'];
    case 'CAR_INVENTORY':
      return ['SHOWROOM_1', 'SHOWROOM_2', 'GARAGE_INVENTORY', 'SCHEDULE'];
    case 'GARAGE_INVENTORY':
      return ['SHOWROOM_1', 'SHOWROOM_2', 'CAR_INVENTORY', 'SCHEDULE'];
    case 'SCHEDULE':
      return ['SHOWROOM_1', 'SHOWROOM_2', 'CAR_INVENTORY', 'GARAGE_INVENTORY'];
    case 'ORDERED_CARS':
      return []; // handled by the Receive button (one-way into live cars)
    default:
      return [];
  }
}

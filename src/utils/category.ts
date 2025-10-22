export type VehicleCategory = 'EV' | 'REV' | 'ICEV';

export function normalizeVehicleCategory(input: unknown): VehicleCategory {
  const raw = String(input ?? '').toLowerCase().trim();
  if (!raw) return 'EV';
  if (raw.includes('rev') || raw.includes('range') || raw.includes('erev')) return 'REV';
  if (raw.includes('ice') || raw.includes('engine') || raw.includes('icev') || raw.includes('gas')) return 'ICEV';
  if (raw === 'ev' || raw.includes('electric')) return 'EV';
  return 'EV';
}

export function getCategoryBadgeClass(category: VehicleCategory): string {
  switch (category) {
    case 'EV':
      return 'category-ev';
    case 'REV':
      return 'category-rev';
    case 'ICEV':
      return 'category-icev';
    default:
      return 'bg-gray-400 text-white';
  }
}

export function getCategoryLabel(category: VehicleCategory): string {
  return category;
}



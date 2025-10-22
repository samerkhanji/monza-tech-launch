import React from 'react';
import { kilometersService } from '@/services/kilometersService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

type CarStatus = 'in_stock' | 'reserved' | 'sold' | 'service';

interface CarDetailsMergedViewProps {
	car: any;
	onEdit?: () => void;
	onSchedule?: () => void;
	onPrint?: () => void;
	onShare?: () => void;
}

const StatusPill: React.FC<{ status: CarStatus }> = ({ status }) => {
	const map: Record<string, string> = {
		in_stock: 'bg-emerald-50 text-emerald-700 border-emerald-200',
		reserved: 'bg-amber-50 text-amber-700 border-amber-200',
		sold: 'bg-slate-800 text-white border-slate-800',
		service: 'bg-sky-50 text-sky-700 border-sky-200',
	};
	return (
		<span className={`px-2.5 py-1 rounded-full text-xs border ${map[status]}`}>{String(status).replace('_', ' ')}</span>
	);
};

const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
	<div className={`rounded-2xl border bg-white shadow-sm ${className}`}>{children}</div>
);

const InfoCard: React.FC<{ title: string; value: React.ReactNode }> = ({ title, value }) => (
	<Card className="p-4">
		<div className="text-xs text-neutral-500 mb-1">{title}</div>
		<div className="text-base font-medium break-all">{value ?? '—'}</div>
	</Card>
);

const BatteryCard: React.FC<{ percent: number }> = ({ percent }) => {
	const clamp = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
	return (
		<Card className="p-4 flex items-center justify-between">
			<div>
				<div className="text-xs text-neutral-500 mb-1">Battery</div>
				<div className="text-base font-medium">{clamp}%</div>
			</div>
			<div className="w-12 h-12 rounded-full border relative">
				<div
					className="absolute inset-0 rounded-full"
					style={{
						background: `conic-gradient(#111 ${clamp}%, transparent 0)`,
						mask: 'radial-gradient(circle 9px, transparent 8px, black 9px)',
						WebkitMask: 'radial-gradient(circle 9px, transparent 8px, black 9px)',
					}}
				/>
			</div>
		</Card>
	);
};

const RangeCard: React.FC<{ km: number }> = ({ km }) => {
	const safeKm = Number.isFinite(km) ? km : 0;
	const ratio = Math.max(0, Math.min(1, safeKm / 800));
	return (
		<Card className="p-4">
			<div className="text-xs text-neutral-500 mb-1">Range left</div>
			<div className="text-base font-medium mb-2">{safeKm.toLocaleString()} km</div>
			<div className="h-2 rounded-full bg-neutral-200 relative overflow-hidden">
				<div className="absolute inset-y-0 left-0 rounded-full bg-neutral-900" style={{ width: `${ratio * 100}%` }} />
			</div>
		</Card>
	);
};

const LocationCard: React.FC<{ label: string }> = ({ label }) => (
	<Card className="p-4">
		<div className="text-xs text-neutral-500 mb-1">Location</div>
		<span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200">{label || '—'}</span>
	</Card>
);

const DField: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
	<div className="min-w-0">
		<div className="text-xs text-neutral-500 mb-1">{label}</div>
		<div className="text-sm font-medium truncate">{value ?? '—'}</div>
	</div>
);

const Divider: React.FC = () => <div className="col-span-full border-t my-1" />;

export default function CarDetailsMergedView({ car, onEdit, onSchedule, onPrint, onShare }: CarDetailsMergedViewProps) {
	const breadcrumb = ['Cars', `${car?.brand || ''} ${car?.model || ''} ${car?.year || ''}`.trim()];
	const vin: string = car?.vinNumber || car?.vin || '—';
	const plate: string = car?.licensePlate || car?.clientLicensePlate || '—';
	const battery: number = car?.batteryPercentage ?? 0;
	const rangeKm: number = car?.range ?? 0;
	const odometer: number = kilometersService.getKilometersDriven(car?.id) || car?.kmDriven || car?.mileage || 0;
	const location: string = car?.currentFloor || car?.currentLocation || 'N/A';
	const status: CarStatus = (car?.status as CarStatus) || 'in_stock';

	return (
		<div className="p-6 space-y-6 bg-neutral-50 min-h-screen">
			<style>{`
				:where(.car-details-root) input[type="date"]::-webkit-calendar-picker-indicator,
				:where(.car-details-root) input[type="datetime-local"]::-webkit-calendar-picker-indicator,
				:where(.car-details-root) input::-webkit-calendar-picker-indicator { display: none !important; opacity: 0 !important; visibility: hidden !important; -webkit-appearance: none !important; }
				:where(.car-details-root) input[type="date"],
				:where(.car-details-root) input[type="datetime-local"] { background-image: none !important; }
			`}</style>

			<div className="car-details-root space-y-6">
				{/* Breadcrumb + actions */}
				<div className="flex items-center justify-between">
					<nav className="text-sm text-neutral-500 truncate">
						{breadcrumb.map((b, i) => (
							<span key={i} className="whitespace-nowrap">
								{i > 0 && <span className="mx-2">/</span>}
								{b}
							</span>
						))}
					</nav>
					<div className="flex items-center gap-2">
						<StatusPill status={status} />
						<button className="btn-muted" onClick={onEdit}>Edit</button>
						<button className="btn-muted" onClick={onSchedule}>Schedule</button>
						<button className="btn-muted" onClick={onPrint}>Print</button>
						<button className="btn-muted" onClick={onShare}>Share</button>
					</div>
				</div>

				{/* Tabs for different views */}
				<Tabs defaultValue="overview" className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="overview">Overview</TabsTrigger>
						<TabsTrigger value="history">Car History</TabsTrigger>
					</TabsList>

					<TabsContent value="overview" className="space-y-6">
						{/* Unified card: gallery, KPIs, and details in one scrollable box */}
						<Card className="p-6">
							{/* HERO grid (gallery + KPIs) */}
							<section className="grid grid-cols-12 gap-4 auto-rows-[1fr]">
								<div className="rounded-2xl border bg-white shadow-sm col-span-12 lg:col-span-7 h-[380px] flex items-center justify-center">
									<span className="text-sm text-neutral-500">Gallery (add images)</span>
								</div>
								<div className="col-span-12 lg:col-span-5 grid gap-4 grid-cols-2 auto-rows-[minmax(120px,1fr)]">
									<InfoCard title="VIN" value={vin} />
									<InfoCard title="Plate" value={plate} />
									<BatteryCard percent={battery} />
									<RangeCard km={rangeKm} />
									<InfoCard title="Odometer" value={`${odometer} km`} />
									<LocationCard label={location} />
								</div>
							</section>

							{/* Divider between hero and detail fields */}
							<div className="my-4 border-t" />

							{/* Vehicle & Sale Details */}
							<h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
								<span>🚗</span> Vehicle & Sale Details
							</h2>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-5">
								<DField label="Customer Name" value={car?.clientName || 'Unassigned'} />
								<DField label="Customer Phone / Email" value={car?.clientPhone || 'N/A'} />
								<DField label="Sale Status" value={status === 'sold' ? 'Sold' : status === 'reserved' ? 'Reserved' : 'Available'} />
								<DField label="Date Sold" value={car?.clientPurchaseDate ? new Date(car.clientPurchaseDate).toLocaleDateString() : 'N/A'} />
								<DField label="Salesperson" value={(car as any)?.salesperson || 'N/A'} />
								<div />
								<Divider />
								<DField label="VIN Number" value={vin} />
								<DField label="Number Plate" value={plate} />
								<DField label="Category" value={(car as any)?.category || 'N/A'} />
								<DField label="Stock / Internal Code" value={(car as any)?.internalCode || (car as any)?.carCode || 'N/A'} />
							</div>
						</Card>
					</TabsContent>

					<TabsContent value="history" className="space-y-6">
						{/* Car History Tab */}
						<Card className="p-6">
							<h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
								<span>📋</span> Car History - {car?.model} ({car?.vinNumber})
							</h2>
							<div className="space-y-4">
								{/* Vehicle Information */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
									<div>
										<h3 className="font-medium text-gray-900 mb-2">Vehicle Information</h3>
										<div className="space-y-2 text-sm">
											<div><span className="font-medium">VIN:</span> {car?.vinNumber}</div>
											<div><span className="font-medium">Brand:</span> {car?.brand || 'N/A'}</div>
											<div><span className="font-medium">Color:</span> {car?.color}</div>
											<div><span className="font-medium">Model:</span> {car?.model}</div>
											<div><span className="font-medium">Year:</span> {car?.year}</div>
											<div><span className="font-medium">Status:</span> 
												<Badge className={`ml-2 ${status === 'sold' ? 'bg-blue-100 text-blue-800' : status === 'reserved' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
													{status === 'sold' ? 'Sold' : status === 'reserved' ? 'Reserved' : 'Available'}
												</Badge>
											</div>
										</div>
									</div>
									<div>
										<h3 className="font-medium text-gray-900 mb-2">Current Status</h3>
										<div className="space-y-2 text-sm">
											<div><span className="font-medium">Price:</span> <span className="text-green-600 font-medium">${car?.sellingPrice?.toLocaleString() || 'N/A'}</span></div>
											<div><span className="font-medium">Battery:</span> {battery}%</div>
											<div><span className="font-medium">Range:</span> {rangeKm} km</div>
										</div>
									</div>
								</div>

								{/* Success Message */}
								<div className="bg-green-50 border border-green-200 rounded-lg p-4">
									<div className="flex items-center gap-2 text-green-800">
										<span className="text-lg">✔</span>
										<span className="font-medium">SUCCESS! Car clicking is working correctly!</span>
									</div>
									<p className="text-green-700 text-sm mt-1">
										This is a simplified version of the car history dialog. The full version with tabs will be available once this basic functionality is confirmed.
									</p>
								</div>
							</div>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}

// Utility class for actions row
// Add this to a global CSS if you want to reuse button styles as .btn-muted
// .btn-muted { @apply inline-flex items-center justify-center h-9 px-3 rounded-lg border bg-white text-sm text-neutral-700 hover:bg-neutral-50; }



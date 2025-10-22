import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export type Vehicle = {
  id: string;
  vin: string;
  model: string;
  brand: string;
  year: number;
  color?: string | null;
  category?: string | null;
  price?: number | null;
  status?: string | null;
  warranty_life_months?: number | null;
  battery_pct?: number | null;
  range_km?: number | null;
  km_driven?: number | null;
  test_drive_status?: string | null;
  pdi_status?: string | null;
  customs_status?: string | null;
  software_model?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  number_plate?: string | null;
  purchase_date?: string | null; // ISO string
};

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-40 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value ?? <em className="text-muted-foreground">—</em>}</span>
    </div>
  );
}

function StatusBadge({ value }: { value?: string | null }) {
  if (!value) return <span>—</span>;
  const lower = value.toLowerCase();
  const tone = lower.includes('sold') ? 'bg-emerald-100 text-emerald-700'
    : lower.includes('pending') || lower.includes('reserved') ? 'bg-amber-100 text-amber-700'
    : lower.includes('hold') ? 'bg-rose-100 text-rose-700'
    : 'bg-slate-100 text-slate-700';
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${tone}`}>{value}</span>;
}

export default function VehicleDetailsSummary({ v }: { v: Vehicle }) {
  const money = (n?: number | null) =>
    typeof n === 'number' ? `$${n.toLocaleString()}` : undefined;

  const pct = (n?: number | null) =>
    typeof n === 'number' ? `${n}%` : undefined;

  const date = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleString() : undefined;

  return (
    <div className="rounded-lg border bg-white">
      <div className="px-4 py-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">Summary</h2>
      </div>
      <Separator />

      <div className="p-4 flex flex-wrap gap-2">
        <Badge variant="secondary">VIN: {v.vin}</Badge>
        <Badge variant="secondary">Model: {v.model}</Badge>
        <Badge variant="secondary">Category: {v.category ?? '—'}</Badge>
        <Badge variant="secondary">Year: {v.year}</Badge>
        <Badge><StatusBadge value={v.status} /></Badge>
      </div>

      <Separator />
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Field label="VIN" value={<code className="text-xs">{v.vin}</code>} />
          <Field label="Model" value={v.model} />
          <Field label="Category" value={v.category} />
          <Field label="Year" value={v.year} />
          <Field label="Color" value={v.color} />
          <Field label="Price" value={money(v.price)} />
          <div className="flex items-start gap-2">
            <span className="w-40 text-sm text-muted-foreground">Status</span>
            <StatusBadge value={v.status} />
          </div>
          <Field label="Warranty Life" value={v.warranty_life_months != null ? `${v.warranty_life_months} months` : undefined} />
        </div>

        <div className="space-y-2">
          <Field label="Battery" value={pct(v.battery_pct)} />
          <Field label="Range Capacity" value={v.range_km != null ? `${v.range_km} km` : undefined} />
          <Field label="Km Driven" value={v.km_driven != null ? `${v.km_driven.toLocaleString()} km` : undefined} />
          <Field label="Test Drive" value={v.test_drive_status} />
          <Field label="PDI" value={v.pdi_status} />
          <Field label="Customs" value={v.customs_status} />
          <Field label="Software Model" value={v.software_model} />
        </div>
      </div>

      <Separator />
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Field label="Customer Name" value={v.customer_name} />
          <Field label="Customer Number" value={v.customer_phone} />
        </div>
        <div className="space-y-2">
          <Field label="Number Plate" value={v.number_plate} />
          <Field label="Purchase Date" value={date(v.purchase_date)} />
        </div>
      </div>
    </div>
  );
}



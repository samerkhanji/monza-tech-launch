import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function NewTestDrivePage() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const vehicleId = search.get('vehicleId') ?? '';

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [date, setDate] = React.useState('');
  const [driver, setDriver] = React.useState('');
  const [durationMin, setDurationMin] = React.useState<number>(30);
  const [notes, setNotes] = React.useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (!vehicleId) throw new Error('Missing vehicleId');
      const start = new Date(date);
      if (isNaN(start.getTime())) throw new Error('Choose a valid date & time.');
      const end = new Date(start.getTime() + durationMin * 60_000);

      const { error: rpcError } = await supabase.rpc('rpc_vehicle_move_to_schedule', {
        p_vehicle_id: vehicleId,
        p_title: 'Test Drive',
        p_reason: notes || `Test drive for ${driver || 'client'}`,
        p_priority: 2,
        p_start: start.toISOString(),
        p_end: end.toISOString(),
        p_assignee_user_id: null,
      });
      if (rpcError) throw rpcError;

      navigate(`/vehicles/${vehicleId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to schedule test drive.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Schedule Test Drive</h1>
        <p className="text-sm text-muted-foreground">Create a test drive job for this vehicle.</p>
      </header>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label htmlFor="testDriveDate" className="block text-sm font-medium">Test Drive Date & Time</label>
          <input id="testDriveDate" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full h-12 border px-4 rounded-md" required />
        </div>
        <div>
          <label htmlFor="driverName" className="block text-sm font-medium">Driver</label>
          <input id="driverName" placeholder="Driver name" value={driver} onChange={(e) => setDriver(e.target.value)} className="mt-1 w-full h-12 border px-4 rounded-md" />
        </div>
        <div>
          <label htmlFor="duration" className="block text-sm font-medium">Duration (minutes)</label>
          <input id="duration" type="number" min={5} value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))} className="mt-1 w-full h-12 border px-4 rounded-md" required />
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium">Notes</label>
          <textarea id="notes" placeholder="Any special requests or route notes…" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 w-full min-h-[100px] border px-4 py-3 rounded-md" />
        </div>

        {error && (
          <div className="text-red-600 text-sm border border-red-300 rounded-md p-2 bg-red-50">{error}</div>
        )}

        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={() => navigate(-1)} className="h-10 px-4 border rounded-md">Cancel</button>
          <button type="submit" disabled={submitting} className="h-10 px-4 rounded-md bg-monza-yellow text-monza-black disabled:opacity-50">
            {submitting ? 'Scheduling…' : 'Schedule Test Drive'}
          </button>
        </div>
      </form>
    </main>
  );
}



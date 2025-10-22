import React from "react";

export type PDIStatus = "not_started" | "pending" | "complete";

export default function PDIForm({ vin, model, status = "pending" }: { vin: string; model: string; status?: PDIStatus }) {
  return (
    <div className="min-w-[980px] bg-white text-gray-900">
      <header className="px-8 pt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-semibold tracking-wide">MONZA</span>
            <span className="text-gray-300">•</span>
            <span className="font-semibold tracking-wide">VOYAH</span>
          </div>
          <StatusBadge status={status} />
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">PDI Checklist</h1>
      </header>

      <main className="p-8">
        <section className="rounded-lg border border-gray-200 bg-gray-50/50 p-6">
          <h2 className="text-xl font-semibold mb-4">General Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Outlet name">
              <input 
                id="pdi-outlet-name"
                name="outlet_name"
                className="input" 
                placeholder="Monza S.A.L"
                autocomplete="organization"
              />
            </Field>
            <Field label="Outlet number">
              <input 
                id="pdi-outlet-number"
                name="outlet_number"
                className="input"
                autocomplete="off"
              />
            </Field>
            <Field label="Estimated delivery date">
              <input 
                id="pdi-estimated-delivery"
                name="estimated_delivery"
                type="date" 
                className="input pr-10"
                autocomplete="off"
              />
            </Field>

            <Field label="Manufacturing date">
              <input 
                id="pdi-manufacturing-date"
                name="manufacturing_date"
                type="date" 
                className="input pr-10"
                autocomplete="off"
              />
            </Field>
            <Field label="Model">
              <input 
                id="pdi-model"
                name="model"
                className="input" 
                defaultValue={model}
                autocomplete="off"
              />
            </Field>
            <Field label="VIN">
              <input 
                id="pdi-vin"
                name="vin"
                className="input font-mono" 
                defaultValue={vin}
                autocomplete="off"
              />
            </Field>

            <Field label="Range extender number*">
              <input 
                id="pdi-range-extender"
                name="range_extender_number"
                className="input"
                autocomplete="off"
              />
            </Field>
            <Field label="High voltage battery number">
              <input 
                id="pdi-hv-battery"
                name="hv_battery_number"
                className="input"
                autocomplete="off"
              />
            </Field>
            <Field label="Activity No.">
              <input 
                id="pdi-activity-no"
                name="activity_number"
                className="input"
                autocomplete="off"
              />
            </Field>

            <Field label="Front motor number*">
              <input 
                id="pdi-front-motor"
                name="front_motor_number"
                className="input"
                autocomplete="off"
              />
            </Field>
            <Field label="Rear motor number">
              <input 
                id="pdi-rear-motor"
                name="rear_motor_number"
                className="input"
                autocomplete="off"
              />
            </Field>
            <Field label="Quality activities">
              <div className="flex items-center gap-6 h-11">
                <LabelRadio name="qa" value="no" defaultChecked>
                  No
                </LabelRadio>
                <LabelRadio name="qa" value="yes">Yes</LabelRadio>
              </div>
            </Field>

            <div className="md:col-span-3">
              <Field label="Customer requirements">
                <textarea 
                  id="pdi-customer-requirements"
                  name="customer_requirements"
                  className="input min-h-[56px]" 
                  placeholder="• Mounting accessories: No/Yes • Others:"
                  autocomplete="off"
                />
              </Field>
            </div>
          </div>
        </section>

        <Section title="1. Lifting Inspection">
          <ChecklistTable
            rows={[
              "Shock absorber inspection (no leakage, no damage to the dust cover)",
              "Each ball joint and bearing inspection (no looseness)",
              "Oil seal and oil pan inspection (no leakage)",
            ]}
          />
        </Section>

        <Section title="Signatures">
          <div className="grid md:grid-cols-3 gap-6">
            <SignatureBlock title="Maintenance Technician" hint="expert at mechanical and electrical maintenance" />
            <SignatureBlock title="Maintenance Technical Director" />
            <SignatureBlock title="Delivery Service Manager" hint="new vehicle preparation direction" />
          </div>
        </Section>

        <Section title="Final Status">
          <div className="grid md:grid-cols-3 gap-6">
            <LabelRadio name="final" value="ok" defaultChecked>
              Inspection satisfied or overhaul completed
            </LabelRadio>
            <LabelRadio name="final" value="overhaul">Overhaul needed</LabelRadio>
            <LabelRadio name="final" value="terminal">Terminal needed</LabelRadio>
          </div>
        </Section>

        <Notes />
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: PDIStatus }) {
  const text = status === "complete" ? "Complete" : status === "pending" ? "Pending" : "Not Started";
  const color =
    status === "complete"
      ? "bg-green-50 text-green-700 border-green-200"
      : status === "pending"
      ? "bg-yellow-50 text-yellow-800 border-yellow-200"
      : "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${color}`}>
      <span className="h-2 w-2 rounded-full bg-current opacity-70" />
      {text}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="block">
      <div className="text-sm font-semibold mb-1">{label}:</div>
      <div className="relative">{children}</div>
    </div>
  );
}

function LabelRadio({ name, value, children, defaultChecked }: { name: string; value: string; children: React.ReactNode; defaultChecked?: boolean }) {
  const id = `pdi-radio-${name}-${value}`;
  return (
    <label htmlFor={id} className="inline-flex items-center gap-2 cursor-pointer select-none">
      <input 
        id={id}
        type="radio" 
        name={name} 
        value={value} 
        defaultChecked={defaultChecked} 
        className="radio"
        autocomplete="off"
      />
      <span className="text-sm">{children}</span>
    </label>
  );
}

function ChecklistTable({ rows }: { rows: string[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-3 text-left font-semibold">Item</th>
            <th className="px-4 py-3 w-28 text-center font-semibold">Pass</th>
            <th className="px-4 py-3 w-28 text-center font-semibold">Fail</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((text, i) => (
            <tr key={i} className="border-t border-gray-200">
              <td className="px-4 py-3">{text}</td>
              <td className="px-4 py-3 text-center">
                <input 
                  id={`pdi-check-pass-${i}`}
                  name={`check_pass_${i}`}
                  type="checkbox" 
                  className="checkbox" 
                  aria-label={`Pass: ${text}`}
                  autocomplete="off"
                />
              </td>
              <td className="px-4 py-3 text-center">
                <input 
                  id={`pdi-check-fail-${i}`}
                  name={`check_fail_${i}`}
                  type="checkbox" 
                  className="checkbox" 
                  aria-label={`Fail: ${text}`}
                  autocomplete="off"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SignatureBlock({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="font-semibold">{title}</div>
      {hint && <div className="text-xs text-gray-500 mt-1">{hint}</div>}
      <div className="mt-3 h-28 border border-gray-300 rounded-md bg-gray-50" />
      <div className="mt-3 grid grid-cols-[auto,1fr] items-center gap-2">
        <span className="text-sm">Date:</span>
        <input 
          id={`pdi-signature-date-${title.toLowerCase().replace(/\s+/g, '-')}`}
          name={`signature_date_${title.toLowerCase().replace(/\s+/g, '_')}`}
          type="date" 
          className="input max-w-sm"
          autocomplete="off"
        />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <div className="rounded-t-lg bg-gray-100 px-4 py-3 border border-gray-200 font-semibold">{title}</div>
      <div className="rounded-b-lg border border-t-0 border-gray-200 bg-white p-4">{children}</div>
    </section>
  );
}

function Notes() {
  return (
    <section className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
      <div className="font-semibold mb-2">Notes:</div>
      <ol className="list-decimal ml-5 space-y-1">
        <li>For configuration items not available, enter “*” in the Fail column.</li>
        <li>After tests, mark “X” in the Fail column where applicable.</li>
        <li>Detail non-conformance items in the overhaul column as remarks.</li>
        <li>Items marked with “*” apply only to some models.</li>
      </ol>
    </section>
  );
}



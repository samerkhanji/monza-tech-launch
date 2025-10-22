import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from "@/components/ui/select";
import { Upload, Camera } from "lucide-react";

type CustomsFormValues = {
	status: "paid" | "not paid";
	customsCost?: string;
	shippingCost?: string;
	processedBy?: string;
	paymentDate?: string;
	documentRef?: string;
	notes?: string;
	currentLocation?: string;
	floorBay?: string;
	carStatus?: string;
	conditionOnArrival?: string;
	shippingStatus?: "paid" | "not paid";
	proofFile?: File | null;
	photoFile?: File | null;
};

type Props = {
	value: Partial<CustomsFormValues>;
	onChange: (patch: Partial<CustomsFormValues>) => void;
	onSave?: () => void;
	saving?: boolean;
};

function StatusPill({ status }: { status: "paid" | "not paid" }) {
	const isPaid = status === "paid";
	return (
		<div className="h-8 w-48 rounded-full bg-muted/60 flex items-center px-1">
			<div
				className={
					"h-6 rounded-full flex items-center justify-center px-3 text-sm " +
					(isPaid ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")
				}
				style={{ width: isPaid ? "100%" : "45%" }}
			>
				{isPaid ? "✓ Paid" : "Not Paid"}
			</div>
		</div>
	);
}

export default function CustomsFormV2({ value, onChange, onSave, saving }: Props) {
	const fileRef = React.useRef<HTMLInputElement>(null);
	const photoRef = React.useRef<HTMLInputElement>(null);

	const v: CustomsFormValues = {
		status: "not paid",
		shippingStatus: "not paid",
		conditionOnArrival: "New",
		carStatus: "available",
		currentLocation: value.currentLocation ?? "showroom_floor_1",
		...value,
	} as CustomsFormValues;

	return (
		<div className="space-y-8">
			{/* Customs Payment */}
			<section>
				<h3 className="text-xl font-semibold flex items-center gap-2">
					<span className="inline-flex h-5 w-5 items-center justify-center rounded-full border" />
					Customs Payment
				</h3>

				<Card className="mt-4">
					<CardContent className="pt-6">
						<div className="grid grid-cols-12 gap-4">
							<div className="col-span-12 md:col-span-3">
								<Label>Status</Label>
								<Select
									value={v.status}
									onValueChange={(status: "paid" | "not paid") => onChange({ status })}
								>
									<SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
									<SelectContent>
										<SelectItem value="paid">paid</SelectItem>
										<SelectItem value="not paid">not paid</SelectItem>
									</SelectContent>
								</Select>
								<div className="mt-3">
									<StatusPill status={v.status} />
								</div>
							</div>

							<div className="col-span-12 md:col-span-3">
								<Label>Customs Cost</Label>
								<Input
									inputMode="numeric"
									value={v.customsCost ?? ""}
									onChange={(e) => onChange({ customsCost: e.target.value })}
									placeholder="N/A"
								/>
							</div>

							<div className="col-span-12 md:col-span-3">
								<Label>Shipping Cost</Label>
								<Input
									inputMode="numeric"
									value={v.shippingCost ?? ""}
									onChange={(e) => onChange({ shippingCost: e.target.value })}
									placeholder="N/A"
								/>
							</div>

							<div className="col-span-12 md:col-span-3">
								<Label>Processed By</Label>
								<Input
									value={v.processedBy ?? ""}
									onChange={(e) => onChange({ processedBy: e.target.value })}
									placeholder="N/A"
								/>
							</div>

							<div className="col-span-12 md:col-span-3">
								<Label>Payment Date</Label>
								<Input
									type="date"
									value={v.paymentDate ?? ""}
									onChange={(e) => onChange({ paymentDate: e.target.value })}
								/>
							</div>

							<div className="col-span-12 md:col-span-4">
								<Label>Upload Proof of Payment</Label>
								<div className="flex items-center gap-3">
									<Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
										<Upload className="mr-2 h-4 w-4" /> Upload File
									</Button>
									<span className="text-xs text-muted-foreground">
										JPG, PNG, PDF (Max 10MB)
									</span>
								</div>
								<input
									ref={fileRef}
									type="file"
									accept=".jpg,.jpeg,.png,.pdf"
									className="hidden"
									onChange={(e) => onChange({ proofFile: e.target.files?.[0] ?? null })}
								/>
							</div>

							<div className="col-span-12 md:col-span-3">
								<Label className="invisible block">Take Photo</Label>
								<Button type="button" variant="outline" onClick={() => photoRef.current?.click()}>
									<Camera className="mr-2 h-4 w-4" /> Take Photo
								</Button>
								<input
									ref={photoRef}
									type="file"
									accept="image/*"
									capture="environment"
									className="hidden"
									onChange={(e) => onChange({ photoFile: e.target.files?.[0] ?? null })}
								/>
							</div>
						</div>
					</CardContent>
				</Card>
			</section>

			{/* Location & Inventory */}
			<section>
				<h3 className="text-xl font-semibold flex items-center gap-2">
					<span className="inline-flex h-5 w-5 items-center justify-center rounded-full border" />
					Location & Inventory
				</h3>

				<Card className="mt-4">
					<CardContent className="pt-6">
						<div className="grid grid-cols-12 gap-4">
							<div className="col-span-12 md:col-span-3">
								<Label>Current Location</Label>
								<Input
									value={v.currentLocation ?? ""}
									onChange={(e) => onChange({ currentLocation: e.target.value })}
									placeholder="showroom_floor_1"
								/>
							</div>

							<div className="col-span-12 md:col-span-3">
								<Label>Floor / Bay Number</Label>
								<Input
									value={v.floorBay ?? ""}
									onChange={(e) => onChange({ floorBay: e.target.value })}
									placeholder="N/A"
								/>
							</div>

							<div className="col-span-12 md:col-span-3">
								<Label>Car Status</Label>
								<Input
									value={v.carStatus ?? ""}
									onChange={(e) => onChange({ carStatus: e.target.value })}
									placeholder="available"
								/>
							</div>

							<div className="col-span-12 md:col-span-3">
								<Label>Condition on Arrival</Label>
								<Input
									value={v.conditionOnArrival ?? ""}
									onChange={(e) => onChange({ conditionOnArrival: e.target.value })}
									placeholder="New"
								/>
							</div>

							<div className="col-span-12 md:col-span-4">
								<Label>Shipping Status</Label>
								<div className="flex items-center gap-2">
									<StatusPill status={v.shippingStatus ?? "not paid"} />
									<Select
										value={v.shippingStatus}
										onValueChange={(shippingStatus: "paid" | "not paid") => onChange({ shippingStatus })}
									>
										<SelectTrigger className="w-[160px]"><SelectValue placeholder="Select" /></SelectTrigger>
										<SelectContent>
											<SelectItem value="paid">Paid</SelectItem>
											<SelectItem value="not paid">Not Paid</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						</div>

						<div className="grid grid-cols-12 gap-4 mt-6">
							<div className="col-span-12 md:col-span-6">
								<Label>Document Reference</Label>
								<Input
									value={v.documentRef ?? ""}
									onChange={(e) => onChange({ documentRef: e.target.value })}
									placeholder="Enter document reference number"
								/>
							</div>
							<div className="col-span-12">
								<Label>Notes</Label>
								<Textarea
									rows={4}
									value={v.notes ?? ""}
									onChange={(e) => onChange({ notes: e.target.value })}
									placeholder="Any additional notes about customs processing..."
								/>
							</div>
						</div>

						{/* Save button removed when used within dialog - dialog handles saving */}
					</CardContent>
				</Card>
			</section>
		</div>
	);
}



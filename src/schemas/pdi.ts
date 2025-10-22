import { z } from 'zod';

export const pdiSectionRowSchema = z.object({
  id: z.string(),
  label: z.string(),
  pass: z.boolean().optional(),
  fail: z.boolean().optional(),
  notes: z.string().optional(),
});

export const pdiSectionSchema = z.object({
  key: z.string(),
  title: z.string(),
  rows: z.array(pdiSectionRowSchema),
  overhaulNotes: z.string().optional(),
});

export const pdiChecklistSchema = z.object({
  id: z.string().uuid().optional(),
  vin: z.string().min(5),
  model: z.string().min(1),
  outlet_name: z.string().min(1),
  outlet_number: z.string().min(1),
  estimated_delivery_date: z.string().optional(),
  manufacturing_date: z.string().optional(),
  range_extender_no: z.string().optional(),
  battery_no: z.string().optional(),
  front_motor_no: z.string().optional(),
  rear_motor_no: z.string().optional(),
  market_quality_opt_out: z.boolean().default(false),
  customer_requirements_mounting: z.boolean().default(false),
  customer_requirements_other: z.string().optional(),
  activity_no: z.string().optional(),
  sections: z.array(pdiSectionSchema),
  created_by: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type PdiChecklist = z.infer<typeof pdiChecklistSchema>;

export const pdiVersion = 1 as const;



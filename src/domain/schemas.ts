import { z } from "zod";

export const CreateIncidentSchema = z.object({
  load_ref: z.string().min(1, "Load reference is required"),
  carrier: z.string().min(1, "Carrier is required"),
  origin: z.string().min(1, "Origin is required"),
  destination: z.string().min(1, "Destination is required"),
  dock_name: z.string().min(1, "Dock name is required"),
  dock_contact_name: z.string().min(1, "Dock contact is required"),
  dock_phone: z.string().min(1, "Dock phone is required"),
  driver_contact_name: z.string().min(1, "Driver contact is required"),
  driver_phone: z.string().min(1, "Driver phone is required"),
  original_appointment: z.string().datetime({ offset: true }),
  updated_eta: z.string().datetime({ offset: true }),
});

export const AuthorizeIncidentSchema = z.object({
  earliest_time: z.string().datetime({ offset: true }),
  latest_time: z.string().datetime({ offset: true }),
  timezone: z.string().min(1, "Timezone is required"),
  fee_ceiling: z.number().nonnegative(),
  currency: z.string().length(3).default("USD"),
  budget: z.number().int().positive().max(2).default(2),
  allow_selection_inside_interval: z.boolean().default(true),
  expires_at: z.string().datetime({ offset: true }),
});

export const DriverObservationSchema = z.object({
  verified_interval_start: z.string().datetime({ offset: true }),
  verified_interval_end: z.string().datetime({ offset: true }),
  selection_permitted: z.boolean(),
  evidence_text: z.array(z.string()).min(1),
  raw_transcript_snippet: z.string().optional(),
});

export const DockObservationSchema = z.object({
  confirmed_time: z.string().datetime({ offset: true }),
  door: z.string().optional(),
  fee_amount: z.number().nonnegative().default(0),
  fee_currency: z.string().length(3).default("USD"),
  conditions: z.string().optional(),
  confirmation_basis: z.string().min(1),
  evidence_text: z.array(z.string()).min(1),
  raw_transcript_snippet: z.string().optional(),
});

export const AcknowledgeHandoffSchema = z.object({
  token: z.string().min(16),
});

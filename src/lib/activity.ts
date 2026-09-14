import { prisma } from "@/lib/prisma";

export const ACTIVITY_TYPES = {
  CONTACT_CREATED: "contact_created",
  NOTE_UPDATED: "note_updated",
  DEAL_CREATED: "deal_created",
  DEAL_STAGE_CHANGED: "deal_stage_changed",
  TASK_CREATED: "task_created",
  TASK_COMPLETED: "task_completed",
  LEAD_MAGNET_DOWNLOADED: "lead_magnet_downloaded",
  BOOKING_CREATED: "booking_created",
  BOOKING_CANCELLED: "booking_cancelled",
  EMAIL_SENT: "email_sent",
} as const;

export async function logActivity(
  contactId: string,
  type: string,
  description: string
): Promise<void> {
  await prisma.activityLogEntry.create({ data: { contactId, type, description } });
}

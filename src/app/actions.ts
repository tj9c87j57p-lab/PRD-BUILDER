"use server";

import { prisma } from "@/lib/prisma";
import { logActivity, ACTIVITY_TYPES } from "@/lib/activity";

export interface SubmitLeadMagnetState {
  error?: string;
  downloadUrl?: string;
}

export async function submitLeadMagnet(
  _prevState: SubmitLeadMagnetState | undefined,
  formData: FormData
): Promise<SubmitLeadMagnetState> {
  const leadMagnetId = String(formData.get("leadMagnetId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!leadMagnetId) {
    return { error: "Something went wrong. Please refresh and try again." };
  }
  if (!name) {
    return { error: "Enter your name." };
  }
  if (!email) {
    return { error: "Enter your email." };
  }

  const leadMagnet = await prisma.leadMagnet.findUnique({
    where: { id: leadMagnetId },
  });
  if (!leadMagnet || !leadMagnet.active) {
    return { error: "This download is no longer available." };
  }

  const tag = leadMagnet.title;

  const existing = await prisma.contact.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  let contactId: string;
  if (existing) {
    contactId = existing.id;
    await prisma.contact.update({
      where: { id: existing.id },
      data: {
        lastContactAt: new Date(),
        tags: existing.tags.includes(tag) ? existing.tags : [...existing.tags, tag],
      },
    });
  } else {
    const created = await prisma.contact.create({
      data: {
        name,
        email,
        source: leadMagnet.title,
        tags: [tag],
        lastContactAt: new Date(),
      },
    });
    contactId = created.id;
    await logActivity(contactId, ACTIVITY_TYPES.CONTACT_CREATED, "Contact added");
  }

  await prisma.leadMagnetSubmission.create({
    data: { leadMagnetId, contactId },
  });
  await logActivity(
    contactId,
    ACTIVITY_TYPES.LEAD_MAGNET_DOWNLOADED,
    `Downloaded ${leadMagnet.title}`
  );

  return { downloadUrl: leadMagnet.fileUrl };
}

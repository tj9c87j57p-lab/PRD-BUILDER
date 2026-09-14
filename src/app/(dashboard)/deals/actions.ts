"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dollarsToCents } from "@/lib/money";
import { logActivity, ACTIVITY_TYPES } from "@/lib/activity";

export interface DealFormState {
  error?: string;
}

function parseOptionalString(raw: FormDataEntryValue | null): string | null {
  const value = String(raw ?? "").trim();
  return value ? value : null;
}

function parseOptionalDate(raw: FormDataEntryValue | null): Date | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isPrismaKnownError(
  error: unknown
): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

function dealDataFromForm(formData: FormData) {
  const contactId = String(formData.get("contactId") ?? "").trim();
  const stageId = String(formData.get("stageId") ?? "").trim();
  const valueCents = dollarsToCents(String(formData.get("value") ?? ""));
  const expectedCloseDate = parseOptionalDate(
    formData.get("expectedCloseDate")
  );
  const notes = parseOptionalString(formData.get("notes"));

  return { contactId, stageId, valueCents, expectedCloseDate, notes };
}

export async function createDeal(
  _prevState: DealFormState | undefined,
  formData: FormData
): Promise<DealFormState> {
  const { contactId, stageId, valueCents, expectedCloseDate, notes } =
    dealDataFromForm(formData);

  if (!contactId) {
    return { error: "Choose a contact." };
  }
  if (!stageId) {
    return { error: "Choose a stage." };
  }
  if (valueCents === null) {
    return { error: "Enter a valid dollar value." };
  }

  const deal = await prisma.deal.create({
    data: { contactId, stageId, valueCents, expectedCloseDate, notes },
  });

  const stage = await prisma.stage.findUnique({ where: { id: stageId } });
  await logActivity(
    contactId,
    ACTIVITY_TYPES.DEAL_CREATED,
    `Deal created${stage ? ` in ${stage.name}` : ""}`
  );

  redirect(`/deals/${deal.id}`);
}

export async function updateDeal(
  _prevState: DealFormState | undefined,
  formData: FormData
): Promise<DealFormState> {
  const id = String(formData.get("id") ?? "");
  const { contactId, stageId, valueCents, expectedCloseDate, notes } =
    dealDataFromForm(formData);

  if (!id) {
    return { error: "Missing deal id." };
  }
  if (!contactId) {
    return { error: "Choose a contact." };
  }
  if (!stageId) {
    return { error: "Choose a stage." };
  }
  if (valueCents === null) {
    return { error: "Enter a valid dollar value." };
  }

  const existing = await prisma.deal.findUnique({ where: { id } });
  if (!existing) {
    return { error: "Deal not found." };
  }

  const stageChanged = existing.stageId !== stageId;

  await prisma.deal.update({
    where: { id },
    data: {
      contactId,
      stageId,
      valueCents,
      expectedCloseDate,
      notes,
      stageEnteredAt: stageChanged ? new Date() : existing.stageEnteredAt,
    },
  });

  if (stageChanged) {
    const stage = await prisma.stage.findUnique({ where: { id: stageId } });
    if (stage) {
      await logActivity(
        contactId,
        ACTIVITY_TYPES.DEAL_STAGE_CHANGED,
        `Moved to ${stage.name}`
      );
    }
  }

  redirect(`/deals/${id}`);
}

export async function deleteDeal(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return;
  }

  await prisma.deal.delete({ where: { id } });

  redirect("/deals");
}

export async function moveDeal(
  dealId: string,
  newStageId: string
): Promise<{ error?: string }> {
  if (!dealId || !newStageId) {
    return { error: "Missing deal or stage id." };
  }

  try {
    const deal = await prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal) {
      return { error: "Deal not found." };
    }
    if (deal.stageId === newStageId) {
      return {};
    }

    await prisma.deal.update({
      where: { id: dealId },
      data: { stageId: newStageId, stageEnteredAt: new Date() },
    });

    const stage = await prisma.stage.findUnique({ where: { id: newStageId } });
    if (stage) {
      await logActivity(
        deal.contactId,
        ACTIVITY_TYPES.DEAL_STAGE_CHANGED,
        `Moved to ${stage.name}`
      );
    }

    revalidatePath("/deals");
    return {};
  } catch {
    return { error: "Could not move deal. Please try again." };
  }
}

export async function createStage(name: string): Promise<{ error?: string }> {
  const trimmed = name.trim();
  if (!trimmed) {
    return { error: "Enter a stage name." };
  }

  const last = await prisma.stage.findFirst({ orderBy: { position: "desc" } });
  const position = last ? last.position + 1 : 0;

  await prisma.stage.create({ data: { name: trimmed, position } });

  revalidatePath("/deals");
  return {};
}

export async function renameStage(
  stageId: string,
  name: string
): Promise<{ error?: string }> {
  const trimmed = name.trim();
  if (!stageId) {
    return { error: "Missing stage id." };
  }
  if (!trimmed) {
    return { error: "Stage name can't be empty." };
  }

  await prisma.stage.update({
    where: { id: stageId },
    data: { name: trimmed },
  });

  revalidatePath("/deals");
  return {};
}

export async function deleteStage(stageId: string): Promise<{ error?: string }> {
  if (!stageId) {
    return { error: "Missing stage id." };
  }

  const [stageCount, dealCount] = await Promise.all([
    prisma.stage.count(),
    prisma.deal.count({ where: { stageId } }),
  ]);

  if (stageCount <= 1) {
    return { error: "Can't delete the last remaining stage." };
  }
  if (dealCount > 0) {
    return {
      error: `Can't delete — ${dealCount} deal(s) are still in this stage.`,
    };
  }

  try {
    await prisma.stage.delete({ where: { id: stageId } });
    revalidatePath("/deals");
    return {};
  } catch (error) {
    if (isPrismaKnownError(error) && error.code === "P2003") {
      return { error: "Can't delete — deals still reference this stage." };
    }
    return { error: "Could not delete stage. Please try again." };
  }
}

export async function reorderStages(
  orderedIds: string[]
): Promise<{ error?: string }> {
  if (!orderedIds.length) {
    return { error: "Missing stage order." };
  }

  await prisma.$transaction(
    orderedIds.map((id, position) =>
      prisma.stage.update({ where: { id }, data: { position } })
    )
  );

  revalidatePath("/deals");
  return {};
}

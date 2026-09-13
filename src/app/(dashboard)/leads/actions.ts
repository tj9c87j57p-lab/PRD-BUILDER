"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/storage";

export interface LeadMagnetFormState {
  error?: string;
}

export async function createLeadMagnet(
  _prevState: LeadMagnetFormState | undefined,
  formData: FormData
): Promise<LeadMagnetFormState> {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const active = formData.get("active") === "on";
  const pdfFile = formData.get("pdfFile") as File | null;
  const coverImageFile = formData.get("coverImageFile") as File | null;

  if (!title) {
    return { error: "Enter a title." };
  }
  if (!description) {
    return { error: "Enter a description." };
  }
  if (!pdfFile || pdfFile.size === 0) {
    return { error: "Upload a PDF file." };
  }
  if (pdfFile.type !== "application/pdf") {
    return { error: "The lead magnet file must be a PDF." };
  }

  const fileUrl = await saveUploadedFile(pdfFile, "pdf");
  const coverImageUrl =
    coverImageFile && coverImageFile.size > 0
      ? await saveUploadedFile(coverImageFile, "cover")
      : null;

  await prisma.leadMagnet.create({
    data: { title, description, fileUrl, coverImageUrl, active },
  });

  revalidatePath("/");
  redirect("/leads");
}

export async function updateLeadMagnet(
  _prevState: LeadMagnetFormState | undefined,
  formData: FormData
): Promise<LeadMagnetFormState> {
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const active = formData.get("active") === "on";
  const pdfFile = formData.get("pdfFile") as File | null;
  const coverImageFile = formData.get("coverImageFile") as File | null;

  if (!id) {
    return { error: "Missing lead magnet id." };
  }
  if (!title) {
    return { error: "Enter a title." };
  }
  if (!description) {
    return { error: "Enter a description." };
  }

  const existing = await prisma.leadMagnet.findUnique({ where: { id } });
  if (!existing) {
    return { error: "Lead magnet not found." };
  }

  let fileUrl = existing.fileUrl;
  if (pdfFile && pdfFile.size > 0) {
    if (pdfFile.type !== "application/pdf") {
      return { error: "The lead magnet file must be a PDF." };
    }
    fileUrl = await saveUploadedFile(pdfFile, "pdf");
  }

  let coverImageUrl = existing.coverImageUrl;
  if (coverImageFile && coverImageFile.size > 0) {
    coverImageUrl = await saveUploadedFile(coverImageFile, "cover");
  }

  await prisma.leadMagnet.update({
    where: { id },
    data: { title, description, fileUrl, coverImageUrl, active },
  });

  revalidatePath("/");
  redirect("/leads");
}

export async function toggleLeadMagnetActive(
  id: string
): Promise<{ error?: string }> {
  if (!id) {
    return { error: "Missing lead magnet id." };
  }

  const existing = await prisma.leadMagnet.findUnique({ where: { id } });
  if (!existing) {
    return { error: "Lead magnet not found." };
  }

  await prisma.leadMagnet.update({
    where: { id },
    data: { active: !existing.active },
  });

  revalidatePath("/leads");
  revalidatePath("/");
  return {};
}

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/storage";

export interface TestimonialFormState {
  error?: string;
}

export async function createTestimonial(
  _prevState: TestimonialFormState | undefined,
  formData: FormData
): Promise<TestimonialFormState> {
  const clientName = String(formData.get("clientName") ?? "").trim();
  const quote = String(formData.get("quote") ?? "").trim();
  const active = formData.get("active") === "on";
  const beforePhotoFile = formData.get("beforePhotoFile") as File | null;
  const afterPhotoFile = formData.get("afterPhotoFile") as File | null;

  if (!clientName) {
    return { error: "Enter the client's name." };
  }
  if (!quote) {
    return { error: "Enter a testimonial quote." };
  }

  const beforePhotoUrl =
    beforePhotoFile && beforePhotoFile.size > 0
      ? await saveUploadedFile(beforePhotoFile, "testimonials/before")
      : null;
  const afterPhotoUrl =
    afterPhotoFile && afterPhotoFile.size > 0
      ? await saveUploadedFile(afterPhotoFile, "testimonials/after")
      : null;

  await prisma.testimonial.create({
    data: { clientName, quote, beforePhotoUrl, afterPhotoUrl, active },
  });

  revalidatePath("/");
  redirect("/testimonials");
}

export async function updateTestimonial(
  _prevState: TestimonialFormState | undefined,
  formData: FormData
): Promise<TestimonialFormState> {
  const id = String(formData.get("id") ?? "");
  const clientName = String(formData.get("clientName") ?? "").trim();
  const quote = String(formData.get("quote") ?? "").trim();
  const active = formData.get("active") === "on";
  const beforePhotoFile = formData.get("beforePhotoFile") as File | null;
  const afterPhotoFile = formData.get("afterPhotoFile") as File | null;

  if (!id) {
    return { error: "Missing testimonial id." };
  }
  if (!clientName) {
    return { error: "Enter the client's name." };
  }
  if (!quote) {
    return { error: "Enter a testimonial quote." };
  }

  const existing = await prisma.testimonial.findUnique({ where: { id } });
  if (!existing) {
    return { error: "Testimonial not found." };
  }

  let beforePhotoUrl = existing.beforePhotoUrl;
  if (beforePhotoFile && beforePhotoFile.size > 0) {
    beforePhotoUrl = await saveUploadedFile(beforePhotoFile, "testimonials/before");
  }

  let afterPhotoUrl = existing.afterPhotoUrl;
  if (afterPhotoFile && afterPhotoFile.size > 0) {
    afterPhotoUrl = await saveUploadedFile(afterPhotoFile, "testimonials/after");
  }

  await prisma.testimonial.update({
    where: { id },
    data: { clientName, quote, beforePhotoUrl, afterPhotoUrl, active },
  });

  revalidatePath("/");
  redirect("/testimonials");
}

export async function toggleTestimonialActive(
  id: string
): Promise<{ error?: string }> {
  if (!id) {
    return { error: "Missing testimonial id." };
  }

  const existing = await prisma.testimonial.findUnique({ where: { id } });
  if (!existing) {
    return { error: "Testimonial not found." };
  }

  await prisma.testimonial.update({
    where: { id },
    data: { active: !existing.active },
  });

  revalidatePath("/testimonials");
  revalidatePath("/");
  return {};
}

export async function deleteTestimonial(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return;
  }

  await prisma.testimonial.delete({ where: { id } });

  revalidatePath("/testimonials");
  revalidatePath("/");
  redirect("/testimonials");
}

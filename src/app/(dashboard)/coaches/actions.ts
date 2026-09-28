"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export interface CoachFormState {
  error?: string;
}

export async function createCoach(
  _prevState: CoachFormState | undefined,
  formData: FormData
): Promise<CoachFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const googleRefreshToken =
    String(formData.get("googleRefreshToken") ?? "").trim() || null;
  const active = formData.get("active") === "on";

  if (!name) {
    return { error: "Enter the coach's name." };
  }
  if (!email) {
    return { error: "Enter the coach's email." };
  }

  const existing = await prisma.coach.findUnique({ where: { email } });
  if (existing) {
    return { error: "A coach with that email already exists." };
  }

  await prisma.coach.create({
    data: { name, email, googleRefreshToken, active },
  });

  revalidatePath("/coaches");
  revalidatePath("/book");
  redirect("/coaches");
}

export async function updateCoach(
  _prevState: CoachFormState | undefined,
  formData: FormData
): Promise<CoachFormState> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const googleRefreshTokenRaw = String(
    formData.get("googleRefreshToken") ?? ""
  ).trim();
  const active = formData.get("active") === "on";

  if (!id) {
    return { error: "Missing coach id." };
  }
  if (!name) {
    return { error: "Enter the coach's name." };
  }
  if (!email) {
    return { error: "Enter the coach's email." };
  }

  const existing = await prisma.coach.findUnique({ where: { id } });
  if (!existing) {
    return { error: "Coach not found." };
  }

  const emailTaken = await prisma.coach.findFirst({
    where: { email, NOT: { id } },
  });
  if (emailTaken) {
    return { error: "A coach with that email already exists." };
  }

  // Leave the existing refresh token in place if the field was left blank
  // (masked/never redisplayed) rather than accidentally clearing it.
  const googleRefreshToken = googleRefreshTokenRaw || existing.googleRefreshToken;

  await prisma.coach.update({
    where: { id },
    data: { name, email, googleRefreshToken, active },
  });

  revalidatePath("/coaches");
  revalidatePath("/bookings");
  revalidatePath("/book");
  redirect("/coaches");
}

export async function toggleCoachActive(id: string): Promise<{ error?: string }> {
  if (!id) {
    return { error: "Missing coach id." };
  }

  const existing = await prisma.coach.findUnique({ where: { id } });
  if (!existing) {
    return { error: "Coach not found." };
  }

  await prisma.coach.update({
    where: { id },
    data: { active: !existing.active },
  });

  revalidatePath("/coaches");
  revalidatePath("/book");
  return {};
}

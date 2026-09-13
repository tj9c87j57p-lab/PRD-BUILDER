"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface ContactFormState {
  error?: string;
}

function parseTags(raw: FormDataEntryValue | null): string[] {
  return String(raw ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
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

function contactDataFromForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    email: parseOptionalString(formData.get("email")),
    phone: parseOptionalString(formData.get("phone")),
    instagramHandle: parseOptionalString(formData.get("instagramHandle")),
    source: parseOptionalString(formData.get("source")),
    tags: parseTags(formData.get("tags")),
    notes: parseOptionalString(formData.get("notes")),
    lastContactAt: parseOptionalDate(formData.get("lastContactAt")),
  };
}

export async function createContact(
  _prevState: ContactFormState | undefined,
  formData: FormData
): Promise<ContactFormState> {
  const data = contactDataFromForm(formData);

  if (!data.name) {
    return { error: "Name is required." };
  }

  const contact = await prisma.contact.create({ data });

  redirect(`/contacts/${contact.id}`);
}

export async function updateContact(
  _prevState: ContactFormState | undefined,
  formData: FormData
): Promise<ContactFormState> {
  const id = String(formData.get("id") ?? "");
  const data = contactDataFromForm(formData);

  if (!id) {
    return { error: "Missing contact id." };
  }

  if (!data.name) {
    return { error: "Name is required." };
  }

  await prisma.contact.update({ where: { id }, data });

  redirect(`/contacts/${id}`);
}

export async function deleteContact(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return;
  }

  try {
    await prisma.contact.delete({ where: { id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      redirect(`/contacts/${id}?deleteError=1`);
    }
    throw error;
  }

  redirect("/contacts");
}

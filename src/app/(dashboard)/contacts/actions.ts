"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logActivity, ACTIVITY_TYPES } from "@/lib/activity";
import { sendEmail } from "@/lib/email";

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
  await logActivity(contact.id, ACTIVITY_TYPES.CONTACT_CREATED, "Contact added");

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

  const existing = await prisma.contact.findUnique({ where: { id } });
  if (!existing) {
    return { error: "Contact not found." };
  }

  await prisma.contact.update({ where: { id }, data });

  if (data.notes !== existing.notes) {
    await logActivity(id, ACTIVITY_TYPES.NOTE_UPDATED, "Notes updated");
  }

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

export interface SendEmailFormState {
  error?: string;
  success?: boolean;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendContactEmail(
  _prevState: SendEmailFormState | undefined,
  formData: FormData
): Promise<SendEmailFormState> {
  const contactId = String(formData.get("contactId") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!contactId) {
    return { error: "Missing contact id." };
  }
  if (!subject) {
    return { error: "Enter a subject." };
  }
  if (!body) {
    return { error: "Enter a message." };
  }

  const contact = await prisma.contact.findUnique({ where: { id: contactId } });
  if (!contact) {
    return { error: "Contact not found." };
  }
  if (!contact.email) {
    return { error: "This contact has no email address on file." };
  }

  const html = escapeHtml(body)
    .split("\n")
    .map((line) => `<p>${line || "&nbsp;"}</p>`)
    .join("");

  await sendEmail({
    to: contact.email,
    subject,
    html,
    replyTo: process.env.ADMIN_EMAIL,
  });

  await logActivity(contactId, ACTIVITY_TYPES.EMAIL_SENT, `Sent email: ${subject}`);

  revalidatePath(`/contacts/${contactId}`);
  return { success: true };
}

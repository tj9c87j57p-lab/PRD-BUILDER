"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseDateTimeInput } from "@/lib/dates";

export interface TaskFormState {
  error?: string;
}

function parseOptionalId(raw: FormDataEntryValue | null): string | null {
  const value = String(raw ?? "").trim();
  return value ? value : null;
}

function taskDataFromForm(formData: FormData) {
  return {
    description: String(formData.get("description") ?? "").trim(),
    dueAt: parseDateTimeInput(formData.get("dueAt")),
    contactId: parseOptionalId(formData.get("contactId")),
    dealId: parseOptionalId(formData.get("dealId")),
  };
}

export async function createTask(
  _prevState: TaskFormState | undefined,
  formData: FormData
): Promise<TaskFormState> {
  const { description, dueAt, contactId, dealId } = taskDataFromForm(formData);

  if (!description) {
    return { error: "Enter a description." };
  }
  if (!dueAt) {
    return { error: "Enter a valid due date and time." };
  }

  await prisma.task.create({
    data: { description, dueAt, contactId, dealId },
  });

  if (contactId) {
    redirect(`/contacts/${contactId}`);
  }
  if (dealId) {
    redirect(`/deals/${dealId}`);
  }
  redirect("/tasks");
}

export async function updateTask(
  _prevState: TaskFormState | undefined,
  formData: FormData
): Promise<TaskFormState> {
  const id = String(formData.get("id") ?? "");
  const { description, dueAt, contactId, dealId } = taskDataFromForm(formData);
  const completed = formData.get("completed") === "on";

  if (!id) {
    return { error: "Missing task id." };
  }
  if (!description) {
    return { error: "Enter a description." };
  }
  if (!dueAt) {
    return { error: "Enter a valid due date and time." };
  }

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) {
    return { error: "Task not found." };
  }

  const completedAt = completed
    ? (existing.completedAt ?? new Date())
    : null;

  await prisma.task.update({
    where: { id },
    data: { description, dueAt, contactId, dealId, completedAt },
  });

  redirect("/tasks");
}

export async function deleteTask(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return;
  }

  await prisma.task.delete({ where: { id } });

  redirect("/tasks");
}

export async function completeTask(
  taskId: string
): Promise<{ error?: string }> {
  if (!taskId) {
    return { error: "Missing task id." };
  }

  try {
    const task = await prisma.task.update({
      where: { id: taskId },
      data: { completedAt: new Date() },
      select: { contactId: true, dealId: true },
    });

    revalidatePath("/tasks");
    if (task.contactId) {
      revalidatePath(`/contacts/${task.contactId}`);
    }
    if (task.dealId) {
      revalidatePath(`/deals/${task.dealId}`);
    }
    return {};
  } catch {
    return { error: "Could not complete task. Please try again." };
  }
}

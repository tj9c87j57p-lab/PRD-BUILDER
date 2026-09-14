import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    tag?: string;
    source?: string;
    booked?: string;
  }>;
}) {
  const { q, tag, source, booked } = await searchParams;

  const where: Prisma.ContactWhereInput = {};

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ];
  }
  if (tag) {
    where.tags = { has: tag };
  }
  if (source) {
    where.source = source;
  }
  if (booked === "no") {
    where.bookings = { none: {} };
  } else if (booked === "yes") {
    where.bookings = { some: {} };
  }

  const [contacts, tagRows, sourceGroups] = await Promise.all([
    prisma.contact.findMany({ where, orderBy: { createdAt: "desc" } }),
    prisma.contact.findMany({ select: { tags: true } }),
    prisma.contact.groupBy({ by: ["source"] }),
  ]);

  const allTags = Array.from(
    new Set(tagRows.flatMap((row) => row.tags))
  ).sort();
  const allSources = sourceGroups
    .map((group) => group.source)
    .filter((value): value is string => Boolean(value))
    .sort();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Contacts
        </h1>
        <Link
          href="/contacts/new"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          Add Contact
        </Link>
      </div>

      <form className="mt-6 flex flex-wrap items-end gap-3" action="/contacts">
        <div>
          <label
            htmlFor="q"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted"
          >
            Search
          </label>
          <input
            id="q"
            name="q"
            type="text"
            defaultValue={q ?? ""}
            placeholder="Name, email, or phone"
            className="w-56 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </div>
        <div>
          <label
            htmlFor="tag"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted"
          >
            Tag
          </label>
          <select
            id="tag"
            name="tag"
            defaultValue={tag ?? ""}
            className="w-44 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          >
            <option value="">All tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="source"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted"
          >
            Source
          </label>
          <select
            id="source"
            name="source"
            defaultValue={source ?? ""}
            className="w-44 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          >
            <option value="">All sources</option>
            {allSources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="booked"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted"
          >
            Booking status
          </label>
          <select
            id="booked"
            name="booked"
            defaultValue={booked ?? ""}
            className="w-44 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          >
            <option value="">Any booking status</option>
            <option value="yes">Has booked a call</option>
            <option value="no">Never booked</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-accent"
        >
          Filter
        </button>
        {q || tag || source || booked ? (
          <Link
            href="/contacts"
            className="text-sm text-muted underline-offset-2 hover:text-foreground hover:underline"
          >
            Clear filters
          </Link>
        ) : null}
      </form>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email / Phone</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Tags</th>
            </tr>
          </thead>
          <tbody>
            {contacts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted">
                  No contacts found.
                </td>
              </tr>
            ) : (
              contacts.map((contact) => (
                <tr
                  key={contact.id}
                  className="border-b border-border last:border-b-0 hover:bg-background"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/contacts/${contact.id}`}
                      className="font-medium text-foreground hover:text-accent"
                    >
                      {contact.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {contact.email || contact.phone || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {contact.source || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {contact.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-border px-2 py-0.5 text-xs text-muted"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

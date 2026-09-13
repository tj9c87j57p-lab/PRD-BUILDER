"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/(dashboard)/actions";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/contacts", label: "Contacts" },
  { href: "/deals", label: "Deals" },
  { href: "/tasks", label: "Tasks" },
  { href: "/bookings", label: "Bookings" },
  { href: "/leads", label: "Leads" },
] as const;

export function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted hover:bg-surface hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <div className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
        <span className="text-lg font-semibold tracking-tight text-foreground">
          Precision Coach
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground"
          aria-label="Toggle navigation"
        >
          Menu
        </button>
      </div>

      {open ? (
        <div className="flex flex-col gap-4 border-b border-border bg-background px-4 py-4 md:hidden">
          {nav}
          <LogoutButton />
        </div>
      ) : null}

      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-background px-4 py-6 md:flex">
        <span className="mb-6 px-3 text-lg font-semibold tracking-tight text-foreground">
          Precision Coach
        </span>
        {nav}
        <div className="mt-auto flex flex-col gap-3 border-t border-border pt-4">
          <span className="truncate px-3 text-xs text-muted">{userName}</span>
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}

function LogoutButton() {
  return (
    <form action={logout} className="px-3">
      <button
        type="submit"
        className="w-full rounded-md border border-border px-3 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-foreground"
      >
        Log out
      </button>
    </form>
  );
}

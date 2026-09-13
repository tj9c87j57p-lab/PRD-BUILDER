"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/(auth)/login/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form
      action={formAction}
      className="w-full max-w-sm rounded-lg border border-border bg-surface p-8"
    >
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Precision Coach
      </h1>
      <p className="mt-1 text-sm text-muted">Sign in to your CRM.</p>

      <div className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
          />
        </div>
      </div>

      {state?.error ? (
        <p className="mt-4 text-sm text-red-400">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-md bg-accent px-4 py-2 font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

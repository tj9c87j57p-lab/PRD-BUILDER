"use client";

import { useActionState } from "react";
import type { Deal } from "@prisma/client";
import {
  createDeal,
  updateDeal,
  type DealFormState,
} from "@/app/(dashboard)/deals/actions";
import { centsToDollarsInput } from "@/lib/money";

const initialState: DealFormState = {};

function toDateInputValue(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

const fieldClasses =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent";
const labelClasses =
  "mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted";

export function DealForm({
  deal,
  contacts,
  stages,
}: {
  deal?: Deal;
  contacts: { id: string; name: string }[];
  stages: { id: string; name: string }[];
}) {
  const action = deal ? updateDeal : createDeal;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="w-full max-w-xl rounded-lg border border-border bg-surface p-8"
    >
      {deal ? <input type="hidden" name="id" value={deal.id} /> : null}

      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {deal ? "Edit Deal" : "Add Deal"}
      </h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="contactId" className={labelClasses}>
            Contact
          </label>
          <select
            id="contactId"
            name="contactId"
            required
            defaultValue={deal?.contactId ?? ""}
            className={fieldClasses}
          >
            <option value="" disabled>
              Select a contact
            </option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="stageId" className={labelClasses}>
            Stage
          </label>
          <select
            id="stageId"
            name="stageId"
            required
            defaultValue={deal?.stageId ?? stages[0]?.id ?? ""}
            className={fieldClasses}
          >
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="value" className={labelClasses}>
            Value
          </label>
          <input
            id="value"
            name="value"
            type="text"
            inputMode="decimal"
            placeholder="1200.00"
            defaultValue={
              deal ? centsToDollarsInput(deal.valueCents) : ""
            }
            className={fieldClasses}
          />
        </div>
        <div>
          <label htmlFor="expectedCloseDate" className={labelClasses}>
            Expected close date
          </label>
          <input
            id="expectedCloseDate"
            name="expectedCloseDate"
            type="date"
            defaultValue={toDateInputValue(deal?.expectedCloseDate)}
            className={fieldClasses}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="notes" className={labelClasses}>
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            defaultValue={deal?.notes ?? ""}
            className={fieldClasses}
          />
        </div>
      </div>

      {state?.error ? (
        <p className="mt-4 text-sm text-red-400">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-md bg-accent px-4 py-2 font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Saving…" : deal ? "Save changes" : "Add deal"}
      </button>
    </form>
  );
}

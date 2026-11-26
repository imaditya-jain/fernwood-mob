import { useMemo, useState } from "react";

import { earliestDeliveryDate, latestDeliveryDate } from "@/lib/gift";
import { bouquetDeliverySchema, giftAttributes, giftSchema } from "@/lib/gift-schemas";

export type GiftValues = { recipient: string; address: string; phone: string; date: string; message: string; from: string };

/** Every selectable delivery date with a short label ("Fri 12 Dec"). */
export function deliveryDates(): { value: string; day: string; date: string }[] {
  const out: { value: string; day: string; date: string }[] = [];
  const last = latestDeliveryDate();
  for (let value = earliestDeliveryDate(); value <= last; ) {
    const d = new Date(`${value}T12:00:00Z`);
    out.push({
      value,
      day: new Intl.DateTimeFormat("en-IN", { weekday: "short", timeZone: "UTC" }).format(d),
      date: new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }).format(d),
    });
    d.setUTCDate(d.getUTCDate() + 1);
    value = d.toISOString().slice(0, 10);
  }
  return out;
}

/** State and validation of the gift options, shared by the product screen's form and its bottom "Add to cart" bar. */
export function useGiftForm(bouquet: boolean) {
  const [values, setValues] = useState<GiftValues>({ recipient: "", address: "", phone: "", date: "", message: "", from: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dates = useMemo(() => (bouquet ? deliveryDates() : []), [bouquet]);
  const set = (key: keyof GiftValues) => (value: string) => setValues((current) => ({ ...current, [key]: value }));

  /** Returns the order-line attributes when everything is valid; otherwise shows the errors and returns null. */
  const validate = (): { key: string; value: string }[] | null => {
    const message = values.message || undefined;
    const from = values.from || undefined;
    const parsed = bouquet
      ? bouquetDeliverySchema.safeParse({ kind: "bouquet", ...values, message, from })
      : giftSchema.safeParse({ kind: "message", message, from });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      return null;
    }
    setErrors({});
    return giftAttributes(parsed.data);
  };

  return { values, set, errors, dates, validate };
}

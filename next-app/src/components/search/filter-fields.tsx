"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { CheckboxChip } from "@/components/ui/checkbox-chip";
import { Input } from "@/components/ui/input";
import { AMENITIES, GENDER_OPTIONS, SHARING_TYPES } from "@/lib/constants";
import { BUDGET_PRESETS, type FilterState } from "./search-url";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-3 border-b pb-5 last:border-b-0 last:pb-0">
      <legend className="mb-3 text-sm font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

function toNumber(value: string): number | undefined {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return undefined;
  return Math.min(500000, Number(digits));
}

/** All refinement controls. Used by the desktop sidebar and the mobile sheet. */
export function FilterFields({
  value,
  onChange,
}: {
  value: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
}) {
  const id = useId();
  const [minStr, setMinStr] = useState(value.minRent?.toString() ?? "");
  const [maxStr, setMaxStr] = useState(value.maxRent?.toString() ?? "");

  useEffect(() => {
    setMinStr(value.minRent?.toString() ?? "");
    setMaxStr(value.maxRent?.toString() ?? "");
  }, [value.minRent, value.maxRent]);

  const commitBudget = () => {
    let min = toNumber(minStr);
    let max = toNumber(maxStr);
    if (min !== undefined && max !== undefined && min > max) [min, max] = [max, min];
    if (min !== value.minRent || max !== value.maxRent) onChange({ minRent: min, maxRent: max });
  };

  const amenities = value.amenities ?? [];

  return (
    <div className="space-y-5">
      <Section title="PG for">
        <div className="flex flex-wrap gap-2">
          {GENDER_OPTIONS.map((g) => (
            <CheckboxChip
              key={g.value}
              checked={value.gender === g.value}
              onCheckedChange={(checked) => onChange({ gender: checked ? g.value : undefined })}
            >
              {g.label}
            </CheckboxChip>
          ))}
        </div>
      </Section>

      <Section title="Monthly budget">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label htmlFor={`${id}-min`} className="text-xs text-muted-foreground">
              Min (₹)
            </label>
            <Input
              id={`${id}-min`}
              inputMode="numeric"
              placeholder="No min"
              value={minStr}
              onChange={(e) => setMinStr(e.target.value.replace(/[^\d]/g, ""))}
              onBlur={commitBudget}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitBudget();
                }
              }}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor={`${id}-max`} className="text-xs text-muted-foreground">
              Max (₹)
            </label>
            <Input
              id={`${id}-max`}
              inputMode="numeric"
              placeholder="No max"
              value={maxStr}
              onChange={(e) => setMaxStr(e.target.value.replace(/[^\d]/g, ""))}
              onBlur={commitBudget}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitBudget();
                }
              }}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {BUDGET_PRESETS.map((p) => {
            const active = value.minRent === p.min && value.maxRent === p.max;
            return (
              <CheckboxChip
                key={p.label}
                checked={active}
                onCheckedChange={(checked) =>
                  onChange(checked ? { minRent: p.min, maxRent: p.max } : { minRent: undefined, maxRent: undefined })
                }
                className="px-2.5 py-1 text-xs"
              >
                {p.label}
              </CheckboxChip>
            );
          })}
        </div>
      </Section>

      <Section title="Room type">
        <div className="flex flex-wrap gap-2">
          {SHARING_TYPES.map((s) => (
            <CheckboxChip
              key={s.value}
              checked={value.sharing === s.value}
              onCheckedChange={(checked) => onChange({ sharing: checked ? s.value : undefined })}
            >
              {s.label}
            </CheckboxChip>
          ))}
        </div>
      </Section>

      <Section title="Food">
        <div className="flex flex-wrap gap-2">
          <CheckboxChip
            checked={value.food === true}
            onCheckedChange={(checked) => onChange({ food: checked ? true : undefined })}
          >
            With food
          </CheckboxChip>
          <CheckboxChip
            checked={value.food === false}
            onCheckedChange={(checked) => onChange({ food: checked ? false : undefined })}
          >
            Without food
          </CheckboxChip>
        </div>
      </Section>

      <Section title="Availability & trust">
        <div className="flex flex-wrap gap-2">
          <CheckboxChip
            checked={Boolean(value.available)}
            onCheckedChange={(checked) => onChange({ available: checked || undefined })}
          >
            Beds available now
          </CheckboxChip>
          <CheckboxChip
            checked={Boolean(value.verified)}
            onCheckedChange={(checked) => onChange({ verified: checked || undefined })}
          >
            Verified owners only
          </CheckboxChip>
        </div>
      </Section>

      <Section title="Amenities">
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((a) => (
            <CheckboxChip
              key={a.id}
              checked={amenities.includes(a.id)}
              onCheckedChange={(checked) =>
                onChange({
                  amenities: checked ? [...amenities, a.id] : amenities.filter((x) => x !== a.id),
                })
              }
              className="px-2.5 py-1 text-xs"
            >
              {a.label}
            </CheckboxChip>
          ))}
        </div>
      </Section>
    </div>
  );
}

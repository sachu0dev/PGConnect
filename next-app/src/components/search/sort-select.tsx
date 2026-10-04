"use client";

import { ArrowUpDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SORT_OPTIONS } from "@/lib/constants";
import { buildHref, type FilterState } from "./search-url";
import { useSearchNavigation } from "./search-navigation";

export function SortSelect({ state }: { state: FilterState }) {
  const { navigate } = useSearchNavigation();
  const hasPoint = state.lat !== undefined && state.lng !== undefined;
  const options = [
    ...(hasPoint ? [{ value: "distance", label: "Nearest first" }] : []),
    ...SORT_OPTIONS,
  ];
  const current = state.sort ?? "recommended";

  return (
    <Select
      value={current}
      onValueChange={(value) =>
        navigate(buildHref("/pgs", { ...state, sort: value as FilterState["sort"], page: undefined }))
      }
    >
      <SelectTrigger className="h-10 w-auto min-w-[11rem] gap-2 rounded-lg" aria-label="Sort results">
        <ArrowUpDown className="size-4 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

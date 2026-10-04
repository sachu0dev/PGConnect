import {
  AirVent,
  ArrowUpDown,
  Bath,
  BadgeCheck,
  BatteryCharging,
  BedDouble,
  CalendarClock,
  Cctv,
  CircleCheck,
  Dumbbell,
  GlassWater,
  IndianRupee,
  Lamp,
  ShieldAlert,
  ShieldCheck,
  Shirt,
  ShowerHead,
  Sparkles,
  SquareParking,
  Refrigerator,
  Tv,
  Users,
  UtensilsCrossed,
  WashingMachine,
  Wallet,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { amenityLabel, sharingLabel } from "@/lib/constants";
import { formatINR, initials } from "@/lib/format";
import type { PgDetail } from "@/lib/types";

const AMENITY_ICONS: Record<string, LucideIcon> = {
  wifi: Wifi,
  ac: AirVent,
  meals: UtensilsCrossed,
  laundry: WashingMachine,
  housekeeping: Sparkles,
  power_backup: BatteryCharging,
  attached_bathroom: Bath,
  hot_water: ShowerHead,
  parking: SquareParking,
  cctv: Cctv,
  security: ShieldCheck,
  gym: Dumbbell,
  tv: Tv,
  fridge: Refrigerator,
  ro_water: GlassWater,
  study_table: Lamp,
  wardrobe: Shirt,
  lift: ArrowUpDown,
};

export function KeyFacts({ pg }: { pg: PgDetail }) {
  const facts: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: IndianRupee, label: "Rent from", value: `${formatINR(pg.rentPerMonth)}/month` },
    { icon: Wallet, label: "Security deposit", value: pg.deposit > 0 ? formatINR(pg.deposit) : "None" },
    {
      icon: Users,
      label: "Sharing",
      value: pg.sharingTypes.length ? pg.sharingTypes.map(sharingLabel).join(", ") : "Ask owner",
    },
    {
      icon: BedDouble,
      label: "Beds available",
      value: pg.bedsAvailable > 0 ? `${pg.bedsAvailable} of ${pg.capacity}` : "Full right now",
    },
    {
      icon: CalendarClock,
      label: "Notice period",
      value:
        pg.noticePeriodDays === null
          ? "Ask owner"
          : pg.noticePeriodDays === 0
            ? "No notice needed"
            : `${pg.noticePeriodDays} days`,
    },
    { icon: UtensilsCrossed, label: "Food", value: pg.foodIncluded ? "Included in rent" : "Not included" },
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {facts.map(({ icon: Icon, label, value }) => (
        <div key={label} className="rounded-xl border bg-card p-4">
          <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Icon className="size-3.5" aria-hidden /> {label}
          </dt>
          <dd className="mt-1 text-sm font-semibold">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function AmenityList({ amenities }: { amenities: string[] }) {
  if (amenities.length === 0) {
    return <p className="text-sm text-muted-foreground">The owner hasn&apos;t listed amenities yet — ask them in chat.</p>;
  }
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
      {amenities.map((id) => {
        const Icon = AMENITY_ICONS[id] ?? CircleCheck;
        return (
          <li key={id} className="flex items-center gap-2.5 text-sm">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-4" aria-hidden />
            </span>
            {amenityLabel(id)}
          </li>
        );
      })}
    </ul>
  );
}

export function OwnerCard({ owner }: { owner: PgDetail["owner"] }) {
  const since = new Date(owner.memberSince).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
        {initials(owner.username)}
      </span>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 font-semibold">
          <span className="truncate">{owner.username}</span>
          {owner.isVerified ? <BadgeCheck className="size-4 shrink-0 text-success" aria-label="Verified owner" /> : null}
        </p>
        <p className="text-sm text-muted-foreground">PG owner · Member since {since}</p>
        {owner.isVerified ? (
          <p className="mt-1 text-xs font-medium text-success">Government ID verified by PGConnect</p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">ID not verified yet — visit before paying anything.</p>
        )}
      </div>
    </div>
  );
}

export function SafetyTips() {
  const tips = [
    "Never pay a token or advance before visiting the PG in person.",
    "Check the room, washroom, food and drinking water during your visit.",
    "Ask for a written rent agreement and a receipt for every payment.",
    "Keep conversations on PGConnect chat so there is a record.",
  ];
  return (
    <aside className="rounded-xl border border-warning/40 bg-warning/10 p-5" aria-labelledby="safety-heading">
      <h2 id="safety-heading" className="flex items-center gap-2 font-semibold">
        <ShieldAlert className="size-4 text-warning" aria-hidden /> Stay safe while renting
      </h2>
      <ul className="mt-3 space-y-2 text-sm">
        {tips.map((t) => (
          <li key={t} className="flex gap-2">
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

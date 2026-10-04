"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { GoogleMap, InfoWindowF, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import { ImageIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR, titleCase } from "@/lib/format";
import { MAPS_API_KEY, MAPS_LIBRARIES, MAPS_LOADER_ID } from "./maps-config";

export type MapItem = {
  id: string;
  name: string;
  rentPerMonth: number;
  latitude: number | null;
  longitude: number | null;
  image: string | null;
  locality: string | null;
  city: string;
};

const PILL_PATH =
  "M -24 -12 H 24 A 6 6 0 0 1 30 -6 V 6 A 6 6 0 0 1 24 12 H 4 L 0 17 L -4 12 H -24 A 6 6 0 0 1 -30 6 V -6 A 6 6 0 0 1 -24 -12 Z";

function pillIcon(active: boolean): google.maps.Symbol {
  return {
    path: PILL_PATH,
    fillColor: active ? "#0b5e52" : "#0f8a78",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 1.5,
    scale: 1,
    anchor: new google.maps.Point(0, 17),
    labelOrigin: new google.maps.Point(0, 0),
  };
}

function shortPrice(value: number) {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1).replace(/\.0$/, "")}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `₹${value}`;
}

export default function ResultsMap({ items }: { items: MapItem[] }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: MAPS_LOADER_ID,
    googleMapsApiKey: MAPS_API_KEY,
    libraries: MAPS_LIBRARIES,
  });
  const [selected, setSelected] = useState<string | null>(null);
  const points = useMemo(
    () => items.filter((i): i is MapItem & { latitude: number; longitude: number } => i.latitude !== null && i.longitude !== null),
    [items]
  );

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      if (points.length === 0) return;
      if (points.length === 1) {
        map.setCenter({ lat: points[0]!.latitude, lng: points[0]!.longitude });
        map.setZoom(15);
        return;
      }
      const bounds = new google.maps.LatLngBounds();
      points.forEach((p) => bounds.extend({ lat: p.latitude, lng: p.longitude }));
      map.fitBounds(bounds, 48);
    },
    [points]
  );

  if (loadError) {
    return (
      <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        The map could not be loaded right now. Switch back to the list view.
      </p>
    );
  }
  if (!isLoaded) return <Skeleton className="h-[70dvh] w-full rounded-xl" />;

  const active = points.find((p) => p.id === selected);

  return (
    <div className="h-[70dvh] overflow-hidden rounded-xl border">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        onLoad={onLoad}
        onClick={() => setSelected(null)}
        options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false, clickableIcons: false }}
      >
        {points.map((p) => (
          <MarkerF
            key={p.id}
            position={{ lat: p.latitude, lng: p.longitude }}
            title={`${p.name} — ${formatINR(p.rentPerMonth)}/month`}
            label={{ text: shortPrice(p.rentPerMonth), fontSize: "11px", fontWeight: "700", color: "#ffffff" }}
            icon={pillIcon(p.id === selected)}
            zIndex={p.id === selected ? 10 : 1}
            onClick={() => setSelected(p.id)}
          />
        ))}
        {active ? (
          <InfoWindowF
            position={{ lat: active.latitude, lng: active.longitude }}
            onCloseClick={() => setSelected(null)}
          >
            <Link href={`/pg/${active.id}`} className="block w-52 text-foreground">
              <div className="relative mb-2 aspect-[4/3] overflow-hidden rounded-md bg-muted">
                {active.image ? (
                  <Image src={active.image} alt={active.name} fill sizes="208px" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <ImageIcon className="size-6" />
                  </div>
                )}
              </div>
              <p className="line-clamp-1 text-sm font-semibold text-gray-900">{active.name}</p>
              <p className="line-clamp-1 text-xs text-gray-600">
                {[active.locality, titleCase(active.city)].filter(Boolean).join(", ")}
              </p>
              <p className="mt-1 text-sm font-bold text-gray-900">
                {formatINR(active.rentPerMonth)}
                <span className="text-xs font-normal text-gray-600">/mo</span>
              </p>
            </Link>
          </InfoWindowF>
        ) : null}
      </GoogleMap>
    </div>
  );
}

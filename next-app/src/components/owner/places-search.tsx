"use client";

import { useRef } from "react";
import { Autocomplete, useJsApiLoader, type Libraries } from "@react-google-maps/api";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Must be a stable reference and match other loaders in the app (id + libraries).
const LIBRARIES: Libraries = ["places"];

export type PlaceResult = {
  address: string;
  city: string | null;
  locality: string | null;
  latitude: number | null;
  longitude: number | null;
};

function component(place: google.maps.places.PlaceResult, ...types: string[]) {
  for (const type of types) {
    const match = place.address_components?.find((c) => c.types.includes(type));
    if (match) return match.long_name;
  }
  return null;
}

/**
 * Google Places search that fills address/city/locality/coordinates.
 * Only rendered when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is configured.
 */
export function PlacesSearch({ apiKey, onPlace }: { apiKey: string; onPlace: (place: PlaceResult) => void }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });
  const autocomplete = useRef<google.maps.places.Autocomplete | null>(null);

  if (loadError || !isLoaded) return null;

  return (
    <div className="space-y-2">
      <Label htmlFor="places-search">Search your PG on Google Maps</Label>
      <Autocomplete
        onLoad={(instance) => {
          autocomplete.current = instance;
        }}
        onPlaceChanged={() => {
          const place = autocomplete.current?.getPlace();
          if (!place?.geometry?.location) return;
          onPlace({
            address: place.formatted_address ?? place.name ?? "",
            city: component(place, "locality", "administrative_area_level_2"),
            locality: component(place, "sublocality_level_1", "sublocality", "neighborhood"),
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
          });
        }}
        options={{
          componentRestrictions: { country: "in" },
          fields: ["address_components", "formatted_address", "geometry", "name"],
        }}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="places-search"
            placeholder="Type your PG name or building address"
            className="pl-9"
            autoComplete="off"
            onKeyDown={(e) => {
              // Selecting a suggestion with Enter shouldn't submit the form.
              if (e.key === "Enter") e.preventDefault();
            }}
          />
        </div>
      </Autocomplete>
      <p className="text-xs text-muted-foreground">Picking a result fills the fields below. You can still edit them.</p>
    </div>
  );
}

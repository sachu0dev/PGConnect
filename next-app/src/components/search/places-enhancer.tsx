"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { MAPS_API_KEY, MAPS_LIBRARIES, MAPS_LOADER_ID } from "./maps-config";

export type PlaceSelection =
  | { kind: "point"; label: string; lat: number; lng: number }
  | { kind: "text"; label: string };

const AREA_TYPES = ["locality", "administrative_area_level_1", "administrative_area_level_2", "country"];

/**
 * Attaches Google Places autocomplete to an existing text input. Renders
 * nothing; the plain input keeps working if the script fails to load.
 */
export default function PlacesEnhancer({
  inputRef,
  onSelect,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  onSelect: (selection: PlaceSelection) => void;
}) {
  const { isLoaded } = useJsApiLoader({
    id: MAPS_LOADER_ID,
    googleMapsApiKey: MAPS_API_KEY,
    libraries: MAPS_LIBRARIES,
  });
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const input = inputRef.current;
    if (!isLoaded || !input || !window.google?.maps?.places) return;

    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      componentRestrictions: { country: "in" },
      fields: ["name", "formatted_address", "geometry", "types"],
    });
    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const label = place.name || place.formatted_address || input.value;
      const location = place.geometry?.location;
      const isArea = (place.types ?? []).some((t) => AREA_TYPES.includes(t));
      if (location && !isArea) {
        onSelectRef.current({ kind: "point", label, lat: location.lat(), lng: location.lng() });
      } else {
        onSelectRef.current({ kind: "text", label: place.formatted_address || label });
      }
    });

    // Enter on a highlighted suggestion should pick it, not submit the form.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && document.querySelector(".pac-item-selected")) event.preventDefault();
    };
    input.addEventListener("keydown", onKeyDown);

    return () => {
      listener.remove();
      input.removeEventListener("keydown", onKeyDown);
      window.google.maps.event.clearInstanceListeners(autocomplete);
      document.querySelectorAll(".pac-container").forEach((el) => el.remove());
    };
  }, [isLoaded, inputRef]);

  return null;
}

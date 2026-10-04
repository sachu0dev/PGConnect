import type { Libraries } from "@react-google-maps/api";

/** Shared Google Maps loader config: every useJsApiLoader call must use identical options. */
export const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
export const MAPS_LOADER_ID = "pgconnect-google-maps";
export const MAPS_LIBRARIES: Libraries = ["places"];

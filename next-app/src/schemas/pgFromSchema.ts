import { z } from "zod";
export const pgFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contact: z
    .string()
    .min(10, "Contact must be at least 10 digits")
    .regex(/^\d+$/, "Contact must contain only numbers"),
  city: z.string().min(1, "City is required"),
  address: z.string().min(1, "Address is required"),
  rentPerMonth: z.number().min(1, "Rent per month must be at least 1"),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  gender: z.enum(["MALE", "FEMALE", "ANY"]),
  isDummy: z.boolean(),
  coordinates: z.string().min(1, "Coordinates are required"),
  bhk: z.number().min(1, "BHK must be at least 1"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(200, "Description must be at most 200 characters"),
  isAcceptingGuest: z.boolean(),
  images: z
    .array(z.string())
    .min(3, "You must upload at least 3 images")
    .max(8, "You can upload up to 8 images"),
});

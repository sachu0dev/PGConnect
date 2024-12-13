"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setUser } from "@/lib/features/user/userSlice";

const formSchema = z.object({
  aadhaarImage: z
    .instanceof(File)
    .refine((file) => file.size <= 5000000, `Max file size is 5MB.`),
  aadhaarNumber: z
    .string()
    .regex(
      /^[2-9]{1}[0-9]{3}\s[0-9]{4}\s[0-9]{4}$/,
      "Invalid Aadhaar number format"
    ),
});

export default function AadhaarVerificationForm() {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(false);
  const dispatch = useAppDispatch();

  const { userData } = useAppSelector((state) => state.user);
  useEffect(() => {
    if (userData?.isOwner === undefined) return;

    if (userData?.isOwner) {
      window.location.href = "/dashboard/pgs";
    } else {
      window.location.href = "/dashboard/verify-owner";
    }
  }, [userData]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      aadhaarNumber: "",
    },
  });

  const fetchUserProfile = async () => {
    try {
      const response = await api.get("/api/profile");

      const user = response.data.User;

      dispatch(setUser(user));
    } catch (error) {
      console.log("Error fetching user profile", error);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsVerifying(true);

    try {
      const formData = new FormData();
      formData.append("aadhaarNumber", values.aadhaarNumber);
      formData.append("aadhaarImage", values.aadhaarImage);

      const response = await api.post("/api/auth/verify-owner", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = response.data;
      if (data.success) {
        toast.success("Verification Successful", {
          description: `Your Aadhaar has been successfully verified.`,
        });
        await fetchUserProfile();
        router.push("/dashboard");
      } else {
        toast.error("Verification Failed", {
          description: `There was an issue with the verification: ${data.message}`,
        });
      }
    } catch (error) {
      console.log(error);
      toast.error("Error", {
        description: "An error occurred during verification. Please try again.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    toast("Verify as owner First", {
      description:
        "To access this owner dashboard, you need to be an owner. verify your aadhaar first.",
      action: {
        label: "Verify Now",
        onClick: () => (window.location.href = "/dashboard/verify-owner"),
      },
    });
  }, []);

  return (
    <div className="flex flex-1">
      <div className="p-2 md:p-10 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col gap-2 flex-1 w-full h-full text-gray-700 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle>Aadhaar Verification</CardTitle>
            <CardDescription>
              Verify your Aadhaar card details. Providing wrong details may lead
              to account suspension.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <FormField
                  control={form.control}
                  name="aadhaarImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aadhaar Image</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => field.onChange(e.target.files?.[0])}
                        />
                      </FormControl>
                      <FormDescription>
                        Upload a clear image of your Aadhaar card
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="aadhaarNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aadhaar Number</FormLabel>
                      <FormControl>
                        <Input placeholder="1234 5678 9012" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter your 12-digit Aadhaar number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isVerifying}>
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Verify Aadhaar
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppSelector } from "@/lib/hooks";
import Link from "next/link";
import React, { useState } from "react";
import { ApiResponse } from "@/types/response";
import api from "@/lib/axios";
import { AxiosError } from "axios";

interface PhoneNumberInputProps {
  pgId: string;
  classname: string;
}

const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  pgId,
  classname,
}) => {
  const { userData } = useAppSelector((state) => state.user);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Reset previous states
    setError(null);
    setIsLoading(true);

    // Type-safe form element access
    const form = e.currentTarget;
    const phoneNumberInput = form.elements.namedItem(
      "phoneNumber"
    ) as HTMLInputElement;
    const number = phoneNumberInput.value.trim();

    // Improved phone number validation (allows optional +1 prefix)
    const phoneRegex = /^(\+?1\s?)?(\d{3}|\(\d{3}\))[\s.-]?\d{3}[\s.-]?\d{4}$/;

    // Validation checks
    if (!number) {
      setError("Please enter a phone number.");
      setIsLoading(false);
      return;
    }

    if (!phoneRegex.test(number)) {
      setError("Please enter a valid phone number (10 digits).");
      setIsLoading(false);
      return;
    }

    try {
      // Sanitize phone number before sending
      const sanitizedNumber = number.replace(/\D/g, "").slice(-10);

      const response = await api.post<ApiResponse>("/api/pg/send-callback", {
        PhoneNumber: sanitizedNumber,
        pgId,
      });

      if (!response.data.success) {
        setError(response.data.error || "Failed to send callback request.");
        setIsLoading(false);
        return;
      }

      form.reset();
      setError(null);
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      setError(
        axiosError.response?.data.error ||
          "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger
        className={`font-semibold text-sm h-[36px] ${classname} p-2 rounded-md border border-primary1 bg-white text-primary1 hover:bg-primary1/10 z-10`}
        aria-label="Request a Callback"
      >
        Request a Callback
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          {userData ? (
            <>
              <DialogTitle className="text-primary1">
                Enter phone number
              </DialogTitle>
              <form onSubmit={handleSubmit} noValidate>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  placeholder="Enter phone number"
                  aria-label="Phone number"
                  className="mt-4"
                  type="tel"
                  autoComplete="tel"
                />
                {error && (
                  <span
                    className="text-red-500 mt-2"
                    role="alert"
                    aria-live="polite"
                  >
                    {error}
                  </span>
                )}
                <Button
                  type="submit"
                  className="mt-4 w-full bg-primary1 text-white font-semibold hover:bg-primary1/90"
                  disabled={isLoading}
                >
                  {isLoading ? "Submitting..." : "Request Callback"}
                </Button>
              </form>
            </>
          ) : (
            <>
              <DialogTitle className="text-primary1">
                Login to request a callback
              </DialogTitle>
              <DialogDescription>
                <Link href="/login">
                  <Button
                    className="w-full mt-4 bg-primary1 text-white font-medium hover:bg-primary1/90"
                    aria-label="Login to request callback"
                  >
                    Login
                  </Button>
                </Link>
              </DialogDescription>
            </>
          )}
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default PhoneNumberInput;

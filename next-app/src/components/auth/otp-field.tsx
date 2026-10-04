"use client";

import * as React from "react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

type OtpFieldProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
  "aria-describedby"?: string;
};

/** Six-digit one-time-code input with large, thumb-friendly slots. */
export const OtpField = React.forwardRef<HTMLInputElement, OtpFieldProps>(
  ({ id, value, onChange, onComplete, disabled, invalid, autoFocus, ...aria }, ref) => (
    <InputOTP
      ref={ref}
      id={id}
      maxLength={6}
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      disabled={disabled}
      autoFocus={autoFocus}
      pattern={REGEXP_ONLY_DIGITS}
      inputMode="numeric"
      autoComplete="one-time-code"
      aria-label="6-digit code"
      aria-invalid={invalid || undefined}
      aria-describedby={aria["aria-describedby"]}
      containerClassName="justify-center sm:justify-start"
    >
      <InputOTPGroup className="gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <InputOTPSlot
            key={i}
            index={i}
            className={cn(
              "size-10 rounded-lg border text-lg font-semibold first:rounded-lg last:rounded-lg min-[400px]:size-11 sm:size-12",
              invalid && "border-destructive"
            )}
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  )
);
OtpField.displayName = "OtpField";

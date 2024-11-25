"use client";
import { InputOTPPattern } from "@/components/specific/inputOtp";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";

const Page = () => {
  const router = useRouter();
  const { username } = useParams<{ username: string }>();
  const [code, setCode] = useState<string>("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit OTP.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await axios.post("/api/auth/verify-code", {
        username,
        code,
      });

      if (response.data.success) {
        toast(response.data.message);
        return;
      } else {
        toast.success(response.data.message);
      }

      router.push(`/login`);
    } catch (error: any) {
      toast(
        error.response.data.message || "Verification failed. Please try again."
      );
    }
  };

  return (
    <div className="bg-primary1/20 min-h-[calc(100vh-69px)] flex justify-center items-center px-4 relative">
      <div className="w-full max-w-md p-8 m-8 space-y-8 bg-white dark:bg-[#191919] rounded-lg shadow-md dark:shadow-lg">
        <div className="text-center flex w-full items-center flex-col">
          <h1 className="text-3xl font-extrabold tracking-tight mb-4">
            Verify your account
          </h1>
        </div>
        <form
          onSubmit={handleVerify}
          className="flex  space-x-4 justify-center"
        >
          <InputOTPPattern value={code} onChange={(val) => setCode(val)} />
          <Button type="submit">Verify</Button>
        </form>
      </div>
    </div>
  );
};

export default Page;

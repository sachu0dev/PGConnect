"use client";
import { verifySchema } from "@/schemas/verifySchema";
import { ApiResponse } from "@/types/ApiResponse";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosError } from "axios";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggleMode } from "@/components/theme/ThemeToggleMode";
import Image from "next/image";
import { Lock } from "lucide-react";

const Page = () => {
  const router = useRouter();
  const param = useParams<{ username: string }>();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof verifySchema>>({
    resolver: zodResolver(verifySchema),
  });

  const onSubmit = async (data: z.infer<typeof verifySchema>) => {
    try {
      const response = await axios.post("/api/verify-code", {
        username: param.username,
        code: data.code,
      });

      if (response.data.success) {
        toast({
          title: "Success",
          description: response.data.message,
        });
        router.push("/sign-in");
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      const errorMessage =
        axiosError.response?.data.message || "Error verifying code";
      toast({
        title: "Signup failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };
  return (
    <div className="relative flex justify-center items-center min-h-screen bg-gray-100 dark:bg-slate-950">
      <div className="absolute top-4 right-4 z-100">
        <ThemeToggleMode />
      </div>
      <div className="absolute bottom-0 left-[-20%] right-0 top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(255,0,182,.15),rgba(255,255,255,0))]"></div>
      <div className="absolute bottom-0 right-[-20%] top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(255,0,182,.15),rgba(255,255,255,0))]"></div>

      <div className="w-full max-w-md p-8 m-8 space-y-8 bg-white dark:bg-[#191919] rounded-lg shadow-md dark:shadow-l dark:shadow-slate-950">
        <div className="text-center flex w-full items-center flex-col">
          <Image
            src="/logo/namelessDark.png"
            alt="Nameless Feedback"
            width={180}
            height={180}
            className="w-[150px] h-[150px] dark:invert"
          />
          <h1 className="text-3xl font-extrabold tracking-tight mb-4">
            Verify your account
          </h1>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              name="code"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter verification code"
                      {...field}
                      icon={<Lock size={16} color="#626262" />}
                      className="mb-4 dark:bg-[#121212] dark:border-[#1B1B1B]   dark:placeholder-[#626262] shadow-inner dark:shadow-[inset_0_2px_2px_rgba(0,0,0,0.6)]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className={`mb-4 bg-[#0173DC] w-full dark:bg-[#005bb5] dark:text-white text-white font-semibold 
              py-2 px-4 rounded-lg transition-all duration-200 transform 
              shadow-[0_4px_6px_rgba(0,0,0,0.3),0_1px_3px_rgba(0,0,0,0.1)] 
              hover:shadow-[0_6px_8px_rgba(0,0,0,0.4),0_2px_4px_rgba(0,0,0,0.2)] 
              active:translate-y-1 active:shadow-[0_2px_4px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.1)]`}
            >
              Verify
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default Page;

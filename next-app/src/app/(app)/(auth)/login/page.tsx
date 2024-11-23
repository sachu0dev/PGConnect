"use client";
import GoogleButton from "@/components/specific/GoogleButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/axios";
import { loginSchema } from "@/schemas/loginSchema";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { z } from "zod";

const LoginPage = () => {
  const router = useRouter();

  // Combined form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    form: "", // Added for general form errors
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear errors when user starts typing
    setErrors((prev) => ({ ...prev, [name]: "", form: "" }));
  };

  const validateForm = () => {
    const newErrors = { ...errors };
    let isValid = true;

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      loginSchema.parse(formData);

      const response = await api.post("/api/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      if (!response.data.success) {
        const errorMessage = response.data.message || "Login failed";
        toast.error(errorMessage);
        setErrors((prev) => ({ ...prev, form: errorMessage }));
      } else {
        toast.success("Login successful!");
        router.push("/");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { [key: string]: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
      } else {
        const errorMessage = "Invalid credentials. Please try again.";
        toast.error(errorMessage);
        setErrors((prev) => ({ ...prev, form: errorMessage }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#014073] min-h-[calc(100vh-69px)] flex justify-center items-center px-4">
      <div className="flex flex-col md:flex-row max-w-[800px] w-full">
        {/* Form Section */}
        <div className="flex-1 bg-white rounded-xl shadow-lg p-8 mb-4 md:mb-0">
          <h3 className="text-3xl font-bold mb-6 text-center md:text-left">
            Login
          </h3>

          {errors.form && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block mb-1 font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full"
                disabled={isSubmitting}
                required
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block mb-1 font-medium">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full"
                disabled={isSubmitting}
                required
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Log In"}
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="flex justify-center">
              <GoogleButton />
            </div>

            <div className="text-center">
              <Link
                href="/register"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Don&apos;t have an account? Sign up
              </Link>
            </div>
          </div>
        </div>

        {/* Image Section */}
        <div className="bg-transparent flex-1 md:py-4">
          <div className="rounded-xl md:rounded-l-none overflow-hidden relative shadow-lg h-[300px] md:h-full">
            <Image
              src="https://res.cloudinary.com/dijtcmvrm/image/upload/f_auto,q_auto/bu739c5mokuuqtbqmiim"
              alt="Room"
              fill
              className="object-cover"
            />
            <div className="bg-black/60 absolute inset-0" />
            <div className="absolute flex font-bold justify-center items-center w-full h-full text-white text-3xl z-10">
              Login to your account
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

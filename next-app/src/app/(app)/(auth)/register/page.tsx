"use client";
import { z } from "zod";
import React from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import GoogleButton from "@/components/specific/GoogleButton";
import { useAppDispatch } from "@/lib/hooks";
import Link from "next/link";
import { registerSchema } from "@/schemas/registerUserScheam";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import {
  loginFailure,
  loginStart,
  loginSuccess,
} from "@/lib/features/user/userSlice";
import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";

const SignupPage = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  // Combined form state
  const [formData, setFormData] = useState({
    username: "sushil",
    email: "suahilkumar134@gmail.com",
    phoneNumber: "6283816638",
    password: "123456",
    confirmPassword: "123456",
  });

  const [errors, setErrors] = useState({
    username: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    form: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    setErrors((prev) => ({ ...prev, [name]: "", form: "" }));
  };

  const validateForm = () => {
    const newErrors = { ...errors };
    let isValid = true;

    // Password confirmation check
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    // Basic validation before sending to server
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 8 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      registerSchema.parse(formData);

      const response = await axios.post("/api/auth/signup", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
      });

      console.log(response.data);

      if (!response.data.success) {
        toast(response.data.message);
        setErrors((prev) => ({ ...prev, form: response.data.message }));
        dispatch(loginFailure(response.data.message));
      } else {
        toast("Verification email sent successfully");
        dispatch(loginSuccess(response.data));
        router.push(`/verify/${formData.username}`);
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
        const errorMessage =
          error?.response?.data?.message ||
          "Registration failed. Please try again.";
        toast.error(errorMessage);
        setErrors((prev) => ({ ...prev, form: errorMessage }));
      }
      dispatch(loginFailure("Registration failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-primary1/20 min-h-[calc(100vh-69px)] flex justify-center items-center px-4 py-16">
      <div className="flex flex-col md:flex-row max-w-[800px] w-full">
        {/* Image Section */}
        <div className="bg-transparent flex-1 md:py-4">
          <div className="rounded-xl md:rounded-r-none overflow-hidden relative shadow-lg h-[300px] md:h-full">
            <Image
              src="https://res.cloudinary.com/dijtcmvrm/image/upload/f_auto,q_auto/bu739c5mokuuqtbqmiim"
              alt="Room"
              fill
              className="object-cover"
            />
            <div className="bg-black/60 absolute inset-0" />
            <div className="absolute flex font-bold justify-center items-center w-full h-full text-white text-3xl z-10">
              Create a new account
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="flex-1 bg-white rounded-xl shadow-lg p-8 mb-4 md:mb-0">
          <h3 className="text-3xl font-bold mb-6 text-center md:text-left">
            Sign Up
          </h3>

          {errors.form && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block mb-1 font-medium">
                Username
              </label>
              <Input
                id="username"
                name="username"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full"
                disabled={isSubmitting}
                required
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">{errors.username}</p>
              )}
            </div>

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
              <label htmlFor="phoneNumber" className="block mb-1 font-medium">
                Phone Number <span className="text-gray-500">(Optional)</span>
              </label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                placeholder="Enter your phone number"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full"
                disabled={isSubmitting}
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.phoneNumber}
                </p>
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

            <div>
              <label
                htmlFor="confirmPassword"
                className="block mb-1 font-medium"
              >
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full"
                disabled={isSubmitting}
                required
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating Account..." : "Create Account"}
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
                href="/login"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Already have an account? Log in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;

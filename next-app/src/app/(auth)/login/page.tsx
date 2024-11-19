"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDispatch } from "react-redux";
import { loginUser } from "@/lib/auth/authAction";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import GoogleButton from "@/components/specific/GoogleButton";

const LoginPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Dispatch the loginUser action
      await dispatch(loginUser(email, password));

      toast.success("Login successful!");
      router.push("/dashboard");
    } catch (error) {
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#014073] min-h-screen flex justify-center items-center px-4">
      <div className="flex flex-col md:flex-row max-w-[800px] w-full">
        {/* Form Section */}
        <div className="flex-1 bg-white rounded-xl shadow-lg p-8 mb-4 md:mb-0">
          <h3 className="text-3xl font-bold mb-6 text-center md:text-left">
            Login
          </h3>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label htmlFor="email" className="block mb-1">
                Username or Email
              </label>
              <Input
                id="email"
                name="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block mb-1">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="**********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
          <div>
            <h2>Choose your account type</h2>
            <GoogleButton userType="user" />
            <GoogleButton userType="pgOwner" />
          </div>
        </div>

        {/* Image Section */}
        <div className="bg-transparent flex-1 md:py-4 ">
          <div className="rounded-xl md:rounded-l-none overflow-hidden relative shadow-lg h-[300px] md:h-full">
            <Image
              src="/assets/room.jpg"
              alt="Room"
              fill
              className="object-cover"
              priority
            />
            <div className="bg-black/60 absolute inset-0"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

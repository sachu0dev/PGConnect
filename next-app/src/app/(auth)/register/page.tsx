import React from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const page = () => {
  return (
    <div className="bg-[#014073] min-h-screen flex justify-center items-center">
      <div className="flex max-w-[800px]">
        <div className="bg-transparent p-4 pr-0 flex-1">
          <div className="rounded-xl rounded-r-none overflow-hidden relative shadow-lg h-full">
            <Image
              src="/assets/room.jpg"
              alt="room"
              width={800}
              height={800}
              className="object-cover w-full h-full"
            />
            <div className="bg-black/60 absolute inset-0"></div>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-lg ">
          <div className="flex flex-col p-8">
            <h3 className="text-3xl font-bold mb-6">SignUp</h3>
            <form>
              <label>Username</label>
              <Input name="username" placeholder="username" className="mb-4" />
              <label>Email</label>
              <Input
                name="email"
                placeholder="xyz@example.xyz"
                className="mb-4"
              />
              <label>Phone Number</label>
              <Input
                name="phoneNumber"
                placeholder="61289327498"
                className="mb-4"
              />
              <label>Password</label>
              <Input
                name="password"
                placeholder="**********"
                className="mb-4"
              />

              <Button className="w-full mb-4">SignUp</Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;

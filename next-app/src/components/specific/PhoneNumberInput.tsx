import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { type } from "../../lib/store";

const PhoneNumberInput = () => {
  return (
    <Dialog>
      <DialogTrigger className="font-semibold w-full p-1  rounded-md border-[1px] border-primary1 bg-white text-primary1 hover:bg-primary1/10">
        Request a Callback
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-primary1">
            Enter phone number
          </DialogTitle>
          <DialogDescription>
            <Input
              placeholder="Enter phone number"
              className="mt-4"
              type="tel"
            />
            <Button className="mt-2 w-full bg-primary1 text-white font-semibold hover:bg-primary1/90">
              Request Callback
            </Button>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default PhoneNumberInput;

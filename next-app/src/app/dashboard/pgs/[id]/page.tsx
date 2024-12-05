"use client";
import { Input } from "@/components/ui/input";
import api from "@/lib/axios";
import { ApiResponse } from "@/types/response";
import { ChatRoom, Pg } from "@prisma/client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const Page = () => {
  const params = useParams();
  const { id } = params;
  const [pgData, setPgData] = useState<Pg | null>(null);

  const fetchPgDetails = async () => {
    try {
      const response = await api.get<
        ApiResponse<{ userPgs: Pg; userChatRoom: ChatRoom[] }>
      >(`/api/admin/pg/${id}`);

      if (response.data.success) {
        setPgData(response.data.data.userPgs);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchPgDetails();
  }, [fetchPgDetails]);

  return (
    <div className="flex flex-1">
      <div className="p-2 md:p-10 rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col gap-2 flex-1 w-full h-full">
        <h2 className="text-2xl font-semibold pb-4">Pg information</h2>
        <form className="flex flex-col gap-2">
          <label htmlFor="name" className="text-slate-500">
            Name
          </label>
          <Input
            type="text"
            id="name"
            name="name"
            value={pgData?.name}
            disabled
          />
          <div className="flex space-x-4">
            <div className="w-full mb-4">
              <label htmlFor="name" className="text-slate-500">
                Contact
              </label>
              <Input
                type="text"
                id="Contact"
                name="contact"
                value={pgData?.contact}
                disabled
              />
            </div>
            <div className="w-full mb-4">
              <label htmlFor="name" className="text-slate-500">
                Gender
              </label>
              <Input
                type="text"
                id="gender"
                name="gender"
                value={pgData?.gender}
                disabled
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Page;

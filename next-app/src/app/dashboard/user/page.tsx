"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/axios";
import { ApiResponse } from "@/types/response";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { LoaderCircle, Pencil, Save, X } from "lucide-react";
import { AxiosError } from "axios";

const Page = () => {
  const [userData, setUserData] = useState({
    id: "",
    username: "",
    email: "",
    phoneNumber: null,
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    username: "",
    phoneNumber: "",
  });
  const [updateLoading, setUpdateLoading] = useState(false);

  const fetchUserData = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<{ user: typeof userData }>>(
        `/api/dashboard/user`
      );

      if (response.data.success) {
        setUserData(response.data.data.user);
        setEditData({
          username: response.data.data.user.username,
          phoneNumber: response.data.data.user.phoneNumber || "",
        });
      }
    } catch (error) {
      toast.error("Failed to fetch user data");
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpdate = async () => {
    setUpdateLoading(true);
    try {
      const response = await api.put<ApiResponse>(
        `/api/dashboard/user`,
        editData
      );

      if (response.data.success) {
        toast.success(response.data.message);
        fetchUserData();
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.error);
      } else {
        toast.error("Failed to update user data");
      }
      console.log(error);
    } finally {
      setUpdateLoading(false);
      setIsEditing(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  return (
    <div className="flex flex-1 bg-white relative">
      <div className="p-6 bg-white dark:bg-neutral-900 flex flex-col gap-6 w-full h-full">
        <h2 className="text-2xl font-semibold pb-4">User Information</h2>
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-md">
          <div className="border-b flex justify-between items-center p-2 border-neutral-200 dark:border-neutral-700 font-medium">
            <p>Details</p>
            {isEditing ? (
              <div className="flex space-x-2">
                <Button
                  className="bg-green-600 hover:bg-green-500 px-2 py-1 text-white cursor-pointer"
                  onClick={handleUpdate}
                  disabled={updateLoading}
                >
                  {updateLoading ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                </Button>
                <Button
                  className="bg-red-600 px-2 hover:bg-red-500 py-1 text-white cursor-pointer"
                  onClick={() => setIsEditing(false)}
                >
                  <X size={16} />
                </Button>
              </div>
            ) : (
              <Button
                className="bg-transparent text-slate-400 hover:text-slate-600 cursor-pointer shadow-none hover:bg-white"
                onClick={() => setIsEditing(true)}
              >
                <Pencil size={16} />
              </Button>
            )}
          </div>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-1/2" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <div className="p-4 rounded-md">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium">
                      Username
                    </label>
                    <Input
                      type="text"
                      value={editData.username}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          username: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Phone Number
                    </label>
                    <Input
                      type="text"
                      value={editData.phoneNumber}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          phoneNumber: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-semibold mb-4">
                    {userData.username}
                  </h1>
                  <p className="text-xl text-slate-600">{userData.email}</p>
                  <div className="mt-4">
                    <h3 className="text-lg font-medium">Phone Number:</h3>
                    <p>{userData.phoneNumber || "N/A"}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;

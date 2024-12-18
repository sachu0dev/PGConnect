"use client";
import { DeletePgDialog } from "@/components/shared/DeletePgDialog";
import ImageUpload from "@/components/shared/ImageUploader";
import {
  DescriptionSkeleton,
  DetailsSkeleton,
  ImagesSkeleton,
  RentSkeleton,
} from "@/components/shared/Skelons";
import AddressUpdate from "@/components/specific/AddressUpdate";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import api from "@/lib/axios";
import { ApiResponse } from "@/types/response";
import { ChatRoom, Pg, Subscription } from "@prisma/client";
import {
  CircleX,
  ImagePlus,
  LoaderCircle,
  Mails,
  Pencil,
  Save,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface ExtendedPg extends Pg {
  owner: {
    username: string;
    Subscription: Subscription[];
  };
}
interface ExtendedChatRoom extends ChatRoom {
  id: string;
  userId: string;
  pgId: string;
  user: {
    id: string;
    username: string;
  };
  messageCount: number;
}

const Page = () => {
  const params = useParams();
  const { id } = params;
  const [pgData, setPgData] = useState<ExtendedPg | null>(null);
  const [chatRooms, setChatRooms] = useState<ExtendedChatRoom[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [images, setImages] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showImageUploadDialog, setShowImageUploadDialog] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [name, setName] = useState<string | null>(null);

  const [updateLoading, setUpdateLoading] = useState<boolean>(false);

  const [contact, setContact] = useState<string | null>(null);
  const [capacity, setCapacity] = useState<number | null>(null);
  const [capacityCount, setCapacityCount] = useState<number | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [bhk, setBhk] = useState<number | null>(null);

  const [description, setDescription] = useState<string | null>(null);

  const [rentPerMonth, setRentPerMonth] = useState<number | null>(null);

  const fetchPgDetails = useCallback(async () => {
    try {
      const response = await api.get<
        ApiResponse<{ pg: ExtendedPg; chatRooms: ExtendedChatRoom[] }>
      >(`/api/dashboard/pg/${id}`);

      console.log(response.data);

      if (response.data.success && response.data.data) {
        setPgData(response.data.data.pg);
        setChatRooms(response.data.data.chatRooms);
        setImages(response.data.data.pg.images);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleDetailsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateLoading(true);

    try {
      const response = await api.put<ApiResponse>(
        "/api/dashboard/update/details",
        {
          pgId: id,
          contact,
          capacity,
          capacityCount,
          gender,
          bhk,
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        fetchPgDetails();
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.log(error);
    } finally {
      setUpdateLoading(false);
      setIsEditing(null);
    }
  };

  console.log(pgData?.owner);

  const handleDescitionUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateLoading(true);

    try {
      const response = await api.put<ApiResponse>(
        "/api/dashboard/update/description",
        {
          pgId: id,
          description,
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        fetchPgDetails();
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.log(error);
    } finally {
      setUpdateLoading(false);
      setIsEditing(null);
    }
  };

  const handleRentUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateLoading(true);

    try {
      const response = await api.put<ApiResponse>(
        "/api/dashboard/update/rent",
        {
          pgId: id,
          rentPerMonth,
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        fetchPgDetails();
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.log(error);
    } finally {
      setUpdateLoading(false);
      setIsEditing(null);
    }
  };

  const handleImageRemove = async (imageUrl: string) => {
    setUpdateLoading(true);
    if (pgData && pgData?.images.length <= 3) {
      toast.error("Minimum 3 images required");
      return;
    }
    try {
      const response = await api.put<ApiResponse>(
        "/api/dashboard/update/image",
        {
          pgId: id,
          imageUrl,
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        fetchPgDetails();
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.log(error);
    } finally {
      setUpdateLoading(false);
      setIsEditing(null);
    }
  };

  const handleNameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateLoading(true);

    try {
      const response = await api.put<ApiResponse>(
        "/api/dashboard/update/name",
        {
          pgId: id,
          name,
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        fetchPgDetails();
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.log(error);
    } finally {
      setUpdateLoading(false);
      setIsEditing(null);
    }
  };

  useEffect(() => {
    fetchPgDetails();
  }, [fetchPgDetails]);

  console.log(pgData?.owner.Subscription);

  return (
    <div className="flex flex-1 bg-white relative">
      <div className="p-2 md:p-10  bg-white dark:bg-neutral-900 flex flex-col gap-2 flex-1 w-full h-full font-inter">
        <h2 className="text-2xl font- pb-4">Pg information</h2>
        {loading ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 p-4">
              <Skeleton className="rounded-full w-[120px] h-[120px]" />
              <div className="flex flex-col gap-2 w-full">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-3/4" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailsSkeleton />
              <DescriptionSkeleton />
              <RentSkeleton />
            </div>
            <ImagesSkeleton />
          </div>
        ) : (
          <div className="p-4  ">
            {!pgData ? (
              <div>
                <h1 className="text-2xl font-semibold">Pg not found</h1>
              </div>
            ) : (
              <div className="p-4 border border-neutral-200 dark:border-neutral-700 ">
                <div className="flex flex-col sm:flex-row gap-4 p-4">
                  <div>
                    <Avatar className="rounded-full w-[120px] h-[120px] object-cover">
                      <AvatarImage src={pgData?.images[0]} alt="pg" />
                      <AvatarFallback>
                        {pgData?.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex items-center gap-2">
                      <h1 className="text-3xl font-semibold">
                        {pgData?.owner.username}
                      </h1>
                      {pgData.owner.Subscription.length > 0 &&
                        pgData.owner.Subscription[0].status === "ACTIVE" && (
                          <span className="bg-gray-200 px-2 py-1 rounded-full text-xs">
                            {pgData.owner.Subscription[0].plan} PLAN
                          </span>
                        )}
                    </div>

                    <div className="flex space-x-6 text-slate-400 w-full justify-between">
                      <p className=" text-2xl">{pgData?.address}</p>

                      <Dialog>
                        <DialogTrigger>
                          <div
                            className="bg-transparent text-slate-400 hover:text-slate-600 cursor-pointer shadow-none hover:bg-white"
                            onClick={() => setIsEditing("address")}
                          >
                            <Pencil size={16} />
                          </div>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[800px]">
                          <DialogHeader>
                            <DialogTitle>Update address</DialogTitle>
                          </DialogHeader>
                          <AddressUpdate
                            pgId={id}
                            fetchPgDetails={fetchPgDetails}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="flex space-x-6 text-slate-400 w-full justify-between">
                      {isEditing === "name" ? (
                        <Input
                          type="text"
                          className="w-full text-2xl"
                          defaultValue={pgData?.name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      ) : (
                        <p className=" text-2xl">{pgData?.name}</p>
                      )}
                      {isEditing === "name" ? (
                        <div className="flex space-x-2">
                          <Button
                            className="bg-green-600 hover:bg-green-500 px-2 py-1 text-white cursor-pointer"
                            onClick={handleNameUpdate}
                            disabled={updateLoading}
                          >
                            {updateLoading ? (
                              <LoaderCircle
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <Save size={16} />
                            )}
                          </Button>
                          <Button
                            className="bg-red-600 px-2 hover:bg-red-500 py-1 text-white cursor-pointer"
                            onClick={() => setIsEditing(null)}
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          className="bg-transparent text-slate-400 hover:text-slate-600 cursor-pointer shadow-none hover:bg-white"
                          onClick={() => setIsEditing("name")}
                        >
                          <Pencil size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2  gap-4 text-sm text-[#354052]">
                  <div className="border border-neutral-200 dark:border-neutral-700">
                    <div className="border-b flex justify-between items-center p-2 border-neutral-200 dark:border-neutral-700 font-medium">
                      <p>Details</p>
                      {isEditing === "Details" ? (
                        <div className="flex space-x-2">
                          <Button
                            className="bg-green-600 hover:bg-green-500 px-2 py-1 text-white cursor-pointer"
                            onClick={handleDetailsUpdate}
                            disabled={updateLoading}
                          >
                            {updateLoading ? (
                              <LoaderCircle
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <Save size={16} />
                            )}
                          </Button>
                          <Button
                            className="bg-red-600 px-2 hover:bg-red-500 py-1 text-white cursor-pointer"
                            onClick={() => setIsEditing(null)}
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          className="bg-transparent text-slate-400 hover:text-slate-600 cursor-pointer shadow-none hover:bg-white"
                          onClick={() => setIsEditing("Details")}
                        >
                          <Pencil size={16} />
                        </Button>
                      )}
                    </div>
                    <div className="border-b flex  p-2 border-neutral-200 dark:border-neutral-700 font-light">
                      <div className="w-1/3">Contact</div>
                      <span className="pr-4">:</span>
                      {isEditing === "Details" ? (
                        <input
                          type="text"
                          className="w-1/2 p-0 m-0 border-none outline-none shadow-none bg-yellow-100"
                          defaultValue={pgData?.contact}
                          onChange={(e) => setContact(e.target.value)}
                        />
                      ) : (
                        <div className="w-1/2">{pgData?.contact}</div>
                      )}
                    </div>
                    <div className="border-b flex  p-2 border-neutral-200 dark:border-neutral-700 font-light">
                      <div className="w-1/3">City</div>
                      <span className="pr-4">:</span>

                      <div className="w-1/2">{pgData?.city}</div>
                    </div>
                    <div className="border-b flex  p-2 border-neutral-200 dark:border-neutral-700 font-light">
                      <div className="w-1/3">Total Capacity</div>
                      <span className="pr-4">:</span>
                      {isEditing === "Details" ? (
                        <input
                          type="text"
                          className="w-1/2 p-0 m-0 border-none outline-none shadow-none bg-yellow-100"
                          defaultValue={pgData?.capacity}
                          onChange={(e) =>
                            setCapacity(parseInt(e.target.value))
                          }
                        />
                      ) : (
                        <div className="w-1/2">{pgData?.capacity}</div>
                      )}
                    </div>
                    <div className="border-b flex  p-2 border-neutral-200 dark:border-neutral-700 font-light">
                      <div className="w-1/3">Capacity occupied</div>
                      <span className="pr-4">:</span>
                      {isEditing === "Details" ? (
                        <input
                          type="text"
                          className="w-1/2 p-0 m-0 border-none outline-none shadow-none bg-yellow-100"
                          defaultValue={pgData?.capacityCount}
                          onChange={(e) =>
                            setCapacityCount(parseInt(e.target.value))
                          }
                        />
                      ) : (
                        <div className="w-1/2">{pgData?.capacityCount}</div>
                      )}
                    </div>
                    <div className="border-b flex  p-2 border-neutral-200 dark:border-neutral-700 font-light">
                      <div className="w-1/3">Gender Preference</div>
                      <span className="pr-4">:</span>
                      {isEditing === "Details" ? (
                        <input
                          type="text"
                          className="w-1/2 p-0 m-0 border-none outline-none shadow-none bg-yellow-100"
                          defaultValue={pgData?.gender}
                          onChange={(e) => setGender(e.target.value)}
                        />
                      ) : (
                        <div className="w-1/2">{pgData?.gender}</div>
                      )}
                    </div>
                    <div className="border-b flex  p-2 font-light">
                      <div className="w-1/3">BHK</div>
                      <span className="pr-4">:</span>
                      {isEditing === "Details" ? (
                        <input
                          type="text"
                          className="w-1/2 p-0 m-0 border-none outline-none shadow-none bg-yellow-100"
                          defaultValue={pgData?.bhk}
                          onChange={(e) => setBhk(parseInt(e.target.value))}
                        />
                      ) : (
                        <div className="w-1/2">{pgData?.bhk}</div>
                      )}
                    </div>
                  </div>
                  <div className="border border-neutral-200 dark:border-neutral-700">
                    <div className="border-b flex justify-between items-center p-2 border-neutral-200 dark:border-neutral-700 font-medium">
                      <p>Description</p>
                      {isEditing === "description" ? (
                        <div className="flex space-x-2">
                          <Button
                            className="bg-green-600 hover:bg-green-500 px-2 py-1 text-white cursor-pointer"
                            onClick={handleDescitionUpdate}
                            disabled={updateLoading}
                          >
                            {updateLoading ? (
                              <LoaderCircle
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <Save size={16} />
                            )}
                          </Button>
                          <Button
                            className="bg-red-600 px-2 hover:bg-red-500 py-1 text-white cursor-pointer"
                            onClick={() => setIsEditing(null)}
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          className="bg-transparent text-slate-400 hover:text-slate-600 cursor-pointer shadow-none hover:bg-white"
                          onClick={() => setIsEditing("description")}
                        >
                          <Pencil size={16} />
                        </Button>
                      )}
                    </div>

                    {isEditing === "description" ? (
                      <textarea
                        className="w-full h-[220px] p-2 font-medium m-0 border-none outline-none shadow-none bg-yellow-100"
                        defaultValue={pgData?.description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    ) : (
                      <div className="p-2 font-medium text-ellipsis">
                        {pgData?.description}
                      </div>
                    )}
                  </div>
                  <div className="border border-neutral-200 dark:border-neutral-700">
                    <div className="border-b flex justify-between items-center p-2 border-neutral-200 dark:border-neutral-700 font-medium">
                      <div className="flex justify-between items-center">
                        Rent Per Month
                      </div>
                      <span className="pr-4">:</span>
                      <div className="flex items-center">
                        {isEditing === "rentpermonth" ? (
                          <input
                            type="text"
                            className="p-0 m-0 border-none outline-none shadow-none bg-yellow-100"
                            defaultValue={pgData?.rentPerMonth}
                            onChange={(e) =>
                              setRentPerMonth(parseInt(e.target.value))
                            }
                          />
                        ) : (
                          <span>{pgData?.rentPerMonth}</span>
                        )}

                        {isEditing === "rentpermonth" ? (
                          <div className="flex space-x-2 mx-2">
                            <Button
                              className="bg-green-600 hover:bg-green-500 px-2 py-1 text-white cursor-pointer"
                              onClick={handleRentUpdate}
                              disabled={updateLoading}
                            >
                              {updateLoading ? (
                                <LoaderCircle
                                  size={16}
                                  className="animate-spin"
                                />
                              ) : (
                                <Save size={16} />
                              )}
                            </Button>
                            <Button
                              className="bg-red-600 px-2 hover:bg-red-500 py-1 text-white cursor-pointer"
                              onClick={() => setIsEditing(null)}
                            >
                              <X size={16} />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            className="bg-transparent text-slate-400 hover:text-slate-600 cursor-pointer shadow-none hover:bg-white"
                            onClick={() => setIsEditing("rentpermonth")}
                          >
                            <Pencil size={16} />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="border border-neutral-200 p-2 dark:border-neutral-700">
                    <div className="flex justify-between items-center">
                      <h1 className="text-xl font-medium text-[#354052]">
                        Images
                      </h1>
                      <Button
                        variant="outline"
                        onClick={() => setShowImageUploadDialog(true)}
                        disabled={images.length >= 6}
                        className="hover:bg-gray-100"
                      >
                        <ImagePlus className="mr-2" /> Add Images
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative group">
                          <Image
                            src={image}
                            alt={`Preview ${index}`}
                            className="w-full h-36 object-cover rounded shadow"
                            width={500}
                            height={400}
                          />
                          <div className="absolute top-2 left-2">
                            <button
                              type="button"
                              className={`bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition z-10`}
                              onClick={() => handleImageRemove(image)}
                            >
                              <CircleX />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {chatRooms.length > 0 && (
                  <div className="mt-4">
                    <div className="border border-neutral-200 p-2 dark:border-neutral-700">
                      <div className="flex justify-between items-center">
                        <h1 className="text-xl font-medium text-[#354052]">
                          Pg Chats
                        </h1>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2  gap-4 mt-4">
                        {chatRooms.map((room) => (
                          <Tooltip key={room.id}>
                            <TooltipTrigger>
                              <Link
                                key={room.id}
                                href={`/chat/${room.id}`}
                                className="w-ful"
                              >
                                <div className="border flex justify-between items-center p-2 border-neutral-200 dark:border-neutral-700 font-medium">
                                  <span>{room.user.username}</span>
                                  {room.messageCount > 0 && (
                                    <span className="flex  text-primary1">
                                      <Mails className="mr-2" />{" "}
                                      {room.messageCount}
                                    </span>
                                  )}
                                </div>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{room.messageCount} unread messages</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <Dialog
                  open={showImageUploadDialog}
                  onOpenChange={setShowImageUploadDialog}
                >
                  <DialogContent className="sm:max-w-[800px]">
                    <DialogHeader>
                      <DialogTitle>Upload PG Images</DialogTitle>
                    </DialogHeader>
                    <ImageUpload
                      pgId={id as string}
                      existingImages={images}
                      onUploadSuccess={() => {
                        fetchPgDetails();
                        setShowImageUploadDialog(false);
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            )}
            <div className="flex gap-2 w-full py-4 text-lg">
              <Button className="w-full">Stop Acception</Button>
              <Button
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="w-full"
              >
                Delete PG
              </Button>
            </div>

            <DeletePgDialog
              pgId={id as string}
              isOpen={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;

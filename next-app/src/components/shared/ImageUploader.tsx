import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/axios";
import { ApiResponse } from "@/types/response";
import { AxiosError } from "axios";
import { ImagePlus, Trash2, Upload, X } from "lucide-react";
import Image from "next/image";
import React, { useRef, useState } from "react";
import { toast } from "sonner";

interface ImageUploadProps {
  pgId: string | string[];
  existingImages: string[];
  onUploadSuccess: () => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  pgId,
  existingImages,
  onUploadSuccess,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const imageFiles = Array.from(files).filter(
      (file) => file.type.startsWith("image/") && file.size / 1024 / 1024 <= 5
    );

    if (imageFiles.length === 0) {
      toast.error("Please select valid image files (max 5MB each)");
      return;
    }

    const totalImagesAfterUpload = existingImages.length + imageFiles.length;
    if (totalImagesAfterUpload > 6) {
      toast.error("Maximum 6 images allowed");
      return;
    }

    const newPreviews = imageFiles.map((file) => URL.createObjectURL(file));

    setSelectedFiles(imageFiles);
    setPreviews(newPreviews);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("No images selected");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("pgId", pgId.toString());
    selectedFiles.forEach((file) => {
      formData.append("images", file);
    });

    try {
      const response = await api.post<ApiResponse>(
        "/api/dashboard/update/image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        onUploadSuccess();
        // Reset state
        setSelectedFiles([]);
        setPreviews([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.message);
      } else {
        toast.error("Image upload failed");
      }
      console.log(error);
    } finally {
      setIsUploading(false);
    }
  };

  const removePreview = (indexToRemove: number) => {
    const newFiles = selectedFiles.filter(
      (_, index) => index !== indexToRemove
    );
    const newPreviews = previews.filter((_, index) => index !== indexToRemove);

    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleCancel = () => {
    setSelectedFiles([]);
    setPreviews([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="dropzone-file"
          className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <ImagePlus className="w-10 h-10 mb-4 text-gray-500" />
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              SVG, PNG, JPG or GIF (MAX. 5MB, MAX 3 NEW IMAGES)
            </p>
          </div>
          <Input
            id="dropzone-file"
            type="file"
            className="hidden"
            multiple
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </label>
      </div>

      {previews.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-2">Image Previews</h3>
          <div className="grid grid-cols-3 gap-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative group">
                <Image
                  src={preview}
                  alt={`Preview ${index}`}
                  className="w-full h-36 object-cover rounded shadow"
                  width={200}
                  height={200}
                />
                <button
                  type="button"
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                  onClick={() => removePreview(index)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {previews.length > 0 && (
        <div className="flex justify-end space-x-2">
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isUploading}
          >
            <X className="mr-2" /> Cancel
          </Button>
          <Button onClick={handleUpload} disabled={isUploading}>
            {isUploading ? (
              <>Uploading...</>
            ) : (
              <>
                <Upload className="mr-2" /> Upload
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import api from "@/lib/axios";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import { ApiResponse } from "@/types/response";

interface DeletePgDialogProps {
  pgId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeletePgDialog: React.FC<DeletePgDialogProps> = ({
  pgId,
  isOpen,
  onOpenChange,
}) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeletePg = async () => {
    setIsDeleting(true);
    try {
      const response = await api.delete<ApiResponse>(
        `/api/dashboard/pg/${pgId}`
      );

      if (response.data.success) {
        toast.success("PG deleted successfully");
        router.push("/dashboard/pgs");
      } else {
        toast.error(response.data.message || "Failed to delete PG");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while deleting PG");
    } finally {
      setIsDeleting(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete PG</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this PG? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeletePg}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <LoaderCircle className="mr-2 animate-spin" size={16} />{" "}
                Deleting...
              </>
            ) : (
              "Delete PG"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

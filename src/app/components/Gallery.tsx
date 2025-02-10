"use client";

import { useState, useEffect } from "react";
import {
  Lock,
  Share2,
  Grid,
  ImageIcon,
  BookOpen,
  Plus,
  Loader,
  UserPlus,
} from "lucide-react";
import Image from "next/image";
import FileUpload from "./ImageUpload";
import { AddFriendModal } from "./AddFriendModal";
import { createClient } from "../../../utils/superbase/client";
import { Button } from "@/components/ui/button";
import { handleShare } from "./ShareHandler";
import { checkGalleryPermissions } from "@/lib/permit";

interface ImageType {
  id: string;
  title: string;
  storage_path: string;
  visibility: "public" | "private" | "shared";
  user_id: string;
}

interface LoadingState {
  type: "fetch" | "move" | "share" | "none";
  imageId?: string;
}

interface GalleryPermissions {
  canView: boolean;
  canComment: boolean;
  canMove: boolean;
}

export default function Gallery() {
  const [activeTab, setActiveTab] = useState<"public" | "private" | "shared">(
    "public"
  );
  const [images, setImages] = useState<ImageType[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    type: "fetch",
  });
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [permissions, setPermissions] = useState<GalleryPermissions>({
    canView: false,
    canComment: false,
    canMove: false,
  });

  const supabase = createClient();

  const fetchPermissions = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      console.log("Fetching permissions for user:", user.id);
      const userPermissions = await checkGalleryPermissions(user.id);
      console.log("User permissions result:", {
        userId: user.id,
        permissions: userPermissions,
      });
      setPermissions(userPermissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  };

  const fetchImages = async () => {
    try {
      setLoadingState({ type: "fetch" });
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (!user) {
        setImages([]);
        return;
      }

      let query = supabase
        .from("gallery_images")
        .select("*")
        .order("created_at", { ascending: false });

      if (activeTab === "shared") {
        const [sharedWithYou, sharedByYou] = await Promise.all([
          supabase
            .from("gallery_shares_new")
            .select("owner_id")
            .eq("shared_with_email", user.email),
          supabase
            .from("gallery_shares_new")
            .select("owner_id")
            .eq("owner_id", user.id),
        ]);

        const ownerIds = [
          ...(sharedWithYou.data?.map((share) => share.owner_id) || []),
          ...(sharedByYou.data?.map((share) => share.owner_id) || []),
          user.id,
        ];

        const uniqueOwnerIds = [...new Set(ownerIds)];

        query = query.eq("visibility", "shared").in("user_id", uniqueOwnerIds);
      } else {
        query = query.eq("user_id", user.id).eq("visibility", activeTab);
      }

      const { data, error } = await query;
      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setLoadingState({ type: "none" });
    }
  };

  //handle submit
  const handleShareSubmit = async (
    email: string,
    role: "viewer" | "curator"
  ) => {
    try {
      setLoadingState({ type: "share" });
      console.log("Starting share process:", { email, role });
      await handleShare(email, role);
      console.log("Share process completed");
      await fetchImages();
    } catch (error) {
      console.error("Error in handleShareSubmit:", error);
      throw error;
    } finally {
      setLoadingState({ type: "none" });
    }
  };

  const updateVisibility = async (
    id: string,
    visibility: "public" | "private" | "shared"
  ) => {
    try {
      setLoadingState({ type: "move", imageId: id });

      const { error } = await supabase
        .from("gallery_images")
        .update({ visibility })
        .eq("id", id);

      if (error) throw error;

      await fetchImages();
    } catch (error) {
      console.error("Error updating visibility:", error);
    } finally {
      setLoadingState({ type: "none" });
    }
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchImages();
      fetchPermissions();
    });

    fetchImages();
    fetchPermissions();

    return () => subscription.unsubscribe();
  }, [activeTab]);

  const LoadingOverlay = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
      <Loader className="w-6 h-6 text-white animate-spin" />
    </div>
  );

  const TabLoadingOverlay = () => (
    <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-40">
      <div className="flex items-center space-x-2">
        <Loader className="w-5 h-5 text-indigo-600 animate-spin" />
        <span className="text-sm text-indigo-600 font-medium">Loading...</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-10xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex justify-center items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setActiveTab("public")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
              activeTab === "public"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <BookOpen size={18} />
            <span>Public</span>
          </button>
          <button
            onClick={() => setActiveTab("private")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
              activeTab === "private"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Lock size={18} />
            <span>Private</span>
          </button>
          <button
            onClick={() => setActiveTab("shared")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
              activeTab === "shared"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Share2 size={18} />
            <span>Shared</span>
          </button>
        </div>
      </div>

      {activeTab === "shared" && (
        <div className="w-full max-w-2xl mx-auto mb-6">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center space-x-2 py-6 border-2 border-dashed border-gray-300 hover:border-indigo-400 bg-white hover:bg-gray-50 transition-colors"
            onClick={() => setIsShareDialogOpen(true)}
          >
            <UserPlus className="w-5 h-5 text-gray-500" />
            <span className="text-gray-600 font-medium">
              Add Friend to Share With
            </span>
          </Button>
        </div>
      )}

      {activeTab === "public" && <FileUpload onImageUploaded={fetchImages} />}

      <AddFriendModal
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        onShareSubmit={handleShareSubmit}
      />

      <div className="relative mt-8">
        {loadingState.type === "fetch" && <TabLoadingOverlay />}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative group aspect-square rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
            >
              {loadingState.type === "move" &&
                loadingState.imageId === img.id && <LoadingOverlay />}

              {/* Download button overlay */}

              {/* why cant i see this button */}
              {activeTab === "shared" && ( 
                <div className="absolute top-2 right-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={async () => {
                      if (!permissions.canMove) {
                        // Show not permitted notification for viewers
                        alert(
                          "You don't have permission to download images. Only curators can download images."
                        );
                        return;
                      }

                      // Download logic only runs if user has canMove permission
                      const publicUrl = supabase.storage
                        .from("gallery")
                        .getPublicUrl(img.storage_path).data.publicUrl;
                      try {
                        const response = await fetch(publicUrl);
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = img.title || `image-${img.id}`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                      } catch (error) {
                        console.error("Error downloading image:", error);
                        alert("Failed to download image");
                      }
                    }}
                    className={`${
                      permissions.canMove
                        ? "bg-white/80 hover:bg-white"
                        : "bg-gray-200 hover:bg-gray-300"
                    } text-black p-2 rounded-full shadow-lg`}
                    title={
                      permissions.canMove
                        ? "Download Image"
                        : "Requires curator permission to download"
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </button>
                </div>
              )}

              <Image
                src={
                  supabase.storage
                    .from("gallery")
                    .getPublicUrl(img.storage_path).data.publicUrl
                }
                alt={img.title || `Image ${img.id}`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                className="object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
                <div className="text-white flex items-center space-x-2 text-sm">
                  {img.visibility === "private" ? (
                    <Lock size={16} className="text-indigo-300" />
                  ) : img.visibility === "shared" ? (
                    <Share2 size={16} className="text-green-300" />
                  ) : (
                    <BookOpen size={16} className="text-yellow-300" />
                  )}
                  <span className="capitalize">{img.visibility}</span>
                </div>

                {activeTab === "public" && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => updateVisibility(img.id, "private")}
                      className="bg-white/30 hover:bg-white/50 text-white p-1 rounded"
                      title="Make Private"
                      disabled={loadingState.type === "move"}
                    >
                      <Plus size={16} />
                      <Lock size={16} className="hidden sm:inline-block ml-1" />
                    </button>
                    <button
                      onClick={() => updateVisibility(img.id, "shared")}
                      className="bg-white/30 hover:bg-white/50 text-white p-1 rounded"
                      title="Make Shared"
                      disabled={loadingState.type === "move"}
                    >
                      <Plus size={16} />
                      <Share2
                        size={16}
                        className="hidden sm:inline-block ml-1"
                      />
                    </button>
                  </div>
                )}

                {(activeTab === "private" || activeTab === "shared") && (
                  <button
                    onClick={() => updateVisibility(img.id, "public")}
                    className="bg-white/30 hover:bg-white/50 text-white p-1 rounded"
                    title="Make Public"
                    disabled={loadingState.type === "move"}
                  >
                    <BookOpen size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex justify-center space-x-4">
        <button className="flex items-center space-x-2 px-6 py-3 bg-white text-gray-700 rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-shadow duration-200">
          <Grid size={18} />
          <span>Grid View</span>
        </button>
        <button className="flex items-center space-x-2 px-6 py-3 bg-white text-gray-700 rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-shadow duration-200">
          <ImageIcon size={18} />
          <span>Full Screen</span>
        </button>
      </div>
    </div>
  );
}

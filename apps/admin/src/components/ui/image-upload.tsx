"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiUpload } from "@/lib/api";
import type { UploadResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ACCEPT_IMAGES = "image/jpeg,image/png,image/webp,image/gif";

function getUploadUrl(data: UploadResponse | undefined): string {
  if (!data || typeof data !== "object") return "";
  return data.url ?? data.image_url ?? data.imageUrl ?? data.path ?? "";
}

export interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder: string;
  token?: string;
  label?: string;
  accept?: string;
  disabled?: boolean;
  className?: string;
  showUrlInput?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  folder,
  token,
  label = "الصورة",
  accept = ACCEPT_IMAGES,
  disabled = false,
  className,
  showUrlInput = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const hasValue = !!value.trim();

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار ملف صورة (JPEG أو PNG أو WebP أو GIF)");
      return;
    }

    if (!token) {
      toast.error("يجب تسجيل الدخول لرفع الصور");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("folder", folder);

      const res = await apiUpload<UploadResponse>("/upload/image", formData, { token });

      if (!res.success) {
        toast.error(res.message || "فشل رفع الصورة");
        return;
      }

      const url = getUploadUrl(res.data);
      if (!url) {
        toast.error("لم يُرجع الرابط بعد الرفع");
        return;
      }

      onChange(url);
      toast.success("تم رفع الصورة بنجاح");
    } catch {
      toast.error("فشل رفع الصورة");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  }

  function clearImage() {
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label ? <Label>{label}</Label> : null}
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            disabled={disabled || uploading}
            onChange={onInputChange}
          />

          {hasValue ? (
            <div className="relative h-36 w-36 shrink-0 overflow-hidden rounded-xl border border-border bg-muted sm:h-40 sm:w-40">
              <Image
                src={value}
                alt="معاينة"
                fill
                className="object-cover"
                sizes="160px"
                unoptimized
              />
              {!disabled && (
                <Button
                  type="button"
                  variant="danger"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={clearImage}
                  aria-label="حذف الصورة"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="h-36 w-36 shrink-0 flex-col gap-2 rounded-xl border-dashed sm:h-40 sm:w-40"
              disabled={disabled || uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="text-xs">جاري الرفع...</span>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-xs">رفع صورة</span>
                </>
              )}
            </Button>
          )}

          {hasValue && !disabled && !uploading ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              تغيير الصورة
            </Button>
          ) : null}
        </div>

        {showUrlInput ? (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="أو الصق رابط الصورة"
            dir="ltr"
            className="text-start"
            disabled={disabled || uploading}
          />
        ) : null}
      </div>
    </div>
  );
}

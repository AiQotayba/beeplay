"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { APP_CITIES } from "@beeplay/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ImageUpload } from "@/components/ui/image-upload";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { AdminStadiumRecord } from "@/features/stadiums/types";

type OwnerOption = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type FormState = {
  ownerId: string;
  name: string;
  description: string;
  city: string;
  area: string;
  address: string;
  morningPrice: string;
  eveningPrice: string;
  depositAmount: string;
  contactPhone: string;
  contactWhatsapp: string;
  coverImage: string;
  isActive: boolean;
  isSuspended: boolean;
};

const emptyForm = (ownerId = ""): FormState => ({
  ownerId,
  name: "",
  description: "",
  city: APP_CITIES[0],
  area: "",
  address: "",
  morningPrice: "",
  eveningPrice: "",
  depositAmount: "",
  contactPhone: "",
  contactWhatsapp: "",
  coverImage: "",
  isActive: true,
  isSuspended: false,
});

function formFromStadium(s: AdminStadiumRecord): FormState {
  return {
    ownerId: s.owner.id,
    name: s.name,
    description: s.description,
    city: s.city,
    area: s.area,
    address: s.address,
    morningPrice: String(s.morningPrice),
    eveningPrice: String(s.eveningPrice),
    depositAmount: s.depositAmount != null ? String(s.depositAmount) : "",
    contactPhone: s.contactPhone ?? "",
    contactWhatsapp: s.contactWhatsapp ?? "",
    coverImage: s.coverImage ?? "",
    isActive: s.isActive,
    isSuspended: s.isSuspended,
  };
}

interface StadiumFormSheetProps {
  open: boolean;
  mode: "create" | "edit";
  stadium: AdminStadiumRecord | null;
  token?: string;
  onClose: () => void;
  onSaved: (stadium: AdminStadiumRecord) => void;
}

export function StadiumFormSheet({
  open,
  mode,
  stadium,
  token,
  onClose,
  onSaved,
}: StadiumFormSheetProps) {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(mode === "edit" && stadium ? formFromStadium(stadium) : emptyForm());
  }, [open, mode, stadium]);

  useEffect(() => {
    if (!open || !token) return;
    let cancelled = false;
    (async () => {
      setLoadingOwners(true);
      const res = await api<OwnerOption[]>("/users?role=STADIUM_OWNER&limit=100", {
        token,
      });
      if (!cancelled) {
        setOwners(res.data ?? []);
        setLoadingOwners(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, token]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.ownerId) {
      setError("اختر صاحب الملعب");
      return;
    }

    setSaving(true);

    const payload: Record<string, unknown> = {
      ownerId: form.ownerId,
      name: form.name.trim(),
      description: form.description.trim(),
      city: form.city,
      area: form.area.trim(),
      address: form.address.trim(),
      morningPrice: Number(form.morningPrice),
      eveningPrice: Number(form.eveningPrice),
      ...(form.depositAmount !== "" && { depositAmount: Number(form.depositAmount) }),
      ...(form.contactPhone.trim() && { contactPhone: form.contactPhone.trim() }),
      ...(form.contactWhatsapp.trim() && {
        contactWhatsapp: form.contactWhatsapp.trim(),
      }),
      ...(form.coverImage.trim() && { coverImage: form.coverImage.trim() }),
    };

    if (mode === "edit") {
      payload.isActive = form.isActive;
      payload.isSuspended = form.isSuspended;
    }

    const res =
      mode === "create"
        ? await api<AdminStadiumRecord>("/stadiums/admin", {
            method: "POST",
            token,
            body: JSON.stringify(payload),
          })
        : await api<AdminStadiumRecord>(`/stadiums/${stadium!.id}`, {
            method: "PATCH",
            token,
            body: JSON.stringify(payload),
          });

    setSaving(false);

    if (!res.success || !res.data) {
      const firstErr = res.errors
        ? Object.values(res.errors)[0]?.[0]
        : res.message;
      setError(firstErr ?? "تعذر حفظ الملعب");
      return;
    }

    onSaved(res.data);
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      role="dialog"
      aria-modal
      aria-labelledby="stadium-form-title"
    >
      <Card className="w-full sm:max-w-lg max-h-[92dvh] flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-secondary shrink-0">
          <h2 id="stadium-form-title" className="font-bold text-sm">
            {mode === "create" ? "إضافة ملعب" : "تعديل الملعب"}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="إغلاق"
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="p-4 space-y-4 overflow-y-auto text-sm">
            {error && (
              <p className="rounded-lg bg-destructive/15 text-destructive text-xs px-3 py-2">
                {error}
              </p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="ownerId">صاحب الملعب *</Label>
              {loadingOwners ? (
                <Skeleton className="h-10 w-full rounded-xl" />
              ) : (
                <Select
                  value={form.ownerId || undefined}
                  onValueChange={(v) => set("ownerId", v)}
                >
                  <SelectTrigger id="ownerId" className="w-full">
                    <SelectValue placeholder="اختر صاحب الملعب" />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.firstName} {o.lastName} — {o.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name">اسم الملعب *</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">الوصف *</Label>
              <Textarea
                id="description"
                required
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="city">المدينة *</Label>
                <Select value={form.city} onValueChange={(v) => set("city", v)}>
                  <SelectTrigger id="city" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APP_CITIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="area">المنطقة *</Label>
                <Input
                  id="area"
                  required
                  value={form.area}
                  onChange={(e) => set("area", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">العنوان *</Label>
              <Input
                id="address"
                required
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="morningPrice">سعر الصباح (ل.س) *</Label>
                <Input
                  id="morningPrice"
                  required
                  type="number"
                  min={1}
                  value={form.morningPrice}
                  onChange={(e) => set("morningPrice", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="eveningPrice">سعر المساء (ل.س) *</Label>
                <Input
                  id="eveningPrice"
                  required
                  type="number"
                  min={1}
                  value={form.eveningPrice}
                  onChange={(e) => set("eveningPrice", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="depositAmount">العربون (ل.س)</Label>
              <Input
                id="depositAmount"
                type="number"
                min={0}
                value={form.depositAmount}
                onChange={(e) => set("depositAmount", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="contactPhone">هاتف التواصل</Label>
                <Input
                  id="contactPhone"
                  value={form.contactPhone}
                  onChange={(e) => set("contactPhone", e.target.value)}
                  dir="ltr"
                  className="text-start"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contactWhatsapp">واتساب</Label>
                <Input
                  id="contactWhatsapp"
                  value={form.contactWhatsapp}
                  onChange={(e) => set("contactWhatsapp", e.target.value)}
                  dir="ltr"
                  className="text-start"
                />
              </div>
            </div>

            <ImageUpload
              label="صورة الغلاف"
              value={form.coverImage}
              onChange={(url) => set("coverImage", url)}
              folder="stadiums"
              token={token}
              disabled={saving}
            />

              <div className="flex flex-col gap-4 pt-1 rounded-xl bg-secondary/50 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="isActive" className="text-sm text-foreground cursor-pointer">
                    ظاهر في التطبيق
                  </Label>
                  <Switch
                    id="isActive"
                    checked={form.isActive}
                    onCheckedChange={(checked) => set("isActive", checked)}
                  />
                </div>
              </div>
          </div>

          <div className="flex gap-2 border-t border-border p-4 shrink-0 bg-secondary">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              إلغاء
            </Button>
            <Button type="submit" variant="brand" className="flex-1" disabled={saving}>
              {saving ? "جاري الحفظ..." : mode === "create" ? "إنشاء الملعب" : "حفظ التعديلات"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

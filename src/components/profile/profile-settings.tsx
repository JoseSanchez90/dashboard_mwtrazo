"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Check, KeyRound, LoaderCircle, Trash2, UserRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  changeOwnPasswordAction,
  removeOwnAvatarAction,
  updateOwnProfileAction,
} from "@/app/(dashboard)/perfil/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  passwordChangeSchema,
  profileNameSchema,
  validateAvatarFile,
  type PasswordChangeInput,
  type ProfileNameInput,
} from "@/lib/validations/profile";
import { ROLE_LABELS, type UserRole } from "@/types/auth";

type ProfileSettingsProps = {
  user: {
    fullName: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    avatarUrl: string | null;
  };
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card">
      <div className="border-b px-5 py-4">
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const router = useRouter();
  const avatarInput = useRef<HTMLInputElement>(null);
  const [avatarPending, setAvatarPending] = useState(false);
  const [namePending, startNameTransition] = useTransition();
  const [passwordPending, startPasswordTransition] = useTransition();
  const [removePending, startRemoveTransition] = useTransition();

  const nameForm = useForm<ProfileNameInput>({
    resolver: zodResolver(profileNameSchema),
    defaultValues: { full_name: user.fullName },
  });
  const passwordForm = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { password: "", confirm_password: "" },
  });

  const saveName = nameForm.handleSubmit((input) => {
    startNameTransition(async () => {
      const result = await updateOwnProfileAction(input);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      nameForm.reset(input);
      toast.success("Nombre actualizado.");
      router.refresh();
    });
  });

  const savePassword = passwordForm.handleSubmit((input) => {
    startPasswordTransition(async () => {
      const result = await changeOwnPasswordAction(input);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      passwordForm.reset();
      toast.success("Contraseña actualizada.");
    });
  });

  async function uploadAvatar(file: File) {
    const fileError = validateAvatarFile(file);
    if (fileError) return toast.error(fileError);

    const body = new FormData();
    body.set("avatar", file);
    setAvatarPending(true);
    try {
      const response = await fetch("/api/profile/avatar", { method: "POST", body });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) return toast.error(result.error ?? "No fue posible subir el avatar.");
      toast.success("Avatar actualizado.");
      router.refresh();
    } catch {
      toast.error("La conexión se interrumpió durante la subida.");
    } finally {
      setAvatarPending(false);
      if (avatarInput.current) avatarInput.current.value = "";
    }
  }

  function removeAvatar() {
    startRemoveTransition(async () => {
      const result = await removeOwnAvatarAction();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Avatar eliminado.");
      router.refresh();
    });
  }

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.72fr)]">
      <div className="space-y-6">
        <Section
          title="Información personal"
          description="Actualiza el nombre visible en MWTRAZO. El correo es administrado por la cuenta de acceso."
        >
          <form onSubmit={saveName} className="space-y-5" noValidate>
            <Label className="flex flex-col items-stretch gap-2 text-sm font-medium">
              <span>Nombre completo</span>
              <Input
                {...nameForm.register("full_name")}
                aria-invalid={Boolean(nameForm.formState.errors.full_name)}
                autoComplete="name"
              />
              {nameForm.formState.errors.full_name && (
                <span className="block text-xs font-normal text-destructive">
                  {nameForm.formState.errors.full_name.message}
                </span>
              )}
            </Label>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Correo electrónico</p>
                <p className="mt-1.5 break-all text-sm">{user.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Rol</p>
                <p className="mt-1.5 text-sm">{ROLE_LABELS[user.role]}</p>
              </div>
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Estado</p>
                <p className="mt-1.5 inline-flex items-center gap-2 text-sm">
                  <span className={`size-2 rounded-full ${user.isActive ? "bg-status-success" : "bg-muted-foreground"}`} />
                  {user.isActive ? "Cuenta activa" : "Cuenta inactiva"}
                </p>
              </div>
            </div>
            <div className="flex justify-end border-t pt-4">
              <Button type="submit" disabled={namePending || !nameForm.formState.isDirty}>
                {namePending ? <LoaderCircle className="animate-spin" /> : <Check />}
                Guardar nombre
              </Button>
            </div>
          </form>
        </Section>

        <Section
          title="Seguridad"
          description="Define una contraseña nueva. MWTRAZO nunca almacena contraseñas en profiles."
        >
          <form onSubmit={savePassword} className="space-y-5" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Label className="flex flex-col items-stretch gap-2 text-sm font-medium">
                <span>Nueva contraseña</span>
                <Input
                  type="password"
                  autoComplete="new-password"
                  {...passwordForm.register("password")}
                  aria-invalid={Boolean(passwordForm.formState.errors.password)}
                />
                {passwordForm.formState.errors.password && (
                  <span className="block text-xs font-normal text-destructive">
                    {passwordForm.formState.errors.password.message}
                  </span>
                )}
              </Label>
              <Label className="flex flex-col items-stretch gap-2 text-sm font-medium">
                <span>Confirmar contraseña</span>
                <Input
                  type="password"
                  autoComplete="new-password"
                  {...passwordForm.register("confirm_password")}
                  aria-invalid={Boolean(passwordForm.formState.errors.confirm_password)}
                />
                {passwordForm.formState.errors.confirm_password && (
                  <span className="block text-xs font-normal text-destructive">
                    {passwordForm.formState.errors.confirm_password.message}
                  </span>
                )}
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">Utiliza al menos 12 caracteres y evita reutilizar contraseñas.</p>
            <div className="flex justify-end border-t pt-4">
              <Button type="submit" disabled={passwordPending}>
                {passwordPending ? <LoaderCircle className="animate-spin" /> : <KeyRound />}
                Cambiar contraseña
              </Button>
            </div>
          </form>
        </Section>
      </div>

      <div className="space-y-6">
        <Section
          title="Foto de perfil"
          description="JPG, PNG o WebP. Tamaño máximo de 2 MB."
        >
          <div className="flex flex-col items-center text-center">
            <Avatar className="size-28" aria-label={`Avatar de ${user.fullName}`}>
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
              <AvatarFallback className="bg-brand/10 text-2xl font-semibold text-brand">
                {initials(user.fullName)}
              </AvatarFallback>
            </Avatar>
            <p className="mt-4 font-semibold">{user.fullName}</p>
            <p className="mt-1 text-sm text-muted-foreground">{ROLE_LABELS[user.role]}</p>
            <Input
              ref={avatarInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              aria-label="Seleccionar nueva foto de perfil"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadAvatar(file);
              }}
            />
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button type="button" variant="outline" disabled={avatarPending || removePending} onClick={() => avatarInput.current?.click()}>
                {avatarPending ? <LoaderCircle className="animate-spin" /> : <Camera />}
                {user.avatarUrl ? "Reemplazar" : "Subir avatar"}
              </Button>
              {user.avatarUrl && (
                <Button type="button" variant="destructive" disabled={avatarPending || removePending} onClick={removeAvatar}>
                  {removePending ? <LoaderCircle className="animate-spin" /> : <Trash2 />}
                  Eliminar
                </Button>
              )}
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <UserRound className="size-3.5" />
              El archivo se almacena en un bucket privado.
            </p>
          </div>
        </Section>
      </div>
    </div>
  );
}

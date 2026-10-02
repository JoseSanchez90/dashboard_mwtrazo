"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  LoaderCircle,
  Pencil,
  Plus,
  UserRoundCheck,
  UserRoundX,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";

import {
  createUserAction,
  updateUserAction,
} from "@/app/(dashboard)/usuarios/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppSelect } from "@/components/shared/app-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/lib/validations/users";
import { ROLE_LABELS, USER_ROLES, type ManagedUser } from "@/types/auth";

const fieldClass = "space-y-2";
const labelClass = "text-sm font-medium";
const errorClass = "text-xs text-destructive";

function RoleSelect({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: "admin" | "assistant") => void;
  disabled?: boolean;
}) {
  return <AppSelect value={value} onValueChange={(next) => onChange(next as "admin" | "assistant")} disabled={disabled} options={USER_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }))} />;
}

export function CreateUserButton() {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      role: "assistant",
    },
  });
  const selectedRole = useWatch({ control, name: "role" });

  const submit = handleSubmit((values) => {
    setServerError("");
    startTransition(async () => {
      const result = await createUserAction(values);
      if (!result.ok) return setServerError(result.error);
      reset();
      setOpen(false);
      router.refresh();
    });
  });

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        Crear usuario
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Crear usuario</DialogTitle>
            <DialogDescription>
              La cuenta quedará confirmada y lista para iniciar sesión.
            </DialogDescription>
          </DialogHeader>
          <form
            id="create-user-form"
            onSubmit={submit}
            className="grid gap-4 py-2"
            noValidate
          >
            <div className={fieldClass}>
              <Label htmlFor="new-full-name" className={labelClass}>
                Nombre completo
              </Label>
              <Input
                id="new-full-name"
                aria-invalid={Boolean(errors.full_name)}
                {...register("full_name")}
              />
              {errors.full_name && (
                <p className={errorClass}>{errors.full_name.message}</p>
              )}
            </div>
            <div className={fieldClass}>
              <Label htmlFor="new-email" className={labelClass}>
                Correo electrónico
              </Label>
              <Input
                id="new-email"
                type="email"
                aria-invalid={Boolean(errors.email)}
                {...register("email")}
              />
              {errors.email && (
                <p className={errorClass}>{errors.email.message}</p>
              )}
            </div>
            <div className={fieldClass}>
              <Label htmlFor="new-password" className={labelClass}>
                Contraseña temporal
              </Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.password)}
                {...register("password")}
              />
              {errors.password && (
                <p className={errorClass}>{errors.password.message}</p>
              )}
            </div>
            <div className={fieldClass}>
              <Label htmlFor="new-role" className={labelClass}>
                Rol
              </Label>
              <RoleSelect
                value={selectedRole}
                onChange={(role) =>
                  setValue("role", role, { shouldValidate: true })
                }
              />
            </div>
            {serverError && (
              <p
                role="alert"
                className="rounded-lg bg-destructive/5 p-3 text-sm text-destructive"
              >
                {serverError}
              </p>
            )}
          </form>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" form="create-user-form" disabled={pending}>
              {pending && <LoaderCircle className="animate-spin" />}Crear
              usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EditUserButton({ user }: { user: ManagedUser }) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      id: user.id,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
    },
  });
  const selectedRole = useWatch({ control, name: "role" });

  const submit = handleSubmit((values) => {
    setServerError("");
    startTransition(async () => {
      const result = await updateUserAction(values);
      if (!result.ok) return setServerError(result.error);
      setOpen(false);
      router.refresh();
    });
  });

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Editar a ${user.full_name}`}
        onClick={() => {
          reset({
            id: user.id,
            full_name: user.full_name,
            role: user.role,
            is_active: user.is_active,
          });
          setOpen(true);
        }}
      >
        <Pencil />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
            <DialogDescription>{user.email}</DialogDescription>
          </DialogHeader>
          <form
            id={`edit-${user.id}`}
            onSubmit={submit}
            className="grid gap-4 py-2"
            noValidate
          >
            <Input type="hidden" {...register("id")} />
            <div className={fieldClass}>
              <Label htmlFor={`name-${user.id}`} className={labelClass}>
                Nombre completo
              </Label>
              <Input
                id={`name-${user.id}`}
                aria-invalid={Boolean(errors.full_name)}
                {...register("full_name")}
              />
              {errors.full_name && (
                <p className={errorClass}>{errors.full_name.message}</p>
              )}
            </div>
            <div className={fieldClass}>
              <span className={labelClass}>Rol</span>
              <RoleSelect
                value={selectedRole}
                onChange={(role) =>
                  setValue("role", role, { shouldValidate: true })
                }
              />
            </div>
            <Label className="flex items-center justify-between rounded-lg border p-3">
              <span>
                <span className="block text-sm font-medium">
                  Usuario activo
                </span>
                <span className="text-xs text-muted-foreground">
                  Puede iniciar sesión y acceder a MWTRAZO.
                </span>
              </span>
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                    aria-label="Usuario activo"
                  />
                )}
              />
            </Label>
            {serverError && (
              <p
                role="alert"
                className="rounded-lg bg-destructive/5 p-3 text-sm text-destructive"
              >
                {serverError}
              </p>
            )}
          </form>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" form={`edit-${user.id}`} disabled={pending}>
              {pending && <LoaderCircle className="animate-spin" />}Guardar
              cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export function UsersTable({ users }: { users: ManagedUser[] }) {
  return (
    <div className="mt-8 overflow-hidden rounded-xl border bg-card">
        <Table className="min-w-[760px]">
          <TableHeader className="bg-muted/40 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <TableRow>
              <TableHead className="px-4">Nombre</TableHead>
              <TableHead className="px-4">Correo</TableHead>
              <TableHead className="px-4">Rol</TableHead>
              <TableHead className="px-4">Estado</TableHead>
              <TableHead className="px-4">Creación</TableHead>
              <TableHead className="px-4 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="px-4 font-medium">{user.full_name}</TableCell>
                <TableCell className="px-4 text-muted-foreground">
                  {user.email}
                </TableCell>
                <TableCell className="px-4">
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                    {ROLE_LABELS[user.role]}
                  </span>
                </TableCell>
                <TableCell className="px-4">
                  <span
                    className={
                      user.is_active
                        ? "inline-flex items-center gap-1.5 text-xs font-medium text-status-success"
                        : "inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
                    }
                  >
                    {user.is_active ? (
                      <>
                        <UserRoundCheck className="size-4" />
                        Activo
                      </>
                    ) : (
                      <>
                        <UserRoundX className="size-4" />
                        Inactivo
                      </>
                    )}
                  </span>
                </TableCell>
                <TableCell className="px-4 text-muted-foreground">
                  {formatDate(user.created_at)}
                </TableCell>
                <TableCell className="px-4 text-right">
                  <EditUserButton user={user} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      {users.length === 0 && (
        <div className="flex flex-col items-center p-12 text-center">
          <Check className="mb-3 size-6 text-muted-foreground" />
          <p className="font-medium">No hay usuarios para mostrar</p>
        </div>
      )}
    </div>
  );
}

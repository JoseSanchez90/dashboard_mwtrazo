"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) { return <CommandPrimitive className={cn("flex h-full w-full flex-col overflow-hidden rounded-xl bg-popover text-popover-foreground", className)} {...props} />; }
function CommandDialog({ title = "Búsqueda global", description = "Busca proyectos, clientes y tareas.", children, ...props }: Omit<React.ComponentProps<typeof Dialog>, "children"> & { title?: string; description?: string; children: React.ReactNode }) { return <Dialog {...props}><DialogContent className="overflow-hidden p-0 sm:max-w-xl" showCloseButton={false}><DialogHeader className="sr-only"><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader><Command shouldFilter={false}>{children}</Command></DialogContent></Dialog>; }
function CommandInput({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Input>) { return <div className="flex h-12 items-center gap-2 border-b px-4"><Search className="size-4 text-muted-foreground" /><CommandPrimitive.Input className={cn("h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground", className)} {...props} /></div>; }
function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) { return <CommandPrimitive.List className={cn("max-h-[22rem] overflow-y-auto p-2", className)} {...props} />; }
function CommandEmpty(props: React.ComponentProps<typeof CommandPrimitive.Empty>) { return <CommandPrimitive.Empty className="py-10 text-center text-sm text-muted-foreground" {...props} />; }
function CommandGroup({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Group>) { return <CommandPrimitive.Group className={cn("overflow-hidden p-1 text-sm [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground", className)} {...props} />; }
function CommandItem({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) { return <CommandPrimitive.Item className={cn("flex cursor-default items-center gap-3 rounded-lg px-2 py-2.5 text-sm outline-none data-[selected=true]:bg-muted data-[disabled=true]:opacity-50", className)} {...props} />; }
function CommandSeparator({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Separator>) { return <CommandPrimitive.Separator className={cn("-mx-1 h-px bg-border", className)} {...props} />; }
export { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator };


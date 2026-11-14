"use client";

import { PanelLeft } from "lucide-react";
import { Suspense, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { AppNav, AppNavLinks } from "./app-nav";

/**
 * En tablet (768–1023 px) la barra lateral se oculta y se abre con un botón, como una hoja flotante.
 * En el celular la navegación va en la barra de pestañas inferior.
 */
export function MenuMovil({ marca }: { marca: ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  const cerrar = () => setAbierto(false);
  return (
    <Sheet open={abierto} onOpenChange={setAbierto}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="hidden md:inline-flex lg:hidden" aria-label="Abrir la barra lateral">
          <PanelLeft aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 gap-6 p-3 pt-4">
        <SheetHeader className="p-0 pe-10">
          <SheetTitle className="sr-only">Barra lateral</SheetTitle>
          <SheetDescription className="sr-only">Secciones de Prisma</SheetDescription>
          {marca}
        </SheetHeader>
        <Suspense fallback={<AppNavLinks entidad={null} onNavigate={cerrar} />}>
          <AppNav onNavigate={cerrar} />
        </Suspense>
      </SheetContent>
    </Sheet>
  );
}

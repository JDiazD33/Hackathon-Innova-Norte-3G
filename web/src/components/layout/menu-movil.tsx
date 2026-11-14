"use client";

import { Menu } from "lucide-react";
import { Suspense, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { AppNav, AppNavLinks } from "./app-nav";

/** En pantallas pequeñas, la barra lateral se abre como un panel. */
export function MenuMovil({ marca }: { marca: ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  const cerrar = () => setAbierto(false);
  return (
    <Sheet open={abierto} onOpenChange={setAbierto}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir el menú">
          <Menu aria-hidden="true" className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 gap-6 bg-sidebar p-4">
        <SheetHeader className="p-0">
          <SheetTitle className="sr-only">Menú</SheetTitle>
          <SheetDescription className="sr-only">Secciones de la aplicación</SheetDescription>
          {marca}
        </SheetHeader>
        <Suspense fallback={<AppNavLinks entidad={null} onNavigate={cerrar} />}>
          <AppNav onNavigate={cerrar} />
        </Suspense>
      </SheetContent>
    </Sheet>
  );
}

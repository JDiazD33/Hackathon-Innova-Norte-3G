# 0005 · Web con Next.js, TypeScript, Tailwind CSS y shadcn/ui

**Contexto.** La interfaz debe verse profesional y bonita desde el primer día, ser accesible, mostrar tablas y gráficos, y desplegarse gratis. El equipo conoce TypeScript por la hackathon anterior.

**Decisión.**
- Next.js (App Router) con TypeScript, en la versión estable vigente al crear el proyecto.
- Tailwind CSS para los estilos y shadcn/ui para los componentes, que son accesibles porque se basan en primitivas de Radix.
- Recharts, mediante los gráficos de shadcn/ui, y TanStack Table para la bandeja.
- Tema propio definido con tokens en `globals.css`, en modo claro y oscuro ([sistema de diseño](../diseno/sistema-de-diseno.md)).
- Los datos se leen solo a través de las interfaces `DataSource` y `ReviewStore` ([arquitectura](../arquitectura/arquitectura.md#web-nextjs--typescript--tailwind-css--shadcnui)).

**Consecuencias.**
- Componentes de calidad sin diseñarlos desde cero, y libertad para personalizarlos porque viven en nuestro repositorio.
- El despliegue en Vercel es directo, y también se puede ejecutar en local para la demo sin internet.
- La versión de Next.js y los comandos reales se registran en `CONTRIBUTING.md` al crear `web/`.

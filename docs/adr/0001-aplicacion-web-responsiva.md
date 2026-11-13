# 0001 · Aplicación web responsiva, no móvil nativa

**Contexto.** El jurado y las personas que validan necesitan abrir el prototipo desde un enlace; la ficha técnica pide justamente el enlace o archivo del prototipo. El usuario principal trabaja en escritorio, con el SEACE y Excel. Tenemos 12 días. El equipo conoce TypeScript y Flutter.

**Decisión.** Construir una aplicación web responsiva, diseñada primero para escritorio y legible en tablet y celular. No habrá aplicaciones nativas de Android ni de iOS en el MVP.

**Consecuencias.**
- Un solo código, despliegue gratuito y acceso inmediato con un enlace.
- En el celular, el MVP muestra la información en modo lectura. Las acciones de revisión están pensadas para escritorio.
- Si más adelante se necesitan notificaciones móviles, se evaluará una PWA antes que una aplicación nativa.

# Pruebas de carga y seguridad

Hechas el 14 de noviembre de 2026 por el Lote B (parte 9), sobre el código de `main` con el diseño Prisma y el fixture. Resumen en el [plan de validación](../entregables/plan-de-validacion.md).

## Dónde y con qué

- **Dónde:** la demo de producción en una laptop (`npm run build` y `npm run start -- -p 3001`), con un solo proceso de Node.
- **No se probó contra el enlace público de Vercel.** Saturar a propósito la infraestructura de un tercero puede violar sus condiciones de uso.
- **Herramienta:** [autocannon](https://github.com/mcollina/autocannon) 8.0.0 (MIT), usada con `npx` sin agregarla al proyecto y borrada al terminar.
- **Métrica:** autocannon informa el percentil 97,5 de la latencia, más exigente que el p95 de la meta.

## Carga: 50 usuarios simultáneos durante 20 segundos

| Ruta | Pedidos por segundo | p50 | p97,5 | p99 | Errores |
|---|---|---|---|---|---|
| `/` (panel) | 245 | 196 ms | 236 ms | 247 ms | 0 |
| `/senales` (bandeja) | 179 | 272 ms | 305 ms | 307 ms | 0 |
| `/senales?entidad=entidad-0002` | 250 | 195 ms | 225 ms | 228 ms | 0 |
| `/api/busqueda?entidad=entidad-0001` | 3 883 | 11 ms | 22 ms | 25 ms | 0 |

**Resultado:** cumple la meta (p95 por debajo de 1 segundo y sin errores) con mucho margen.

## Estrés: intento de saturar la bandeja durante 15 segundos

| Conexiones simultáneas | Pedidos por segundo | p50 | p97,5 | p99 | Conexiones vencidas |
|---|---|---|---|---|---|
| 200 | 166 | 652 ms | 1 446 ms | 6 019 ms | 78 |
| 500 | 167 | 579 ms | 2 522 ms | 6 258 ms | 106 (y 281 rechazadas) |

**Lectura:** un solo proceso en la laptop atiende unos 167 pedidos por segundo en la bandeja. Por encima de eso, las respuestas se hacen lentas y algunas conexiones vencen a los 10 segundos.

- El servidor **no se cae**: al terminar el estrés respondió normal (200 en 1,1 s).
- En Vercel cada pedido lo atiende una función que escala sola, así que este límite es el de la demo local, no el del enlace público.
- Para un piloto con más usuarios, la [ruta de escalamiento](arquitectura.md#ruta-de-escalamiento) ya prevé API y base de datos.

## Seguridad

| Prueba | Resultado antes | Después de la corrección |
|---|---|---|
| Recorrer carpetas: `?entidad=../../../etc/passwd`, `..%2F..%2Fpackage`, byte nulo | 400 "Entidad no válida" | Igual |
| HTML o script en la URL: `?entidad=<script>alert(1)</script>` | La API responde 400; la página lo ignora y el texto sale escapado (no se ejecuta) | Igual |
| Id de 5 000 caracteres en `/api/busqueda` | **500 (error del servidor)** | 400: los ids tienen un largo máximo de 128 caracteres |
| Id con formato válido pero inexistente (`entidad-9999`) | **200 con `[]`, y quedaba en caché**: con miles de ids inventados se podía llenar la memoria | 404 "Entidad no encontrada", sin pasar por la caché |
| Métodos POST, PUT, DELETE y PATCH en la API | 405 | Igual |
| Archivos internos: `/.env`, `/data/fixture/manifest.json`, `/_next/../package.json` | 404 | Igual |
| Cabeceras de seguridad | **Faltaban**; la demo anunciaba `X-Powered-By: Next.js`. Vercel ya agrega HSTS | `Content-Security-Policy` (`frame-ancestors 'none'`, `base-uri`, `form-action` y `object-src`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` y `Cross-Origin-Opener-Policy`; sin `X-Powered-By` |
| Dependencias (`npm audit --omit=dev`) | 0 altas o críticas; 2 bajas y 4 moderadas, todas en el paquete `shadcn`, una herramienta de línea de comandos de la que la web solo importa un CSS durante el build. Ese código no llega al servidor ni al navegador | Sin cambios: no son explotables en la demo. Se revisan al actualizar shadcn |
| Secretos | Ninguno en los archivos versionados ni en el build del cliente. `pipeline/.env.example` no trae valores | — |

**Las correcciones** están en `web/src/lib/data/types.ts` (largo máximo del id), `web/src/app/api/busqueda/route.ts` (404 antes de leer la caché) y `web/next.config.ts` (cabeceras). Las protege la prueba `web/src/lib/data/seguridad.test.ts`.

**Después de corregir:** se repitieron las pruebas.

- La carga de la bandeja dio un p97,5 de 461 ms; la medición de 10 segundos se hizo justo después de reiniciar el servidor.
- La del buscador dio 28 ms, sin errores.
- La página funciona igual con las cabeceras nuevas: en la consola solo aparecen los 404 de las pantallas que todavía no existen (Revisión, Metodología y las fichas).

## Pendiente

- Repetir la prueba con el paquete real (`PAQUETE_DATOS=publico`), que tiene más procesos por entidad.
- Una `Content-Security-Policy` completa, con `script-src`, necesita nonces de Next.js; queda para el piloto.

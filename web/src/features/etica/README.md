# Transparencia y lenguaje · Lote D (André)

- **Código (ahora):**
  - una prueba automática de vocabulario que falla si la interfaz usa "corrupción", "corrupto", "fraude", "irregular", "sospechoso" o "culpable" fuera de la lista de frases permitidas;
  - el contenido de la metodología en `metodologia.ts` (señales, fórmula de prioridad, referentes con sus licencias, fuente y límites de los datos).
- **Interfaz (después):** página `/metodologia`, atribución en el pie y etiqueta "Dato simulado".
- **Spec:** `openspec/changes/lote-d-revision-y-transparencia/specs/etica/transparencia-y-lenguaje/spec.md`

## Parte 1 implementada

`buildMethodology(manifest)` en `metodologia.ts` prepara el contenido de la futura página: catálogo, señales activas y desactivadas, fórmula, pesos, cortes, referentes y licencias, fuente, atribución, fecha de corte, versión, exclusiones y límites. Las reglas resumen el catálogo v1 y distinguen sus parámetros iniciales de los valores usados por cada paquete. No atribuye el fixture a datos reales del OECE.

Las bibliotecas del pipeline se identifican como previstas mientras el Lote A no las integre. La licencia específica del PDF de la guía de OCP sigue señalada como pendiente de confirmar, como indica el documento de referentes.

`vocabulario.test.ts` recorre los archivos `.ts` y `.tsx` de `src/`, incluidos los de pruebas, excepto su propio archivo y `vocabulario.ts`. Revisa literales de texto, fragmentos de plantillas y texto JSX mediante el analizador de TypeScript; no interpreta comentarios, nombres de variables ni expresiones regulares como textos de interfaz. Normaliza tildes y mayúsculas, detecta también variaciones de género y plural e informa archivo, línea y palabra.

Las excepciones son frases completas, justificadas y restringidas al archivo de metodología en `vocabulario.ts`. Una frase permitida no habilita otras palabras del mismo párrafo ni el uso de esa frase en una tarjeta de caso. Las pruebas comprueban que un componente con vocabulario prohibido produce una detección y que las frases generales de metodología pasan.

Quedan pendientes la página visual, la atribución en el pie y el componente de dato simulado, junto con la comprobación de red y accesibilidad sobre las pantallas terminadas.

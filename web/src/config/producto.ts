/**
 * Nombre, frase y descripción del producto. Es el único lugar donde se definen (ADR 0006 y ADR 0008):
 * la marca, la cabecera y el título de cada pestaña ("Panel · Prisma") los toman de aquí.
 */
export const producto = {
  nombre: "Prisma",
  frase: "Señales explicables para revisar compras públicas",
  descripcion:
    "Prisma descompone los datos de contrataciones públicas en señales que una persona puede entender y revisar.",
} as const;

import { describe, expect, it } from "vitest";

import { conEntidad, elegirEntidad, entidadPorDefecto, type EntidadResumen } from "./entidad";

const entidades: EntidadResumen[] = [
  { id: "entidad-a", nombre: "Municipalidad B", tipo: "municipalidad", procesos: 10, procesosConSenales: 2 },
  { id: "entidad-b", nombre: "Universidad A", tipo: "universidad", procesos: 20, procesosConSenales: 9 },
  { id: "entidad-c", nombre: "Gobierno C", tipo: "gobierno regional", procesos: 5, procesosConSenales: 9 },
];

describe("elegirEntidad", () => {
  it("devuelve la entidad pedida en la URL", () => {
    expect(elegirEntidad(entidades, "entidad-a")?.id).toBe("entidad-a");
    expect(elegirEntidad(entidades, ["entidad-a", "entidad-b"])?.id).toBe("entidad-a");
  });

  it("usa la de más procesos con señales si falta o no existe (en empate, por nombre)", () => {
    expect(entidadPorDefecto(entidades)?.id).toBe("entidad-c");
    expect(elegirEntidad(entidades, undefined)?.id).toBe("entidad-c");
    expect(elegirEntidad(entidades, "entidad-inexistente")?.id).toBe("entidad-c");
    expect(elegirEntidad([], "entidad-a")).toBeNull();
  });
});

describe("conEntidad", () => {
  it("agrega la entidad a la ruta solo si existe", () => {
    expect(conEntidad("/senales", "entidad-a")).toBe("/senales?entidad=entidad-a");
    expect(conEntidad("/senales", null)).toBe("/senales");
  });
});

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";
import { describe, expect, it } from "vitest";

import { ALLOWED_PHRASES, FORBIDDEN_PATTERN, normalizeVocabulary } from "./vocabulario";

const SOURCE_DIR = fileURLToPath(new URL("../../", import.meta.url));
const EXCLUDED = new Set(["features/etica/vocabulario.test.ts", "features/etica/vocabulario.ts"]);

function scanText(text: string, file: string): string[] {
  let normalized = normalizeVocabulary(text);
  for (const item of ALLOWED_PHRASES) {
    if ((item.files as readonly string[]).includes(file)) {
      const phrase = normalizeVocabulary(item.phrase);
      normalized = normalized.split(phrase).join(" ".repeat(phrase.length));
    }
  }
  return [...normalized.matchAll(new RegExp(FORBIDDEN_PATTERN.source, "g"))].map((match) => match[0]);
}

/** Revisa texto TS/TSX, no comentarios, nombres de variables ni expresiones regulares. */
function scanSource(source: string, file: string): { file: string; line: number; word: string }[] {
  const syntax = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const violations: { file: string; line: number; word: string }[] = [];
  function visit(node: ts.Node) {
    if (ts.isStringLiteralLike(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node) || ts.isJsxText(node)) {
      for (const word of scanText(node.text, file)) {
        violations.push({ file, line: syntax.getLineAndCharacterOfPosition(node.getStart(syntax)).line + 1, word });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(syntax);
  return violations;
}

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(dir, entry.name);
    return entry.isDirectory() ? sourceFiles(target) : /\.(ts|tsx)$/.test(entry.name) ? [target] : [];
  });
}

describe("Vocabulario de los textos de interfaz", () => {
  it("todos los textos TS y TSX respetan las palabras y excepciones documentadas", () => {
    const violations = sourceFiles(SOURCE_DIR).flatMap((file) => {
      const relative = path.relative(SOURCE_DIR, file).replaceAll("\\", "/");
      return EXCLUDED.has(relative) ? [] : scanSource(fs.readFileSync(file, "utf8"), relative);
    });
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });

  it("falla con posible fraude en un componente y señala el archivo, la línea y la palabra", () => {
    expect(scanSource('export const Card = () => <p>posible fraude</p>;', "features/panel/card.tsx"))
      .toEqual([{ file: "features/panel/card.tsx", line: 1, word: "fraude" }]);
  });

  it.each(["CORRUPCIÓN", "corrupcion", "CoRrÚpTo", "FRAUDE", "IRREGULAR", "sospechoso", "Culpable", "corruptas", "irregularidades"])(
    "detecta el término sin distinguir tildes ni mayúsculas: %s", (word) => {
      expect(scanText(word, "app/page.tsx")).toHaveLength(1);
    },
  );

  it("permite solo las frases completas y solo en el archivo de metodología", () => {
    for (const item of ALLOWED_PHRASES) {
      expect(scanText(item.phrase.toUpperCase(), "features/etica/metodologia.ts")).toEqual([]);
      expect(scanText(item.phrase, "features/fichas/card.tsx")).not.toEqual([]);
    }
    expect(scanText("Una señal no prueba corrupción. Este proveedor es corrupto.", "features/etica/metodologia.ts")).toEqual(["corrupto"]);
  });

  it("revisa literales, JSX y fragmentos de plantillas con interpolaciones", () => {
    const source = 'const a = "fraude"; const b = `corrupción ${name} culpable`; const c = <p>sospechoso</p>;';
    expect(scanSource(source, "app/page.tsx").map((item) => item.word)).toEqual(["fraude", "corrupcion", "culpable", "sospechoso"]);
  });

  it("una frase permitida no autoriza un término añadido ni una coincidencia parcial", () => {
    expect(scanText("Una señal no prueba corrupción grave.", "features/etica/metodologia.ts")).toEqual(["corrupcion"]);
    expect(scanSource('const text = "Señal que amerita revisión";', "app/page.tsx")).toEqual([]);
  });
});

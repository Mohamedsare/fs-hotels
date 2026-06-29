import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type Column<T> = {
  /** Identifiant unique de colonne (clé React). */
  key: string;
  /** En-tête affiché. */
  header: ReactNode;
  /** Contenu de la cellule pour une ligne donnée. */
  cell: (row: T) => ReactNode;
  /** Alignement (les valeurs numériques vont à droite). */
  align?: "left" | "right" | "center";
  /** Classes additionnelles sur la cellule + l'en-tête. */
  className?: string;
};

/** Tiret discret pour une valeur absente. */
export function Dash() {
  return <span className="text-fs-on-surface-variant">—</span>;
}

function alignClass(align?: "left" | "right" | "center") {
  return align === "right"
    ? "text-right"
    : align === "center"
      ? "text-center"
      : "text-left";
}

/**
 * Tableau de données FasoStock — conteneur en carte, en-tête discret, lignes
 * survolables, défilement horizontal sur petit écran (`fs-scroll-x`).
 * Compatible composant serveur (purement présentiel).
 *
 * `rowHref` rend toute la ligne cliquable (lien superposé sur la 1re cellule).
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowHref,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  rowHref?: (row: T) => string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-fs-card">
      <div className="fs-scroll-x">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-fs-surface-low text-fs-on-surface-variant">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    "whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide",
                    alignClass(col.align),
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const href = rowHref?.(row);
              return (
                <tr
                  key={rowKey(row)}
                  className={cn(
                    "relative border-t border-black/6 transition-colors first:border-t-0",
                    href
                      ? "cursor-pointer hover:bg-fs-surface-container/70"
                      : "hover:bg-fs-surface-container/45",
                  )}
                >
                  {columns.map((col, i) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-3 align-middle",
                        alignClass(col.align),
                        col.align === "right" && "tabular-nums",
                        col.className,
                      )}
                    >
                      {href && i === 0 ? (
                        <Link
                          href={href}
                          aria-label="Ouvrir"
                          className="absolute inset-0"
                        />
                      ) : null}
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

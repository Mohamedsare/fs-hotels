// Tableau de bord hôtel (squelette MVP — hotels.md §A).
// Les chiffres seront branchés sur la base (chambres / arrivées / CA) en phase suivante.

const CARDS: { label: string; value: string; hint?: string }[] = [
  { label: "Chambres libres", value: "—" },
  { label: "Chambres occupées", value: "—" },
  { label: "Arrivées du jour", value: "—" },
  { label: "Départs du jour", value: "—" },
  { label: "CA du jour", value: "—", hint: "FCFA" },
  { label: "Taux d'occupation", value: "—", hint: "%" },
];

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Tableau de bord</h1>
      <p className="mt-1 text-sm text-fs-on-surface-variant">
        Vue d&apos;ensemble de l&apos;hôtel — squelette en place, données à
        brancher.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {CARDS.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-black/10 bg-fs-card p-4"
          >
            <div className="text-xs font-medium text-fs-on-surface-variant">
              {c.label}
            </div>
            <div className="mt-1 text-2xl font-extrabold">
              {c.value}
              {c.hint ? (
                <span className="ml-1 text-sm font-semibold text-fs-on-surface-variant">
                  {c.hint}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
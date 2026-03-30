const teal = "hsl(179, 100%, 39%)";
const tealLight = "hsla(179, 100%, 39%, 0.1)";
const tealMed = "hsla(179, 100%, 39%, 0.2)";

export function BrowserChrome({ children, url = "app.agencyboost.com" }: { children: React.ReactNode; url?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden max-w-5xl mx-auto">
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 mx-4">
          <div className="bg-white rounded-md px-3 py-1 text-xs text-gray-400 border border-gray-200 max-w-md mx-auto text-center">
            {url}
          </div>
        </div>
      </div>
      <div className="bg-gray-50">{children}</div>
    </div>
  );
}

export function MockSidebar({ active, items }: { active: string; items: string[] }) {
  return (
    <div className="w-48 bg-white border-r border-gray-200 p-3 flex-shrink-0">
      <div className="flex items-center gap-2 mb-4 px-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: teal }}>AB</div>
        <span className="text-sm font-semibold text-gray-900">AgencyBoost</span>
      </div>
      <div className="space-y-0.5">
        {items.map((item) => (
          <div
            key={item}
            className={`px-2 py-1.5 rounded-md text-xs font-medium ${
              item === active ? "text-white" : "text-gray-600 hover:bg-gray-50"
            }`}
            style={item === active ? { backgroundColor: teal } : undefined}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatusBadge({ label, color }: { label: string; color: "green" | "yellow" | "red" | "blue" | "gray" | "teal" }) {
  const colors = {
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
    gray: "bg-gray-100 text-gray-600",
    teal: "text-white",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${colors[color]}`}
      style={color === "teal" ? { backgroundColor: teal } : undefined}
    >
      {label}
    </span>
  );
}

export function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <div className="text-[10px] text-gray-500 mb-1">{label}</div>
      <div className="text-lg font-bold text-gray-900">{value}</div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color: teal }}>{sub}</div>}
    </div>
  );
}

export function AvatarCircle({ initials, color }: { initials: string; color?: string }) {
  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
      style={{ backgroundColor: color || teal }}
    >
      {initials}
    </div>
  );
}

export function DataRow({ cells, header }: { cells: React.ReactNode[]; header?: boolean }) {
  return (
    <div className={`grid gap-2 px-3 py-2 text-xs ${header ? "bg-gray-50 font-medium text-gray-500 border-b border-gray-200" : "border-b border-gray-100 text-gray-700"}`} style={{ gridTemplateColumns: `repeat(${cells.length}, 1fr)` }}>
      {cells.map((cell, i) => <div key={i} className="truncate">{cell}</div>)}
    </div>
  );
}

export function KanbanColumn({ title, color, cards }: { title: string; color: string; cards: { name: string; sub: string; badge?: string; badgeColor?: "green" | "yellow" | "red" | "blue" | "gray" | "teal" }[] }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2 min-w-[140px] flex-1">
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-[10px] font-semibold text-gray-700">{title}</span>
        <span className="text-[10px] text-gray-400 ml-auto">{cards.length}</span>
      </div>
      <div className="space-y-1.5">
        {cards.map((card, i) => (
          <div key={i} className="bg-white rounded-md p-2 border border-gray-200 shadow-sm">
            <div className="text-[11px] font-medium text-gray-900 mb-0.5">{card.name}</div>
            <div className="text-[9px] text-gray-500">{card.sub}</div>
            {card.badge && <div className="mt-1"><StatusBadge label={card.badge} color={card.badgeColor || "gray"} /></div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-1.5">
      <div className="h-1.5 rounded-full" style={{ width: `${value}%`, backgroundColor: color || teal }} />
    </div>
  );
}

export function MockupSection({ children }: { children: React.ReactNode }) {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {children}
      </div>
    </section>
  );
}

export { teal, tealLight, tealMed };

const months = ["april", "may", "june", "july", "august", "september", "october"];
const days = [
  { num: 22, active: false },
  { num: 23, active: false },
  { num: 24, active: true },
  { num: 25, active: false },
  { num: 26, active: false },
  { num: 27, active: false },
  { num: 28, active: false },
  { num: 29, active: false, bold: true },
  { num: 30, active: false },
  { num: 31, active: false },
  { num: 1, active: false },
  { num: 2, active: false },
];

export function Timeline() {
  return (
    <div>
      <div className="mb-3 flex gap-8">
        {months.map((m, i) => (
          <span
            key={m}
            className={`text-xs lowercase ${i === 0 ? "font-semibold text-indigo" : "text-muted-foreground"}`}
          >
            {m}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-4 border-b-2 border-dashed border-border pb-3">
        {days.map((d) => (
          <span
            key={d.num}
            className={`relative flex h-7 w-7 items-center justify-center text-sm ${
              d.active
                ? "font-bold text-white"
                : d.bold
                  ? "font-bold text-indigo"
                  : "text-muted-foreground"
            }`}
          >
            {d.active && (
              <span className="absolute inset-0 rounded-full bg-orange-accent" />
            )}
            <span className="relative">
              {d.num < 10 ? `0${d.num}` : d.num}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

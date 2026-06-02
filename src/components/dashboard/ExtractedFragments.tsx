import { ArrowRight } from "lucide-react";

const fragments = [
  {
    label: "button variants",
    color: "bg-pistachio",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40">
        <rect x="10" y="16" width="20" height="8" rx="4" fill="#1A1525" opacity="0.3" />
      </svg>
    ),
  },
  {
    label: "color tokens",
    color: "bg-lavender",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle cx="15" cy="20" r="5" fill="#0047FF" opacity="0.4" />
        <circle cx="25" cy="20" r="5" fill="#FF5C00" opacity="0.4" />
      </svg>
    ),
  },
  {
    label: "grid layouts",
    color: "bg-pistachio",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40">
        <rect x="8" y="8" width="10" height="10" rx="2" fill="#1A1525" opacity="0.2" />
        <rect x="22" y="8" width="10" height="10" rx="2" fill="#1A1525" opacity="0.2" />
        <rect x="8" y="22" width="10" height="10" rx="2" fill="#1A1525" opacity="0.2" />
        <rect x="22" y="22" width="10" height="10" rx="2" fill="#1A1525" opacity="0.2" />
      </svg>
    ),
  },
];

export function ExtractedFragments() {
  return (
    <div>
      <p className="mb-4 text-sm font-semibold lowercase text-indigo">
        extracted fragments
      </p>
      <div className="flex gap-3">
        {fragments.map((f, i) => (
          <div key={i} className="flex flex-col items-start">
            <div
              className={`relative flex h-24 w-24 items-center justify-center rounded-xl ${f.color}`}
            >
              {f.icon}
              <div className="absolute bottom-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm">
                <ArrowRight className="h-3 w-3 text-indigo" />
              </div>
            </div>
            <span className="mt-1.5 text-[10px] text-muted-foreground">
              {f.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

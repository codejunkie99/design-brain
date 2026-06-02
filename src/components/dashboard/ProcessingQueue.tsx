import { Check } from "lucide-react";
import { useCaptureStore } from "@/stores/captureStore";

const MOCK_QUEUE = [
  { text: "typography tokens extracted", source: "stripe.com", done: true },
  { text: "color variables parsed", source: "linear.app", done: true },
  { text: "component scan pending", source: "vercel.com", done: false },
  { text: "motion pattern analysis", source: "apple.com", done: false },
];

export function ProcessingQueue() {
  const captures = useCaptureStore((s) => s.captures);
  const items =
    captures.length > 0
      ? captures.slice(0, 4).map((c, i) => ({
          text: c.name,
          source: c.url || c.project,
          done: i < 2, // mark first 2 as done for visual demo
        }))
      : MOCK_QUEUE;

  return (
    <div className="pt-6">
      <p className="mb-4 text-sm font-semibold lowercase text-indigo">
        processing queue
      </p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map((item, i) => (
          <div
            key={i}
            className="relative rounded-xl border border-border bg-white p-4 min-h-[90px]"
          >
            <p
              className={`text-xs leading-relaxed ${item.done ? "line-through text-muted-foreground" : "text-indigo"}`}
            >
              {item.text}
            </p>
            <span className="mt-2 block text-[10px] text-muted-foreground">
              {item.source}
            </span>
            {item.done ? (
              <div className="absolute bottom-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-cobalt">
                <Check className="h-3 w-3 text-white" />
              </div>
            ) : (
              <div className="absolute bottom-3 right-3 h-5 w-5 rounded-full border-2 border-border" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

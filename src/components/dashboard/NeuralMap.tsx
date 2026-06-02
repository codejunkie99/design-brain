import { GitMerge, Pause } from "lucide-react";
import { useCaptureStore } from "@/stores/captureStore";

export function NeuralMap() {
  const stats = useCaptureStore((s) => s.stats);

  return (
    <div>
      <p className="mb-4 text-sm font-semibold lowercase text-indigo">
        neural map
      </p>

      {/* Graph Builder Widget */}
      <div className="flex items-center gap-3 rounded-2xl bg-cobalt px-5 py-4 text-white">
        <GitMerge className="h-4 w-4 shrink-0" />
        <div className="flex-1">
          <div className="h-1 overflow-hidden rounded-full bg-white/20">
            <div className="h-full w-[58%] rounded-full bg-white" />
          </div>
          <p className="mt-1 text-[10px] opacity-70">
            building graph... 58%
          </p>
        </div>
        <Pause className="h-4 w-4 shrink-0" />
      </div>

      {/* Stats */}
      <div className="mt-4 flex gap-6">
        <div className="text-center">
          <span className="text-2xl font-bold text-cobalt">
            {stats?.captures ?? 28}
          </span>
          <p className="text-[10px] text-muted-foreground">captures</p>
        </div>
        <div className="text-center">
          <span className="text-2xl font-bold text-cobalt">
            {stats?.patterns ?? 56}
          </span>
          <p className="text-[10px] text-muted-foreground">patterns</p>
        </div>
        <div className="text-center">
          <span className="text-2xl font-bold text-cobalt">
            {stats?.decisions ?? 4}
          </span>
          <p className="text-[10px] text-muted-foreground">decisions</p>
        </div>
      </div>
    </div>
  );
}

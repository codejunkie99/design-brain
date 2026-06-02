import { QuickCapture } from "./QuickCapture";
import { ProcessingQueue } from "./ProcessingQueue";
import { ExtractedFragments } from "./ExtractedFragments";
import { NeuralMap } from "./NeuralMap";
import { Timeline } from "./Timeline";

export function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Heading */}
      <div>
        <h1 className="text-5xl font-extrabold tracking-tight text-indigo leading-tight">
          Graph Builder
          <br />
          01: Seeds
        </h1>
        <div className="mt-3 h-1 w-40 rounded-full bg-cobalt" />
      </div>

      {/* Timeline */}
      <Timeline />

      {/* Processing Queue with Quick Capture */}
      <div className="relative">
        <QuickCapture />
        <ProcessingQueue />
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <ExtractedFragments />
        <NeuralMap />
      </div>
    </div>
  );
}

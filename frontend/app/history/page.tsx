import HistoryList from "@/components/HistoryList";
import { History } from "lucide-react";

export default function HistoryPage() {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d0d10] overflow-y-auto">
      {/* Workspace Header */}
      <header className="h-14 border-b border-[#1a1a1f] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <History size={16} className="text-orange-500" />
          <h1 className="text-sm font-semibold text-white tracking-tight">Generation History</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-[10px] font-bold text-neutral-300 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-full select-none">
            My Team <span className="text-orange-500 font-extrabold ml-1">Free</span>
          </div>
          <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center font-bold text-xs text-black select-none">
            U
          </div>
        </div>
      </header>

      {/* Workspace Body */}
      <div className="flex-1 p-6 max-w-4xl mx-auto w-full flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            History
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            All your previous audio generations and details.
          </p>
        </div>
        <HistoryList />
      </div>
    </div>
  );
}


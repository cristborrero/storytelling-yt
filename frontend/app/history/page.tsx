import HistoryList from "@/components/HistoryList";

export default function HistoryPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-white">History</h1>
        <p className="text-sm text-neutral-400 mt-1">
          All your previous audio generations
        </p>
      </div>
      <HistoryList />
    </div>
  );
}

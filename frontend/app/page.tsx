import GeneratorForm from "@/components/GeneratorForm";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Voice Generator</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Convert your English stories into professional narration
        </p>
      </div>
      <GeneratorForm />
    </div>
  );
}

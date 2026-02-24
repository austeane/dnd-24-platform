import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">D&D Campaign Platform</h1>
        <p className="text-lg text-gray-600">
          SRD 5.2.1 + Advanced Adventurers
        </p>
      </div>
    </div>
  );
}

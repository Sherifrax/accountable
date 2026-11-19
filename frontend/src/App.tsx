import { useEffect, useState } from "react";

type Stage = { name: string; probability: number; open: boolean };

export function App() {
  const [stages, setStages] = useState<Stage[]>([]);
  useEffect(() => {
    fetch("/api/stages")
      .then((r) => r.json())
      .then(setStages);
  }, []);
  return (
    <main>
      <h1>Accountable</h1>
      <ul aria-label="Stages">
        {stages.map((s) => (
          <li key={s.name}>{s.name}</li>
        ))}
      </ul>
    </main>
  );
}

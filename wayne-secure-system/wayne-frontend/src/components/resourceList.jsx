import { useEffect, useState } from "react";
import { fetchResources } from "../services/api";

export default function ResourceList() {
  const [resources, setResources] = useState([]);

  useEffect(() => {
    fetchResources().then(setResources);
  }, []);

  return (
    <div>
      <h2>Lista de Recursos</h2>
      <ul>
        {resources.map((r) => (
          <li key={r.id}>{r.name} - {r.status}</li>
        ))}
      </ul>
    </div>
  );
}

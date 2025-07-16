import React from "react";
import { Bar, Pie } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);
export default function DashboardCharts({ summary }) {
  if (!summary) return null;

  const statusData = {
    labels: ["Ativos", "Manutenção", "Inativos"],
    datasets: [
      {
        label: "Recursos",
        data: [summary.active, summary.maintenance, summary.inactive],
        backgroundColor: ["#4caf50", "#ff9800", "#f44336"],
      },
    ],
  };

  const rolesData = {
    labels: ["Empregado", "Gerente", "Admin"],
    datasets: [
      {
        label: "Usuários",
        data: [summary.empregado, summary.gerente, summary.admin],
        backgroundColor: ["#2196f3", "#9c27b0", "#607d8b"],
      },
    ],
  };

  return (
    <div>
      <h3>Recursos por Status</h3>
      <Bar data={statusData} />
      <h3>Usuários por Papel</h3>
      <Pie data={rolesData} />
    </div>
  );
}

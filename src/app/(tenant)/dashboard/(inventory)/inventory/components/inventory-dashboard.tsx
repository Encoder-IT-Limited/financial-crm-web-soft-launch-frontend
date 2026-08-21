import { DashboardHeader } from "./dashboard-header";
import { KpiCard } from "./kpi-card";
import { LowStockTable } from "./low-stock-table";
import { RecentMovementsTable } from "./recent-movements-table";
import { StockMovementChart } from "./stock-movement-chart";
import { SummaryCard } from "./summary-card";
import { WarehouseStockChart } from "./warehouse-stock-chart";
import {
  kpis,
  recentMovements,
  summaryStats,
} from "../mock-data";

export function InventoryDashboard() {
  return (
    <div className="flex flex-col gap-5">
      <DashboardHeader movements={recentMovements} />

      <div className="grid grid-cols-1 gap-4 min-[460px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {kpis.map((item) => (
          <KpiCard key={item.id} item={item} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <WarehouseStockChart />
        <StockMovementChart />
      </div>

      <div className="grid grid-cols-1 gap-4 min-[460px]:grid-cols-2 lg:grid-cols-4">
        {summaryStats.map((stat) => (
          <SummaryCard
            key={stat.id}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            tone={stat.tone}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
        <RecentMovementsTable />
        <LowStockTable />
      </div>
    </div>
  );
}

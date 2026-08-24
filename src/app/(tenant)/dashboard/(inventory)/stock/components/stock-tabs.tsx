"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockMovementsPage } from "../../stock-movement/components/stock-movements-page";
import { StockTransfersPage } from "../../stock-transfer/components/stock-transfers-page";

export function StockTabs() {
  return (
    <Tabs defaultValue="movement">
      <TabsList variant="line">
        <TabsTrigger value="movement">Stock Movement</TabsTrigger>
        <TabsTrigger value="transfer">Stock Transfer</TabsTrigger>
      </TabsList>

      <TabsContent value="movement" className="mt-4">
        <StockMovementsPage />
      </TabsContent>

      <TabsContent value="transfer" className="mt-4">
        <StockTransfersPage />
      </TabsContent>
    </Tabs>
  );
}

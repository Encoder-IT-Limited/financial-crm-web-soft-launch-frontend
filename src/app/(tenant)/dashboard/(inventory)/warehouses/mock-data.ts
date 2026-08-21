export type WarehouseStatus = "active" | "inactive";

export interface WarehouseCategoryStock {
  category: string;
  items: number;
}

export interface Warehouse {
  id: string;
  name: string;
  /** City / area label shown in the list. */
  location: string;
  manager: string;
  /** Distinct products stocked. */
  totalItems: number;
  /** Stock value in AED. */
  totalValue: number;
  /** Storage positions available. */
  capacity: number;
  /** Storage positions used. */
  occupancy: number;
  status: WarehouseStatus;
  address: string;
  contactNumber: string;
  email: string;
  createdAt: string;
  /** Item-count breakdown for the "Stock by Category" donut. */
  stockByCategory: WarehouseCategoryStock[];
}

/** Mock warehouses — swap for the inventory API response later. */
export const warehouses: Warehouse[] = [
  {
    id: "wh-main",
    name: "Main Warehouse",
    location: "Dubai - Al Quoz",
    manager: "Khalid Rahman",
    totalItems: 24,
    totalValue: 1050000,
    capacity: 3000,
    occupancy: 2100,
    status: "active",
    address: "Plot 14, Al Quoz Industrial Area 3, Dubai, UAE",
    contactNumber: "+971 4 338 2200",
    email: "main.warehouse@mrm-inventory.ae",
    createdAt: "Jan 12, 2023",
    stockByCategory: [
      { category: "Laptops", items: 5 },
      { category: "Accessories", items: 9 },
      { category: "Office Supplies", items: 5 },
      { category: "Furniture", items: 4 },
      { category: "Services", items: 1 },
    ],
  },
  {
    id: "wh-dxb",
    name: "Dubai Warehouse",
    location: "Dubai - Business Bay",
    manager: "Sara Mansour",
    totalItems: 18,
    totalValue: 820000,
    capacity: 2500,
    occupancy: 1875,
    status: "active",
    address: "Unit 702, Bay Square Building B, Business Bay, Dubai, UAE",
    contactNumber: "+971 4 552 8810",
    email: "dubai.warehouse@mrm-inventory.ae",
    createdAt: "Mar 03, 2023",
    stockByCategory: [
      { category: "Laptops", items: 3 },
      { category: "Accessories", items: 7 },
      { category: "Office Supplies", items: 4 },
      { category: "Furniture", items: 3 },
      { category: "Services", items: 1 },
    ],
  },
  {
    id: "wh-auh",
    name: "Abu Dhabi Warehouse",
    location: "Abu Dhabi - Mussafah",
    manager: "Fatima Al Zaabi",
    totalItems: 12,
    totalValue: 210000,
    capacity: 1800,
    occupancy: 1440,
    status: "active",
    address: "Warehouse 22, Mussafah Industrial Area ICAD II, Abu Dhabi, UAE",
    contactNumber: "+971 2 551 7740",
    email: "abudhabi.warehouse@mrm-inventory.ae",
    createdAt: "Jun 21, 2023",
    stockByCategory: [
      { category: "Laptops", items: 2 },
      { category: "Accessories", items: 4 },
      { category: "Office Supplies", items: 3 },
      { category: "Furniture", items: 2 },
      { category: "Services", items: 1 },
    ],
  },
  {
    id: "wh-shj",
    name: "Sharjah Warehouse",
    location: "Sharjah - Industrial Area",
    manager: "Omar Haddad",
    totalItems: 9,
    totalValue: 90000,
    capacity: 1200,
    occupancy: 1140,
    status: "inactive",
    address: "Shed 9, Industrial Area 10, Al Sajaa, Sharjah, UAE",
    contactNumber: "+971 6 534 1190",
    email: "sharjah.warehouse@mrm-inventory.ae",
    createdAt: "Sep 15, 2023",
    stockByCategory: [
      { category: "Accessories", items: 3 },
      { category: "Office Supplies", items: 4 },
      { category: "Furniture", items: 2 },
    ],
  },
  {
    id: "wh-jeb",
    name: "Jebel Ali Warehouse",
    location: "Dubai - Jebel Ali Free Zone",
    manager: "Layla Kareem",
    totalItems: 15,
    totalValue: 410000,
    capacity: 4000,
    occupancy: 1600,
    status: "active",
    address: "LB-14, Jebel Ali Free Zone South, Dubai, UAE",
    contactNumber: "+971 4 887 3310",
    email: "jebelali.warehouse@mrm-inventory.ae",
    createdAt: "Feb 08, 2024",
    stockByCategory: [
      { category: "Laptops", items: 4 },
      { category: "Accessories", items: 5 },
      { category: "Office Supplies", items: 3 },
      { category: "Furniture", items: 2 },
      { category: "Services", items: 1 },
    ],
  },
];

export interface StockOverviewRow {
  id: string;
  product: string;
  sku: string;
  /** Quantity on hand keyed by warehouse id. */
  qtyByWarehouse: Record<string, number>;
  reorderLevel: number;
}

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

export function getStockStatus(row: Pick<StockOverviewRow, "qtyByWarehouse" | "reorderLevel">): StockStatus {
  const total = Object.values(row.qtyByWarehouse).reduce((sum, qty) => sum + qty, 0);
  if (total === 0) return "out-of-stock";
  if (total <= row.reorderLevel) return "low-stock";
  return "in-stock";
}

export function totalQty(row: Pick<StockOverviewRow, "qtyByWarehouse">): number {
  return Object.values(row.qtyByWarehouse).reduce((sum, qty) => sum + qty, 0);
}

export const stockOverview: StockOverviewRow[] = [
  { id: "so-01", product: "iPhone 15 Pro", sku: "IP15-PRO-256", qtyByWarehouse: { "wh-main": 40, "wh-dxb": 35, "wh-auh": 20, "wh-shj": 10, "wh-jeb": 15 }, reorderLevel: 30 },
  { id: "so-02", product: "Samsung Galaxy S24", sku: "SM-S24-256", qtyByWarehouse: { "wh-main": 22, "wh-dxb": 18, "wh-auh": 12, "wh-shj": 4, "wh-jeb": 8 }, reorderLevel: 25 },
  { id: "so-03", product: "HP Laptop 15", sku: "HP15-I5-8GB", qtyByWarehouse: { "wh-main": 14, "wh-dxb": 12, "wh-auh": 8, "wh-shj": 0, "wh-jeb": 8 }, reorderLevel: 20 },
  { id: "so-04", product: "Dell Monitor 24", sku: "DL-M24-1080", qtyByWarehouse: { "wh-main": 8, "wh-dxb": 6, "wh-auh": 4, "wh-shj": 0, "wh-jeb": 0 }, reorderLevel: 20 },
  { id: "so-05", product: "Logitech Mouse M90", sku: "M90-BLK", qtyByWarehouse: { "wh-main": 0, "wh-dxb": 5, "wh-auh": 0, "wh-shj": 3, "wh-jeb": 0 }, reorderLevel: 20 },
  { id: "so-06", product: "Sony WH-1000XM5", sku: "WH1000XM5", qtyByWarehouse: { "wh-main": 0, "wh-dxb": 0, "wh-auh": 5, "wh-shj": 0, "wh-jeb": 0 }, reorderLevel: 10 },
  { id: "so-07", product: "HP Keyboard K1500", sku: "K1500", qtyByWarehouse: { "wh-main": 0, "wh-dxb": 12, "wh-auh": 0, "wh-shj": 0, "wh-jeb": 0 }, reorderLevel: 25 },
  { id: "so-08", product: "Ergonomic Office Chair", sku: "CH-ERGO-BLK", qtyByWarehouse: { "wh-main": 10, "wh-dxb": 9, "wh-auh": 7, "wh-shj": 0, "wh-jeb": 0 }, reorderLevel: 30 },
  { id: "so-09", product: "Standing Desk 140cm", sku: "SD-140-OAK", qtyByWarehouse: { "wh-main": 0, "wh-dxb": 8, "wh-auh": 4, "wh-shj": 3, "wh-jeb": 0 }, reorderLevel: 16 },
  { id: "so-10", product: "Filing Cabinet 3-Drawer", sku: "FC-3D-GREY", qtyByWarehouse: { "wh-main": 25, "wh-dxb": 15, "wh-auh": 15, "wh-shj": 0, "wh-jeb": 0 }, reorderLevel: 20 },
  { id: "so-11", product: "A4 Copy Paper Ream", sku: "PP-A4-80G", qtyByWarehouse: { "wh-main": 90, "wh-dxb": 60, "wh-auh": 40, "wh-shj": 20, "wh-jeb": 0 }, reorderLevel: 50 },
  { id: "so-12", product: "Ballpoint Pens Box 50", sku: "PN-BLU-50", qtyByWarehouse: { "wh-main": 44, "wh-dxb": 24, "wh-auh": 20, "wh-shj": 0, "wh-jeb": 0 }, reorderLevel: 40 },
  { id: "so-13", product: "Canon Ink Cartridge", sku: "CN-INK-05", qtyByWarehouse: { "wh-main": 0, "wh-dxb": 0, "wh-auh": 0, "wh-shj": 0, "wh-jeb": 0 }, reorderLevel: 15 },
];

export type RecentActivity = {
  id: number;
  type: "purchase" | "sale";
  invoiceNo: string;
  partnerName: string;
  issuedAt: Date;
  totalAmount: string;
};

export type DashboardSummary = {
  totalProducts: number;
  invoicesInThisMonth: number;
  invoicesOutThisMonth: number;
  inventoryValue: number;
  recentActivities: RecentActivity[];
};

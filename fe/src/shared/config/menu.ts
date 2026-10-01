export type MenuKey =
  | "dashboard"
  | "invoices-in"
  | "invoices-out"
  | "expenses"
  | "inventory"
  | "cart"
  | "customers"
  | "reconciliation"
  | "reports";

export type MenuItem = {
  key: MenuKey;
  label: string;
  href: string;
};

export const MENU_ITEMS: MenuItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/" },
  { key: "invoices-in", label: "Hóa đơn đầu vào", href: "/invoices-in" },
  { key: "invoices-out", label: "Hóa đơn đầu ra", href: "/invoices-out" },
  { key: "expenses", label: "Chi phí", href: "/expenses" },
  { key: "inventory", label: "Tồn kho", href: "/inventory" },
  { key: "cart", label: "Giỏ hàng", href: "/cart" },
  { key: "customers", label: "Khách hàng", href: "/customers" },
  { key: "reconciliation", label: "Tra soát hóa đơn", href: "/reconciliation" },
  { key: "reports", label: "Báo cáo", href: "/reports" },
];

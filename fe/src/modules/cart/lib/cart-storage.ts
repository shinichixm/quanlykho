import type { CartItem } from "../types/cart.types";

const STORAGE_KEY = "quanlykho.cart";
const CART_EVENT = "cart-updated";

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_EVENT));
}

export function getCartItems(): CartItem[] {
  return readCart();
}

export function addCartItem(item: CartItem) {
  const items = readCart();
  const existing = items.find((i) => i.productId === item.productId);
  if (existing) {
    existing.quantity += item.quantity;
    existing.unitPrice = item.unitPrice;
  } else {
    items.push(item);
  }
  writeCart(items);
}

export function updateCartItem(productId: number, changes: Partial<Pick<CartItem, "quantity" | "unitPrice">>) {
  const items = readCart().map((item) =>
    item.productId === productId ? { ...item, ...changes } : item
  );
  writeCart(items);
}

export function removeCartItem(productId: number) {
  const items = readCart().filter((item) => item.productId !== productId);
  writeCart(items);
}

export function clearCart() {
  writeCart([]);
}

export function subscribeCart(callback: () => void) {
  window.addEventListener(CART_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CART_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

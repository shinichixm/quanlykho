"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addCartItem,
  clearCart,
  getCartItems,
  removeCartItem,
  subscribeCart,
  updateCartItem,
} from "../lib/cart-storage";
import type { CartItem } from "../types/cart.types";

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const refresh = useCallback(() => {
    setItems(getCartItems());
  }, []);

  useEffect(() => {
    refresh();
    return subscribeCart(refresh);
  }, [refresh]);

  return {
    items,
    count: items.length,
    addItem: addCartItem,
    updateItem: updateCartItem,
    removeItem: removeCartItem,
    clear: clearCart,
  };
}

import { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (reel, extras = []) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === reel.id && JSON.stringify(item.extras) === JSON.stringify(extras));
      if (existing) {
        return prev.map(item =>
          item.id === reel.id && JSON.stringify(item.extras) === JSON.stringify(extras)
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [...prev, {
        id: reel.id,
        name: reel.dish,
        restaurantName: reel.restaurantName,
        image: reel.image,
        basePrice: reel.price,
        extras,
        qty: 1,
      }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id, extras) => {
    setCartItems(prev => prev.filter(item =>
      !(item.id === id && JSON.stringify(item.extras) === JSON.stringify(extras))
    ));
  };

  const updateQty = (id, extras, delta) => {
    setCartItems(prev =>
      prev.map(item => {
        if (item.id === id && JSON.stringify(item.extras) === JSON.stringify(extras)) {
          const newQty = item.qty + delta;
          if (newQty < 1) return null;
          return { ...item, qty: newQty };
        }
        return item;
      }).filter(Boolean)
    );
  };

  const clearCart = () => setCartItems([]);

  const totalItems = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cartItems.reduce((sum, item) => {
    const extrasTotal = item.extras.reduce((es, e) => es + e.price, 0);
    return sum + (item.basePrice + extrasTotal) * item.qty;
  }, 0);

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart, updateQty, clearCart,
      isCartOpen, setIsCartOpen,
      totalItems, totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);

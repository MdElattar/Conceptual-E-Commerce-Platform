import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // التريكة 1: حماية الـ LocalStorage من الـ JSON Corruptions
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Cart hydration failed, resetting:", error);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // التريكة 2: الإضافة أصبحت تعني دائماً (زيادة عنصر واحد) مع حماية المخزن
  const addToCart = useCallback((product) => {
    setCartItems((prevItems) => {
      const existItem = prevItems.find(
        (x) => 
          x._id === product._id && 
          x.selectedColor === product.selectedColor && 
          x.selectedSize === product.selectedSize
      );

      // تحديد الحد الأقصى الصارم (المخزن أو 14)
      const maxStock = product.countInStock !== undefined ? Number(product.countInStock) : 14;
      const maxLimit = Math.min(14, maxStock);

      if (existItem) {
        // زيادة 1 فقط على الكمية الحالية
        let newQty = Number(existItem.qty) + 1;
        if (newQty > maxLimit) newQty = maxLimit; // قفل الكمية عند الحد

        return prevItems.map((x) =>
          x._id === product._id && 
          x.selectedColor === product.selectedColor && 
          x.selectedSize === product.selectedSize 
            ? { ...existItem, qty: newQty } 
            : x
        );
      }

      // لو منتج جديد، ينزل بكمية 1 فقط
      return [...prevItems, { ...product, qty: 1 }];
    });
  }, []);

  // التريكة 3: دالة مخصصة للنقصان الذكي (تنقص 1، ولو وصلت 0 تحذف العنصر)
  const decrementQty = useCallback((id, color, size) => {
    setCartItems((prevItems) => {
      const existItem = prevItems.find(
        (x) => x._id === id && x.selectedColor === color && x.selectedSize === size
      );

      if (!existItem) return prevItems;

      if (existItem.qty > 1) {
        return prevItems.map((x) =>
          x._id === id && x.selectedColor === color && x.selectedSize === size
            ? { ...existItem, qty: Number(existItem.qty) - 1 }
            : x
        );
      }

      // لو الكمية 1 وضغط نقصان، نحذفه من السلة
      return prevItems.filter(
        (x) => !(x._id === id && x.selectedColor === color && x.selectedSize === size)
      );
    });
  }, []);

  const removeFromCart = useCallback((id, color, size) => {
    setCartItems((prevItems) => 
      prevItems.filter((x) => !(x._id === id && x.selectedColor === color && x.selectedSize === size))
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    localStorage.removeItem('cart'); 
  }, []);

  // حساب السعر الإجمالي مؤمن بالكامل
  const totalPrice = useMemo(() => {
    return cartItems.reduce((acc, item) => 
      acc + (Number(item.price) * Number(item.qty)), 0
    );
  }, [cartItems]);

  // التريكة 4: تغليف القيمة بـ useMemo لمنع الـ Re-renders غير الضرورية للمكونات
  const contextValue = useMemo(() => ({
    cartItems,
    addToCart,
    decrementQty,
    removeFromCart,
    clearCart,
    totalPrice
  }), [cartItems, addToCart, decrementQty, removeFromCart, clearCart, totalPrice]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
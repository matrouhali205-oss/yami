import { useState } from 'react';
import { useCart } from '../CartContext';
import './CartDrawer.css';

export default function CartDrawer() {
  const { cartItems, removeFromCart, updateQty, clearCart, isCartOpen, setIsCartOpen, totalPrice } = useCart();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  if (!isCartOpen) return null;

  const deliveryFee = cartItems.length > 0 ? 1.99 : 0;
  const serviceFee = cartItems.length > 0 ? 0.75 : 0;
  const grandTotal = totalPrice + deliveryFee + serviceFee;
  const primaryRestaurant = cartItems[0]?.restaurantName || 'the restaurant';

  const handlePlaceOrder = () => {
    setIsPlacingOrder(true);
    setTimeout(() => {
      setIsPlacingOrder(false);
      setOrderSuccess(true);
      clearCart();
    }, 1500);
  };

  const handleClose = () => {
    setIsCartOpen(false);
    // Reset order placement states after the slide-down animation
    setTimeout(() => {
      setOrderSuccess(false);
      setIsPlacingOrder(false);
    }, 300);
  };

  return (
    <div className="cart-overlay" onClick={handleClose}>
      <div className="cart-drawer" onClick={e => e.stopPropagation()}>
        <div className="cart-handle" />

        {orderSuccess ? (
          <div className="cart-success-view">
            <div className="success-icon-anim">🎉</div>
            <h2 className="success-title">Order Placed!</h2>
            <p className="success-desc">
              Your order from <strong>{primaryRestaurant}</strong> has been received and is being prepared.
            </p>
            <div className="success-delivery-card">
              <span className="delivery-icon">🛵</span>
              <div>
                <p className="delivery-time">Estimated Arrival: 25 mins</p>
                <p className="delivery-status">Driver is heading to kitchen</p>
              </div>
            </div>
            <button className="btn btn-primary done-btn" onClick={handleClose}>
              Track Order 📍
            </button>
          </div>
        ) : isPlacingOrder ? (
          <div className="cart-loading-view">
            <div className="loading-spinner" />
            <h3>Processing Payment...</h3>
            <p>Please do not close the app</p>
          </div>
        ) : (
          <>
            <div className="cart-header">
              <div>
                <h2 className="cart-title">Your Order 🛒</h2>
                {cartItems.length > 0 && (
                  <p className="cart-subtitle">{cartItems.reduce((s, i) => s + i.qty, 0)} item{cartItems.length > 1 ? 's' : ''} ready</p>
                )}
              </div>
              {cartItems.length > 0 && (
                <button className="btn btn-ghost cart-clear-btn" id="cart-clear" onClick={clearCart}>Clear all</button>
              )}
            </div>

            {cartItems.length === 0 ? (
              <div className="cart-empty">
                <div className="cart-empty-icon">🍽️</div>
                <h3>Nothing here yet!</h3>
                <p>Watch reels and hit "Order Now" to add food to your cart.</p>
              </div>
            ) : (
              <>
                <div className="cart-items-list">
                  {cartItems.map((item, idx) => (
                    <div className="cart-item" key={idx} id={`cart-item-${item.id}-${idx}`}>
                      <img src={item.image} alt={item.name} className="cart-item-img" />
                      <div className="cart-item-info">
                        <p className="cart-item-name">{item.name}</p>
                        <p className="cart-item-restaurant">{item.restaurantName}</p>
                        {item.extras && item.extras.length > 0 && (
                          <p className="cart-item-extras">+ {item.extras.map(e => e.name).join(', ')}</p>
                        )}
                        <p className="cart-item-price">
                          ${((item.basePrice + (item.extras ? item.extras.reduce((s, e) => s + e.price, 0) : 0)) * item.qty).toFixed(2)}
                        </p>
                      </div>
                      <div className="cart-item-controls">
                        <button className="qty-ctrl-btn" id={`cart-minus-${idx}`} onClick={() => updateQty(item.id, item.extras, -1)}>−</button>
                        <span className="cart-item-qty">{item.qty}</span>
                        <button className="qty-ctrl-btn" id={`cart-plus-${idx}`} onClick={() => updateQty(item.id, item.extras, 1)}>+</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="cart-summary">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Delivery fee</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Service fee</span>
                    <span>${serviceFee.toFixed(2)}</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total</span>
                    <span>${grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Checkout CTA */}
                <div className="cart-checkout">
                  <div className="delivery-estimate">
                    <span>🕐</span>
                    <span>~25 min estimated delivery</span>
                  </div>
                  <button className="btn btn-primary checkout-btn" id="checkout-btn" onClick={handlePlaceOrder}>
                    Place Order · ${grandTotal.toFixed(2)}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

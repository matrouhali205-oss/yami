import { useState } from 'react';
import './OrderModal.css';

export default function OrderModal({ reel, onClose, onAddToCart }) {
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [qty, setQty] = useState(1);

  const toggleExtra = (extra) => {
    setSelectedExtras(prev =>
      prev.find(e => e.name === extra.name)
        ? prev.filter(e => e.name !== extra.name)
        : [...prev, extra]
    );
  };

  const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price, 0);
  const totalPrice = (reel.price + extrasTotal) * qty;

  return (
    <div className="order-modal-overlay" onClick={onClose}>
      <div className="order-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />

        {/* Food image */}
        <div className="modal-image-wrap">
          <img src={reel.image} alt={reel.dish} className="modal-image" />
          <div className="modal-image-overlay" />
          <button className="modal-close-btn" onClick={onClose} id="modal-close">✕</button>
          <div className="modal-price-badge">${reel.price.toFixed(2)}</div>
        </div>

        <div className="modal-body">
          {/* Restaurant & Dish */}
          <div className="modal-header">
            <p className="modal-restaurant">{reel.restaurantName}</p>
            <h2 className="modal-dish-name">{reel.dish}</h2>
            <p className="modal-dish-desc">{reel.description}</p>
          </div>

          {/* Extras */}
          <div className="modal-section">
            <div className="modal-section-header">
              <h3>Extras & Add-ons</h3>
              <span className="optional-chip">Optional</span>
            </div>
            <div className="extras-list">
              {reel.extras.map(extra => {
                const isSelected = selectedExtras.find(e => e.name === extra.name);
                return (
                  <button
                    key={extra.name}
                    className={`extra-item ${isSelected ? 'selected' : ''}`}
                    id={`extra-${extra.name.replace(/\s+/g,'-').toLowerCase()}`}
                    onClick={() => toggleExtra(extra)}
                  >
                    <span className="extra-name">{extra.name}</span>
                    <div className="extra-right">
                      <span className="extra-price">+${extra.price.toFixed(2)}</span>
                      <span className="extra-check">{isSelected ? '✓' : '+'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Qty + Order */}
          <div className="modal-footer">
            <div className="qty-control">
              <button className="qty-btn" id="qty-minus" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span className="qty-value">{qty}</span>
              <button className="qty-btn" id="qty-plus" onClick={() => setQty(q => q + 1)}>+</button>
            </div>
            <button
              className="btn btn-primary modal-order-btn"
              id="add-to-cart-btn"
              onClick={() => onAddToCart(reel, selectedExtras)}
            >
              Add to Cart · ${totalPrice.toFixed(2)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

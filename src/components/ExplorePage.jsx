import { reels, categories, formatNumber } from '../data';
import { useCart } from '../CartContext';
import { useState } from 'react';
import OrderModal from './OrderModal';
import './ExplorePage.css';

export default function ExplorePage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [orderReel, setOrderReel] = useState(null);
  const { addToCart } = useCart();

  return (
    <div className="explore-page">
      {/* Header */}
      <div className="explore-header">
        <h1 className="explore-title">Explore <span className="gradient-text">Reels</span></h1>
        <p className="explore-sub">Discover trending food near you</p>
      </div>

      {/* Category scroll */}
      <div className="category-bar">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
            id={`cat-${cat.id}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Trending banner */}
      <div className="trending-banner">
        <span className="trending-icon">🔥</span>
        <div>
          <p className="trending-title">Trending Right Now</p>
          <p className="trending-sub">127K people watching food reels near you</p>
        </div>
        <div className="trending-pulse">
          <span className="pulse-dot" />
          <span className="pulse-ring" />
        </div>
      </div>

      {/* Masonry-style grid */}
      <div className="explore-grid">
        {reels.map((reel, i) => (
          <div key={reel.id} className={`explore-card ${i % 3 === 0 ? 'tall' : ''}`} id={`explore-${reel.id}`}>
            <img src={reel.image} alt={reel.dish} className="explore-card-img" />
            <div className="explore-card-overlay">
              <div className="explore-card-top">
                <span className="explore-likes">❤️ {formatNumber(reel.likes)}</span>
              </div>
              <div className="explore-card-bottom">
                <p className="explore-dish">{reel.dish}</p>
                <p className="explore-restaurant">{reel.restaurantName}</p>
                <div className="explore-actions">
                  <span className="explore-price">${reel.price.toFixed(2)}</span>
                  <button
                    className="btn btn-primary explore-order-btn"
                    id={`explore-order-${reel.id}`}
                    onClick={() => setOrderReel(reel)}
                  >
                    Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {orderReel && (
        <OrderModal
          reel={orderReel}
          onClose={() => setOrderReel(null)}
          onAddToCart={(reel, extras) => {
            addToCart(reel, extras);
            setOrderReel(null);
          }}
        />
      )}
    </div>
  );
}

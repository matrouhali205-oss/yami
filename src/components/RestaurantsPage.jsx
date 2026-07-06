import { useState } from 'react';
import { restaurants, reels } from '../data';
import { useCart } from '../CartContext';
import RestaurantMenuModal from './RestaurantMenuModal';
import OrderModal from './OrderModal';
import './RestaurantsPage.css';

export default function RestaurantsPage() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [orderReel, setOrderReel] = useState(null);
  const { addToCart } = useCart();

  // Handle filter matching
  const filteredRestaurants = restaurants.filter(r => {
    // Search filter
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || 
                          r.cuisine.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;

    // Chip filter
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Fast Delivery') {
      // Matches '18–25 min' and '20–30 min' (delivery time average < 30)
      const maxTime = parseInt(r.deliveryTime.split('–')[1] || r.deliveryTime);
      return maxTime <= 30;
    }
    if (activeFilter === 'Trending') {
      return r.tags.some(t => t.includes('Trending') || t.includes('Favorite'));
    }
    if (activeFilter === 'Top Rated') {
      return r.rating >= 4.8;
    }
    if (activeFilter === 'Free Delivery') {
      return r.deliveryFee === 0;
    }
    return true;
  });

  return (
    <div className="restaurants-page">
      <div className="page-header">
        <h1 className="page-title">Restaurants <span className="gradient-text">Near You</span></h1>
        <p className="page-subtitle">All your favorite spots, one tap away</p>

        {/* Search */}
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search restaurants, cuisines..."
            className="search-input"
            id="restaurant-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear-btn" onClick={() => setSearch('')}>✕</button>
          )}
        </div>

        {/* Filter chips */}
        <div className="filter-chips">
          {['All', 'Fast Delivery', 'Trending', 'Top Rated', 'Free Delivery'].map(f => (
            <button
              key={f}
              className={`filter-chip ${f === activeFilter ? 'active' : ''}`}
              id={`filter-${f.toLowerCase().replace(/\s+/g,'-')}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="restaurants-grid">
        {filteredRestaurants.length === 0 ? (
          <div className="no-restaurants">
            <span className="no-res-emoji">🔍</span>
            <h3>No restaurants found</h3>
            <p>Try searching for a different cuisine or clearing your filters.</p>
          </div>
        ) : (
          filteredRestaurants.map(r => (
            <div key={r.id} className="restaurant-card" id={`restaurant-${r.id}`}>
              {/* Cover */}
              <div className="rc-cover" style={{ background: r.coverColor }}>
                <span className="rc-emoji">{r.avatar}</span>
                <div className="rc-tags">
                  {r.tags.map(t => (
                    <span key={t} className="rc-tag">{t}</span>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="rc-body">
                <div className="rc-top">
                  <div>
                    <h3 className="rc-name">{r.name}</h3>
                    <p className="rc-cuisine">{r.cuisine}</p>
                  </div>
                  <div className="rc-rating">
                    <span className="star">⭐</span>
                    <span className="rating-val">{r.rating}</span>
                    <span className="rating-count">({r.reviewCount.toLocaleString()})</span>
                  </div>
                </div>

                <div className="rc-meta">
                  <div className="meta-pill">
                    <span>🕐</span>
                    <span>{r.deliveryTime}</span>
                  </div>
                  <div className="meta-pill">
                    <span>📍</span>
                    <span>{r.distance}</span>
                  </div>
                  <div className="meta-pill">
                    <span>🛵</span>
                    <span>{r.deliveryFee === 0 ? 'Free' : `$${r.deliveryFee.toFixed(2)}`}</span>
                  </div>
                </div>

                <button
                  className="btn btn-primary rc-order-btn"
                  id={`order-from-${r.id}`}
                  onClick={() => setSelectedRestaurant(r)}
                >
                  View Menu →
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Restaurant Menu Modal */}
      {selectedRestaurant && (
        <RestaurantMenuModal
          restaurant={selectedRestaurant}
          onClose={() => setSelectedRestaurant(null)}
          onOrderReel={(reel) => {
            setOrderReel(reel);
            // Don't close selectedRestaurant so we can return back to the menu
          }}
        />
      )}

      {/* Order Modal for Signature Dishes */}
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

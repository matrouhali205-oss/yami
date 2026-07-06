import { useState, useRef, useEffect } from 'react';
import { reels, formatNumber } from '../data';
import { useCart } from '../CartContext';
import OrderModal from './OrderModal';
import './ReelFeed.css';

export default function ReelFeed() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reelData, setReelData] = useState(reels);
  const [orderModalReel, setOrderModalReel] = useState(null);
  const [likeAnimation, setLikeAnimation] = useState(null);
  const feedRef = useRef(null);
  const startY = useRef(null);
  const { addToCart, totalItems, setIsCartOpen } = useCart();

  useEffect(() => {
    fetch('/api/reels')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then(data => {
        if (data && data.length > 0) {
          setReelData(data.map(r => ({
            id: r.id,
            dish: r.item_name,
            description: r.description,
            price: r.item_price,
            image: r.item_image || '/food_reel_1.png',
            video: r.video_url,
            restaurantName: r.restaurant_name,
            likes: r.likes || 0,
            comments: 12,
            shares: 5,
            tags: ['#Fresh', '#YamiLocal']
          })));
        }
      })
      .catch(err => {});
  }, []);

  const handleLike = (id) => {
    setReelData(prev => prev.map(r =>
      r.id === id ? { ...r, liked: !r.liked, likes: r.liked ? r.likes - 1 : r.likes + 1 } : r
    ));
    setLikeAnimation(id);
    setTimeout(() => setLikeAnimation(null), 600);
  };

  const handleSave = (id) => {
    setReelData(prev => prev.map(r =>
      r.id === id ? { ...r, saved: !r.saved } : r
    ));
  };

  const goNext = () => setCurrentIndex(i => Math.min(i + 1, reelData.length - 1));
  const goPrev = () => setCurrentIndex(i => Math.max(i - 1, 0));


  const handleWheel = (e) => {
    if (e.deltaY > 30) goNext();
    else if (e.deltaY < -30) goPrev();
  };

  const handleTouchStart = (e) => { startY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e) => {
    if (startY.current === null) return;
    const diff = startY.current - e.changedTouches[0].clientY;
    if (diff > 50) goNext();
    else if (diff < -50) goPrev();
    startY.current = null;
  };

  const reel = reelData[currentIndex];

  return (
    <div className="reel-feed"
      ref={feedRef}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background image */}
      <div className="reel-bg">
        {reelData.map((r, i) => (
          <div key={r.id}
            className={`reel-bg-image ${i === currentIndex ? 'active' : i < currentIndex ? 'prev' : 'next'}`}
            style={{ backgroundImage: `url(${r.image})` }}
          />
        ))}
        <div className="reel-gradient-overlay" />
      </div>

      {/* Top bar */}
      <div className="reel-top-bar">
        <div className="reel-logo">
          <span className="gradient-text">yami</span>
          <span className="reel-logo-dot">🔥</span>
        </div>
        <div className="reel-tabs">
          <button className="reel-tab active">For You</button>
          <button className="reel-tab">Following</button>
        </div>
        <button className="btn-icon" onClick={() => setIsCartOpen(true)} id="cart-btn-top">
          🛒
          {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
        </button>
      </div>

      {/* Reel indicators */}
      <div className="reel-indicators">
        {reelData.map((_, i) => (
          <div key={i} className={`reel-dot ${i === currentIndex ? 'active' : ''}`} onClick={() => setCurrentIndex(i)} />
        ))}
      </div>

      {/* Heart pop animation on double tap */}
      {likeAnimation === reel.id && (
        <div className="heart-pop">❤️</div>
      )}

      {/* Bottom content */}
      <div className="reel-content">
        {/* Restaurant badge */}
        <div className="reel-restaurant-badge">
          <span className="restaurant-emoji">{reelData[currentIndex]?.restaurantName?.includes('Sakura') ? '🍣' : reelData[currentIndex]?.restaurantName?.includes('Nonna') ? '🍝' : reelData[currentIndex]?.restaurantName?.includes('Seoul') ? '🥩' : '🍔'}</span>
          <div>
            <p className="restaurant-name">{reel.restaurantName}</p>
            <p className="restaurant-sub">Tap to view menu</p>
          </div>
          <span className="reel-live-chip">LIVE</span>
        </div>

        {/* Dish info */}
        <div className="reel-dish-info">
          <h2 className="reel-dish-name">{reel.dish}</h2>
          <p className="reel-dish-desc">{reel.description}</p>
          <div className="reel-tags">
            {reel.tags.map(tag => <span key={tag} className="reel-tag">{tag}</span>)}
          </div>
        </div>

        {/* Price + CTA */}
        <div className="reel-order-row">
          <div className="reel-price-block">
            <span className="reel-price">${reel.price.toFixed(2)}</span>
            {reel.originalPrice && (
              <span className="reel-original-price">${reel.originalPrice.toFixed(2)}</span>
            )}
          </div>
          <button
            className="btn btn-primary reel-order-btn"
            id={`order-btn-${reel.id}`}
            onClick={() => setOrderModalReel(reel)}
          >
            Order Now 🛒
          </button>
        </div>
      </div>

      {/* Side actions */}
      <div className="reel-actions">
        <button
          className={`reel-action-btn ${reel.liked ? 'liked' : ''}`}
          id={`like-btn-${reel.id}`}
          onClick={() => handleLike(reel.id)}
        >
          <span className="action-icon">{reel.liked ? '❤️' : '🤍'}</span>
          <span className="action-count">{formatNumber(reel.likes)}</span>
        </button>

        <button className="reel-action-btn" id={`comment-btn-${reel.id}`}>
          <span className="action-icon">💬</span>
          <span className="action-count">{formatNumber(reel.comments)}</span>
        </button>

        <button className="reel-action-btn" id={`share-btn-${reel.id}`}>
          <span className="action-icon">↗️</span>
          <span className="action-count">{formatNumber(reel.shares)}</span>
        </button>

        <button
          className={`reel-action-btn ${reel.saved ? 'saved' : ''}`}
          id={`save-btn-${reel.id}`}
          onClick={() => handleSave(reel.id)}
        >
          <span className="action-icon">{reel.saved ? '🔖' : '📌'}</span>
          <span className="action-count">Save</span>
        </button>

        <div className="reel-action-btn disc-btn">
          <span className="disc-inner">
            {reel.restaurantName?.includes('Sakura') ? '🍣' : reel.restaurantName?.includes('Nonna') ? '🍝' : reel.restaurantName?.includes('Seoul') ? '🥩' : '🍔'}
          </span>
        </div>
      </div>

      {/* Nav arrows */}
      {currentIndex > 0 && (
        <button className="reel-nav up" onClick={goPrev} id="reel-nav-up">↑</button>
      )}
      {currentIndex < reelData.length - 1 && (
        <button className="reel-nav down" onClick={goNext} id="reel-nav-down">↓</button>
      )}


      {/* Order Modal */}
      {orderModalReel && (
        <OrderModal
          reel={orderModalReel}
          onClose={() => setOrderModalReel(null)}
          onAddToCart={(reel, extras) => {
            addToCart(reel, extras);
            setOrderModalReel(null);
          }}
        />
      )}
    </div>
  );
}

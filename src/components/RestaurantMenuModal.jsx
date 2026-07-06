import { useState, useEffect } from 'react';
import { reels } from '../data';
import { useCart } from '../CartContext';
import './RestaurantMenuModal.css';

const restaurantMenus = {
  r1: [
    { id: 'r1-m1', dish: 'Double Cheeseburger', price: 12.99, description: 'Two beef patties, cheddar cheese, pickles, mustard, ketchup', image: '/food_reel_1.png', tags: ['Classic'] },
    { id: 'r1-m2', dish: 'Truffle French Fries', price: 4.99, description: 'Crispy golden fries tossed in white truffle oil and parmesan cheese', image: '/food_reel_1.png', tags: ['Popular'] },
    { id: 'r1-m3', dish: 'Crispy Onion Rings', price: 5.50, description: 'Beer-battered thick cut onion rings served with BBQ sauce', image: '/food_reel_1.png', tags: [] },
    { id: 'r1-m4', dish: 'Craft Vanilla Shake', price: 5.99, description: 'Rich and creamy vanilla bean milkshake topped with whipped cream', image: '/food_reel_1.png', tags: ['Sweet'] },
  ],
  r2: [
    { id: 'r2-m1', dish: 'Salmon Nigiri (4pcs)', price: 9.99, description: 'Fresh salmon slices over pressed seasoned sushi rice', image: '/food_reel_3.png', tags: ['Fresh'] },
    { id: 'r2-m2', dish: 'Steamed Edamame', price: 4.99, description: 'Steamed soybean pods sprinkled with flaky sea salt', image: '/food_reel_3.png', tags: ['Healthy'] },
    { id: 'r2-m3', dish: 'Pork Gyoza (5pcs)', price: 6.99, description: 'Pan-fried Japanese dumplings served with savory dipping sauce', image: '/food_reel_3.png', tags: ['Popular'] },
    { id: 'r2-m4', dish: 'Iced Matcha Latte', price: 4.50, description: 'Ceremonial grade Japanese green tea whisked with milk', image: '/food_reel_3.png', tags: ['Refreshing'] },
  ],
  r3: [
    { id: 'r3-m1', dish: 'Margherita Pizza', price: 15.99, description: 'San Marzano tomatoes, fresh mozzarella, fresh basil, extra virgin olive oil', image: '/food_reel_2.png', tags: ['Classic'] },
    { id: 'r3-m2', dish: 'Garlic Bread (3pcs)', price: 4.99, description: 'Toasted rustic bread with garlic butter, parsley, and mozzarella', image: '/food_reel_2.png', tags: ['Popular'] },
    { id: 'r3-m3', dish: 'Caprese Salad', price: 8.99, description: 'Ripe vine tomatoes, fresh mozzarella, fresh basil, aged balsamic glaze', image: '/food_reel_2.png', tags: ['Healthy'] },
    { id: 'r3-m4', dish: 'Tiramisu Classico', price: 6.99, description: 'Ladyfingers soaked in espresso, layered with whipped mascarpone cream', image: '/food_reel_2.png', tags: ['Dessert'] },
  ],
  r4: [
    { id: 'r4-m1', dish: 'Spicy Pork Bulgogi Bowl', price: 16.99, description: 'Marinated spicy pork stir-fried with onions, served over steamed rice', image: '/food_reel_4.png', tags: ['Spicy'] },
    { id: 'r4-m2', dish: 'Kimchi Pancake (Jeon)', price: 8.99, description: 'Savory and crispy pancake made with aged kimchi and green onions', image: '/food_reel_4.png', tags: ['Popular'] },
    { id: 'r4-m3', dish: 'Honey Butter Fries', price: 5.49, description: 'Crispy fries tossed in a sweet honey and rich butter glaze', image: '/food_reel_4.png', tags: ['Trending'] },
    { id: 'r4-m4', dish: 'Milkis Soda', price: 3.49, description: 'Popular Korean carbonated drink with a sweet and creamy yogurt flavor', image: '/food_reel_4.png', tags: ['Sweet'] },
  ],
};

export default function RestaurantMenuModal({ restaurant, onClose, onOrderReel }) {
  const { addToCart } = useCart();
  const [dynamicMenu, setDynamicMenu] = useState([]);

  useEffect(() => {
    if (typeof restaurant.id === 'number') {
      fetch(`/api/restaurants/${restaurant.id}/menu`)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error();
        })
        .then(data => {
          setDynamicMenu(data.map(item => ({
            id: item.id,
            dish: item.name,
            price: item.price,
            description: item.description,
            image: item.image_url || '/food_reel_1.png',
            tags: []
          })));
        })
        .catch(err => {});
    }
  }, [restaurant.id]);

  const signatureReel = reels.find(r => r.restaurantId === restaurant.id);
  const menuItems = dynamicMenu.length > 0 ? dynamicMenu : (restaurantMenus[restaurant.id] || []);


  return (
    <div className="menu-modal-overlay" onClick={onClose}>
      <div className="menu-modal" onClick={e => e.stopPropagation()}>
        <div className="menu-modal-handle" />

        {/* Cover image & Title */}
        <div className="menu-header-cover" style={{ background: restaurant.coverColor }}>
          <button className="menu-close-btn" onClick={onClose}>✕</button>
          <div className="menu-restaurant-info">
            <span className="menu-restaurant-avatar">{restaurant.avatar}</span>
            <div>
              <h2 className="menu-restaurant-name">{restaurant.name}</h2>
              <p className="menu-restaurant-cuisine">{restaurant.cuisine}</p>
            </div>
          </div>
        </div>

        <div className="menu-body">
          {/* Restaurant details */}
          <div className="menu-stats">
            <div className="menu-stat-item">
              <span className="stat-icon">⭐</span>
              <span className="stat-val">{restaurant.rating}</span>
              <span className="stat-sub">({restaurant.reviewCount})</span>
            </div>
            <div className="menu-stat-item">
              <span className="stat-icon">🕐</span>
              <span className="stat-val">{restaurant.deliveryTime}</span>
              <span className="stat-sub">Delivery</span>
            </div>
            <div className="menu-stat-item">
              <span className="stat-icon">🛵</span>
              <span className="stat-val">{restaurant.deliveryFee === 0 ? 'Free' : `$${restaurant.deliveryFee}`}</span>
              <span className="stat-sub">Fee</span>
            </div>
          </div>

          {/* Signature Dish (Video Reel) */}
          {signatureReel && (
            <div className="menu-section">
              <h3 className="menu-section-title">Signature Reel Dish 🎥</h3>
              <div className="signature-card" onClick={() => onOrderReel(signatureReel)}>
                <img src={signatureReel.image} alt={signatureReel.dish} className="signature-img" />
                <div className="signature-overlay">
                  <span className="play-badge">▶ Watch & Customize</span>
                  <div className="signature-content">
                    <h4 className="signature-dish-name">{signatureReel.dish}</h4>
                    <p className="signature-dish-desc">{signatureReel.description}</p>
                    <div className="signature-price-row">
                      <span className="signature-price">${signatureReel.price.toFixed(2)}</span>
                      <button className="btn btn-primary signature-btn">Order Now</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Menu list */}
          <div className="menu-section">
            <h3 className="menu-section-title">A la Carte Menu</h3>
            <div className="menu-items-list">
              {menuItems.map(item => (
                <div key={item.id} className="menu-item-row" id={`menu-item-${item.id}`}>
                  <div className="menu-item-details">
                    <div className="menu-item-title-row">
                      <h4 className="menu-item-dish">{item.dish}</h4>
                      {item.tags.map(t => (
                        <span key={t} className="menu-item-tag">{t}</span>
                      ))}
                    </div>
                    <p className="menu-item-desc">{item.description}</p>
                    <span className="menu-item-price">${item.price.toFixed(2)}</span>
                  </div>
                  <button
                    className="btn-icon add-item-btn"
                    onClick={() => addToCart({
                      id: item.id,
                      dish: item.dish,
                      restaurantName: restaurant.name,
                      image: item.image,
                      price: item.price,
                    })}
                  >
                    ＋
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

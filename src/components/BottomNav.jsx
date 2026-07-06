import { useCart } from '../CartContext';
import './BottomNav.css';

const navItems = [
  { id: 'feed', icon: '▶️', label: 'Feed' },
  { id: 'explore', icon: '🔍', label: 'Explore' },
  { id: 'restaurants', icon: '🏪', label: 'Restaurants' },
  { id: 'profile', icon: '👤', label: 'Profile' },
];

export default function BottomNav({ page, setPage }) {
  const { totalItems, setIsCartOpen } = useCart();

  return (
    <nav className="bottom-nav">
      {navItems.map(item => (
        <button
          key={item.id}
          className={`nav-item ${page === item.id ? 'active' : ''}`}
          id={`nav-${item.id}`}
          onClick={() => setPage(item.id)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
          {page === item.id && <span className="nav-dot" />}
        </button>
      ))}

      {/* Floating cart button */}
      <button
        className="nav-cart-fab"
        id="nav-cart-fab"
        onClick={() => setIsCartOpen(true)}
      >
        <span className="fab-icon">🛒</span>
        {totalItems > 0 && <span className="fab-badge">{totalItems}</span>}
      </button>
    </nav>
  );
}

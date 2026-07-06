import './ProfilePage.css';

const orders = [
  { id: '#YM4821', dish: 'Smash Burger Stack', restaurant: 'Flame Burger Co.', date: 'Today, 2:14 PM', total: '$16.98', status: 'delivered', emoji: '🍔' },
  { id: '#YM4790', dish: 'Omakase Roll Platter', restaurant: 'Sakura Sushi Bar', date: 'Yesterday, 7:30 PM', total: '$37.98', status: 'delivered', emoji: '🍣' },
  { id: '#YM4755', dish: 'Carbonara Perfetta', restaurant: "Nonna's Kitchen", date: '2 days ago', total: '$20.49', status: 'delivered', emoji: '🍝' },
];

export default function ProfilePage() {
  return (
    <div className="profile-page">
      {/* Hero */}
      <div className="profile-hero">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">🧑‍🍳</div>
          <div className="profile-avatar-ring" />
        </div>
        <h1 className="profile-name">Alex Rivera</h1>
        <p className="profile-handle">@alexfoodie · Joined June 2024</p>
        <div className="profile-stats">
          <div className="stat"><span className="stat-val">147</span><span className="stat-lbl">Reels Liked</span></div>
          <div className="stat-divider" />
          <div className="stat"><span className="stat-val">23</span><span className="stat-lbl">Saved</span></div>
          <div className="stat-divider" />
          <div className="stat"><span className="stat-val">$1,240</span><span className="stat-lbl">Ordered</span></div>
        </div>
      </div>

      {/* Yami Rewards */}
      <div className="rewards-card">
        <div className="rewards-left">
          <p className="rewards-label">🔥 Yami Rewards</p>
          <p className="rewards-points gradient-text">2,450 pts</p>
          <p className="rewards-sub">550 pts to Gold status</p>
        </div>
        <div className="rewards-bar-wrap">
          <div className="rewards-bar">
            <div className="rewards-progress" style={{ width: '82%' }} />
          </div>
          <p className="rewards-tiers">Silver → Gold</p>
        </div>
      </div>

      {/* Past Orders */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Recent Orders</h2>
          <button className="btn btn-ghost see-all-btn" id="see-all-orders">See all</button>
        </div>
        <div className="orders-list">
          {orders.map(o => (
            <div key={o.id} className="order-card" id={`order-${o.id}`}>
              <div className="order-emoji">{o.emoji}</div>
              <div className="order-info">
                <p className="order-dish">{o.dish}</p>
                <p className="order-meta">{o.restaurant} · {o.date}</p>
              </div>
              <div className="order-right">
                <p className="order-total">{o.total}</p>
                <span className={`order-status ${o.status}`}>{o.status === 'delivered' ? '✅ Delivered' : '🕐 Pending'}</span>
                <button className="btn btn-ghost reorder-btn" id={`reorder-${o.id}`}>Reorder</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="section">
        <h2 className="section-title">Account</h2>
        <div className="settings-list">
          {[
            { icon: '📍', label: 'Delivery Addresses', sub: '2 saved locations' },
            { icon: '💳', label: 'Payment Methods', sub: 'Visa •••• 4242' },
            { icon: '🔔', label: 'Notifications', sub: 'Push, Email enabled' },
            { icon: '❤️', label: 'Favorites', sub: '8 restaurants saved' },
            { icon: '🆘', label: 'Help & Support', sub: 'Contact, FAQ' },
          ].map(item => (
            <button key={item.label} className="settings-item" id={`settings-${item.label.toLowerCase().replace(/\s+/g,'-')}`}>
              <span className="settings-icon">{item.icon}</span>
              <div className="settings-text">
                <span className="settings-label">{item.label}</span>
                <span className="settings-sub">{item.sub}</span>
              </div>
              <span className="settings-arrow">›</span>
            </button>
          ))}
        </div>
      </div>

      <button className="btn btn-ghost logout-btn" id="logout-btn">Sign Out</button>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, token, login, register, logout } = useAuth();
  
  // Auth Form State
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // 'user' or 'provider'
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // General App State
  const [activeTab, setActiveTab] = useState('restaurants'); // 'restaurants', 'reels', 'orders'
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState({}); // mapping restaurantId -> menuItems
  const [loadingData, setLoadingData] = useState(false);

  // Forms State
  const [newRestName, setNewRestName] = useState('');
  const [newRestDesc, setNewRestDesc] = useState('');
  const [newRestImage, setNewRestImage] = useState(null);
  const [restFormError, setRestFormError] = useState('');
  const [restFormSuccess, setRestFormSuccess] = useState('');
  const [creatingRestaurant, setCreatingRestaurant] = useState(false);

  const [activeRestaurantForMenu, setActiveRestaurantForMenu] = useState(null);
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuDesc, setNewMenuDesc] = useState('');
  const [newMenuPrice, setNewMenuPrice] = useState('');
  const [newMenuImage, setNewMenuImage] = useState(null);
  const [menuFormError, setMenuFormError] = useState('');
  const [menuFormSuccess, setMenuFormSuccess] = useState('');
  const [addingMenuItem, setAddingMenuItem] = useState(false);

  const [reelRestId, setReelRestId] = useState('');
  const [reelMenuId, setReelMenuId] = useState('');
  const [reelDesc, setReelDesc] = useState('');
  const [reelVideo, setReelVideo] = useState(null);
  const [reelFormError, setReelFormError] = useState('');
  const [reelFormSuccess, setReelFormSuccess] = useState('');
  const [uploadingReel, setUploadingReel] = useState(false);

  // Fetch relevant user/provider data on mount/login
  useEffect(() => {
    if (!token) return;
    fetchData();
  }, [token, user?.role]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      // 1. Fetch Orders (Works for both Customer and Provider)
      const ordersRes = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      }

      // 2. Fetch Provider Restaurants
      if (user?.role === 'provider') {
        const restRes = await fetch('/api/provider/restaurants', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (restRes.ok) {
          const restsData = await restRes.json();
          setRestaurants(restsData);
          
          // Pre-select first restaurant for Reel Form
          if (restsData.length > 0) {
            setReelRestId(restsData[0].id.toString());
            fetchMenuForRestaurant(restsData[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchMenuForRestaurant = async (restId) => {
    try {
      const res = await fetch(`/api/restaurants/${restId}/menu`);
      if (res.ok) {
        const data = await res.json();
        setMenuItems(prev => ({ ...prev, [restId]: data }));
        // Pre-select first menu item if on Reels tab
        if (data.length > 0) {
          setReelMenuId(data[0].id.toString());
        }
      }
    } catch (err) {
      console.error('Error fetching menu items:', err);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (isSignUp) {
        await register(name, email, password, role);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    setRestFormError('');
    setRestFormSuccess('');
    
    if (!newRestName) {
      setRestFormError('Restaurant name is required');
      return;
    }

    setCreatingRestaurant(true);
    const formData = new FormData();
    formData.append('name', newRestName);
    formData.append('description', newRestDesc);
    if (newRestImage) {
      formData.append('image', newRestImage);
    }

    try {
      const res = await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        setRestFormSuccess('Restaurant created successfully!');
        setNewRestName('');
        setNewRestDesc('');
        setNewRestImage(null);
        fetchData(); // Refresh list
      } else {
        const errData = await res.json();
        setRestFormError(errData.error || 'Failed to create restaurant');
      }
    } catch (err) {
      setRestFormError('Server error occurred. Please try again.');
    } finally {
      setCreatingRestaurant(false);
    }
  };

  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    setMenuFormError('');
    setMenuFormSuccess('');

    if (!newMenuName || !newMenuPrice) {
      setMenuFormError('Name and price are required');
      return;
    }

    setAddingMenuItem(true);
    const formData = new FormData();
    formData.append('restaurant_id', activeRestaurantForMenu.id);
    formData.append('name', newMenuName);
    formData.append('description', newMenuDesc);
    formData.append('price', newMenuPrice);
    if (newMenuImage) {
      formData.append('image', newMenuImage);
    }

    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        setMenuFormSuccess('Menu item added successfully!');
        setNewMenuName('');
        setNewMenuDesc('');
        setNewMenuPrice('');
        setNewMenuImage(null);
        fetchMenuForRestaurant(activeRestaurantForMenu.id); // Refresh menu list
      } else {
        const errData = await res.json();
        setMenuFormError(errData.error || 'Failed to add menu item');
      }
    } catch (err) {
      setMenuFormError('Server error occurred. Please try again.');
    } finally {
      setAddingMenuItem(false);
    }
  };

  const handleUploadReel = async (e) => {
    e.preventDefault();
    setReelFormError('');
    setReelFormSuccess('');

    if (!reelRestId || !reelMenuId || !reelVideo) {
      setReelFormError('All fields (including video file) are required');
      return;
    }

    setUploadingReel(true);
    const formData = new FormData();
    formData.append('restaurant_id', reelRestId);
    formData.append('menu_item_id', reelMenuId);
    formData.append('description', reelDesc);
    formData.append('video', reelVideo);

    try {
      const res = await fetch('/api/reels', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        setReelFormSuccess('Food Reel uploaded successfully!');
        setReelDesc('');
        setReelVideo(null);
      } else {
        const errData = await res.json();
        setReelFormError(errData.error || 'Failed to upload reel');
      }
    } catch (err) {
      setReelFormError('Server error occurred. Please try again.');
    } finally {
      setUploadingReel(false);
    }
  };

  // Switch restaurant in Reels form and fetch its menu items
  const handleReelRestChange = (e) => {
    const val = e.target.value;
    setReelRestId(val);
    if (val) {
      fetchMenuForRestaurant(parseInt(val));
    }
  };

  // Render Login/Signup view
  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">
            <span className="gradient-text">yami</span>
            <span className="logo-dot">🔥</span>
          </div>
          <h2 className="auth-title">{isSignUp ? 'Create your Account' : 'Welcome Back'}</h2>
          <p className="auth-subtitle">{isSignUp ? 'Sign up to discover and order delicious dishes' : 'Log in to continue ordering'}</p>

          <form onSubmit={handleAuthSubmit} className="auth-form">
            {isSignUp && (
              <div className="input-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Chef John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            
            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {isSignUp && (
              <div className="input-group">
                <label>Register As</label>
                <div className="role-selector">
                  <button
                    type="button"
                    className={`role-btn ${role === 'user' ? 'active' : ''}`}
                    onClick={() => setRole('user')}
                  >
                    🍔 Customer
                  </button>
                  <button
                    type="button"
                    className={`role-btn ${role === 'provider' ? 'active' : ''}`}
                    onClick={() => setRole('provider')}
                  >
                    👩‍🍳 Food Provider
                  </button>
                </div>
              </div>
            )}

            {authError && <div className="auth-error">{authError}</div>}

            <button type="submit" className="btn btn-primary auth-submit-btn" disabled={authLoading}>
              {authLoading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Log In'}
            </button>
          </form>

          <div className="auth-toggle">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button className="toggle-link" onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? 'Log In' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Provider Dashboard
  if (user.role === 'provider') {
    return (
      <div className="profile-page">
        {/* Profile Hero */}
        <div className="profile-hero">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">🧑‍🍳</div>
            <div className="profile-avatar-ring" />
          </div>
          <h1 className="profile-name">{user.name}</h1>
          <p className="profile-handle">🏪 Restaurant Partner · {user.email}</p>
          <div className="profile-stats">
            <div className="stat">
              <span className="stat-val">{restaurants.length}</span>
              <span className="stat-lbl">Restaurants</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-val">{orders.length}</span>
              <span className="stat-lbl">Orders Recd</span>
            </div>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <div className="dashboard-tabs">
          <button
            className={`tab-btn ${activeTab === 'restaurants' ? 'active' : ''}`}
            onClick={() => setActiveTab('restaurants')}
          >
            🏪 Restaurants
          </button>
          <button
            className={`tab-btn ${activeTab === 'reels' ? 'active' : ''}`}
            onClick={() => setActiveTab('reels')}
          >
            🎥 Food Reels
          </button>
          <button
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            📋 Orders ({orders.filter(o => o.status === 'pending').length})
          </button>
        </div>

        {/* Tab 1: Restaurants Management */}
        {activeTab === 'restaurants' && (
          <div className="section dashboard-content">
            {!activeRestaurantForMenu ? (
              <>
                <div className="section-header">
                  <h2 className="section-title">My Restaurants</h2>
                </div>

                {restaurants.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-emoji">🏪</span>
                    <h3>No Restaurants Yet</h3>
                    <p>Register your first restaurant location below to start uploading menus.</p>
                  </div>
                ) : (
                  <div className="provider-rests-list">
                    {restaurants.map(r => (
                      <div key={r.id} className="provider-rest-card" onClick={() => {
                        setActiveRestaurantForMenu(r);
                        fetchMenuForRestaurant(r.id);
                      }}>
                        <div className="pr-image" style={{ backgroundImage: `url(${r.image_url || '/yami_logo.png'})` }} />
                        <div className="pr-info">
                          <h4 className="pr-name">{r.name}</h4>
                          <p className="pr-desc">{r.description}</p>
                          <span className="pr-action">View Menu & Add Items →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Create Restaurant Form */}
                <div className="form-card">
                  <h3>Add New Restaurant</h3>
                  <form onSubmit={handleCreateRestaurant}>
                    <div className="input-group">
                      <label>Restaurant Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Golden Dragon Sushi"
                        value={newRestName}
                        onChange={(e) => setNewRestName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="input-group">
                      <label>Description & Cuisine</label>
                      <textarea
                        placeholder="e.g. Japanese premium rolls & bowls"
                        value={newRestDesc}
                        onChange={(e) => setNewRestDesc(e.target.value)}
                      />
                    </div>
                    <div className="input-group">
                      <label>Cover Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setNewRestImage(e.target.files[0])}
                      />
                    </div>

                    {restFormError && <div className="form-error">{restFormError}</div>}
                    {restFormSuccess && <div className="form-success">{restFormSuccess}</div>}

                    <button type="submit" className="btn btn-primary" disabled={creatingRestaurant}>
                      {creatingRestaurant ? 'Creating...' : 'Create Restaurant'}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              // View Menu Items of selected restaurant
              <div>
                <button className="btn btn-ghost back-btn" onClick={() => setActiveRestaurantForMenu(null)}>
                  ← Back to Restaurants
                </button>
                <div className="restaurant-detail-header">
                  <h2>{activeRestaurantForMenu.name} Menu</h2>
                  <p>{activeRestaurantForMenu.description}</p>
                </div>

                {/* Menu list */}
                <div className="menu-list">
                  {!(menuItems[activeRestaurantForMenu.id]?.length > 0) ? (
                    <div className="empty-state">
                      <p>No menu items added to this restaurant yet.</p>
                    </div>
                  ) : (
                    <div className="provider-menu-items">
                      {menuItems[activeRestaurantForMenu.id].map(item => (
                        <div key={item.id} className="menu-item-row">
                          <div className="mi-image" style={{ backgroundImage: `url(${item.image_url || '/yami_logo.png'})` }} />
                          <div className="mi-info">
                            <h4>{item.name}</h4>
                            <p>{item.description}</p>
                          </div>
                          <div className="mi-price">${item.price.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Menu Item Form */}
                <div className="form-card">
                  <h3>Add Menu Item to {activeRestaurantForMenu.name}</h3>
                  <form onSubmit={handleAddMenuItem}>
                    <div className="input-group">
                      <label>Dish Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Spicy Salmon Crunch Roll"
                        value={newMenuName}
                        onChange={(e) => setNewMenuName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="input-group">
                      <label>Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 14.99"
                        value={newMenuPrice}
                        onChange={(e) => setNewMenuPrice(e.target.value)}
                        required
                      />
                    </div>
                    <div className="input-group">
                      <label>Description / Ingredients</label>
                      <textarea
                        placeholder="e.g. Creamy salmon, avocado, spicy mayo, tempura crumbs"
                        value={newMenuDesc}
                        onChange={(e) => setNewMenuDesc(e.target.value)}
                      />
                    </div>
                    <div className="input-group">
                      <label>Dish Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setNewMenuImage(e.target.files[0])}
                      />
                    </div>

                    {menuFormError && <div className="form-error">{menuFormError}</div>}
                    {menuFormSuccess && <div className="form-success">{menuFormSuccess}</div>}

                    <button type="submit" className="btn btn-primary" disabled={addingMenuItem}>
                      {addingMenuItem ? 'Adding...' : 'Add Item to Menu'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Upload Food Reels */}
        {activeTab === 'reels' && (
          <div className="section dashboard-content">
            <h2 className="section-title">Upload Food Reel</h2>
            <p className="section-subtitle">Showcase your signature dishes to thousands of users near you through TikTok-style reels.</p>

            {restaurants.length === 0 ? (
              <div className="empty-state">
                <span className="empty-emoji">⚠️</span>
                <h3>Create a Restaurant First</h3>
                <p>You need to create a restaurant location before uploading reels.</p>
              </div>
            ) : (
              <div className="form-card">
                <form onSubmit={handleUploadReel}>
                  <div className="input-group">
                    <label>1. Select Restaurant</label>
                    <select value={reelRestId} onChange={handleReelRestChange} required>
                      {restaurants.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label>2. Select Menu Item</label>
                    {!(menuItems[reelRestId]?.length > 0) ? (
                      <div className="form-warning">No menu items found. Please add menu items to this restaurant first.</div>
                    ) : (
                      <select value={reelMenuId} onChange={(e) => setReelMenuId(e.target.value)} required>
                        {menuItems[reelRestId].map(item => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="input-group">
                    <label>3. Reel Video File</label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setReelVideo(e.target.files[0])}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>4. Caption / Description</label>
                    <textarea
                      placeholder="e.g. Try our fresh custom sushi roll today! 🔥 #SushiLove #YamiBites"
                      value={reelDesc}
                      onChange={(e) => setReelDesc(e.target.value)}
                    />
                  </div>

                  {reelFormError && <div className="form-error">{reelFormError}</div>}
                  {reelFormSuccess && <div className="form-success">{reelFormSuccess}</div>}

                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={uploadingReel || !(menuItems[reelRestId]?.length > 0)}
                  >
                    {uploadingReel ? 'Uploading...' : 'Publish Food Reel'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Incoming Orders */}
        {activeTab === 'orders' && (
          <div className="section dashboard-content">
            <h2 className="section-title">Incoming Customer Orders</h2>
            
            {orders.length === 0 ? (
              <div className="empty-state">
                <span className="empty-emoji">📋</span>
                <h3>No Orders Yet</h3>
                <p>When customers order from your reels or menus, they will appear here live.</p>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map(o => (
                  <div key={o.id} className="order-card">
                    <div className="order-emoji">🍔</div>
                    <div className="order-info">
                      <p className="order-dish">Order #{o.id}</p>
                      <p className="order-meta">Customer: {o.user_name || 'Anonymous'}</p>
                      <p className="order-meta">From: {o.restaurant_name} · {new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="order-right">
                      <p className="order-total">${parseFloat(o.total).toFixed(2)}</p>
                      <span className={`order-status ${o.status}`}>{o.status.toUpperCase()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <button className="btn btn-ghost logout-btn" onClick={logout}>Sign Out Partner Account</button>
      </div>
    );
  }

  // Render Customer Profile
  return (
    <div className="profile-page">
      {/* Hero */}
      <div className="profile-hero">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">🍔</div>
          <div className="profile-avatar-ring" />
        </div>
        <h1 className="profile-name">{user.name}</h1>
        <p className="profile-handle">{user.email} · Customer Account</p>
        <div className="profile-stats">
          <div className="stat"><span className="stat-val">14</span><span className="stat-lbl">Reels Liked</span></div>
          <div className="stat-divider" />
          <div className="stat"><span className="stat-val">3</span><span className="stat-lbl">Saved</span></div>
          <div className="stat-divider" />
          <div className="stat"><span className="stat-val">{orders.length}</span><span className="stat-lbl">Orders</span></div>
        </div>
      </div>

      {/* Yami Rewards */}
      <div className="rewards-card">
        <div className="rewards-left">
          <p className="rewards-label">🔥 Yami Rewards</p>
          <p className="rewards-points gradient-text">250 pts</p>
          <p className="rewards-sub">750 pts to Gold status</p>
        </div>
        <div className="rewards-bar-wrap">
          <div className="rewards-bar">
            <div className="rewards-progress" style={{ width: '25%' }} />
          </div>
          <p className="rewards-tiers">Silver → Gold</p>
        </div>
      </div>

      {/* Past Orders */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Order History</h2>
        </div>
        
        {orders.length === 0 ? (
          <div className="empty-state">
            <span className="empty-emoji">🛵</span>
            <h3>No Orders Yet</h3>
            <p>Go to the feed and double-tap to order something delicious!</p>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(o => (
              <div key={o.id} className="order-card">
                <div className="order-emoji">🍔</div>
                <div className="order-info">
                  <p className="order-dish">Order #{o.id}</p>
                  <p className="order-meta">{o.restaurant_name} · {new Date(o.created_at).toLocaleDateString()}</p>
                </div>
                <div className="order-right">
                  <p className="order-total">${parseFloat(o.total).toFixed(2)}</p>
                  <span className={`order-status ${o.status}`}>🕐 {o.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="section">
        <h2 className="section-title">Account</h2>
        <div className="settings-list">
          {[
            { icon: '📍', label: 'Delivery Addresses', sub: '2 saved locations' },
            { icon: '💳', label: 'Payment Methods', sub: 'Visa •••• 4242' },
            { icon: '🔔', label: 'Notifications', sub: 'Push, Email enabled' },
            { icon: '🆘', label: 'Help & Support', sub: 'Contact, FAQ' },
          ].map(item => (
            <button key={item.label} className="settings-item">
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

      <button className="btn btn-ghost logout-btn" onClick={logout}>Sign Out</button>
    </div>
  );
}

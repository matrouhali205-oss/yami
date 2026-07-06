import { useState } from 'react';
import { CartProvider } from './CartContext';
import ReelFeed from './components/ReelFeed';
import ExplorePage from './components/ExplorePage';
import RestaurantsPage from './components/RestaurantsPage';
import ProfilePage from './components/ProfilePage';
import BottomNav from './components/BottomNav';
import CartDrawer from './components/CartDrawer';
import './App.css';

export default function App() {
  const [page, setPage] = useState('feed');

  const renderPage = () => {
    switch (page) {
      case 'feed': return <ReelFeed />;
      case 'explore': return <ExplorePage />;
      case 'restaurants': return <RestaurantsPage />;
      case 'profile': return <ProfilePage />;
      default: return <ReelFeed />;
    }
  };

  return (
    <CartProvider>
      <div className="app">
        <main className="app-main">
          {renderPage()}
        </main>

        {/* Bottom nav only shown on non-feed pages, feed manages its own top bar */}
        <BottomNav page={page} setPage={setPage} />

        {/* Global cart drawer */}
        <CartDrawer />
      </div>
    </CartProvider>
  );
}

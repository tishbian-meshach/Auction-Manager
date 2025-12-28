import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { AddAuction } from './pages/AddAuction';
import { AuctionList } from './pages/AuctionList';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background safe-area">
        <main className="max-w-md mx-auto safe-top">
          <Routes>
            <Route path="/" element={<AddAuction />} />
            <Route path="/auctions" element={<AuctionList />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;

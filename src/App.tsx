import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { AddAuction } from './pages/AddAuction';
import { AuctionList } from './pages/AuctionList';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <main className="max-w-md mx-auto">
          <Routes>
            <Route path="/" element={<AddAuction />} />
            <Route path="/auctions" element={<AuctionList />} />
            <Route path="/auctions/edit/:id" element={<AddAuction />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;


import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import AIAdvisor from './components/AIAdvisor';

export type ViewState = 'home' | 'dashboard' | 'ai-advisor' | 'contact';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigate = (view: ViewState) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar 
        currentView={currentView} 
        navigate={navigate} 
        isScrolled={isScrolled} 
      />
      
      <main className="flex-grow pt-16">
        {currentView === 'home' && <LandingPage navigate={navigate} />}
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'ai-advisor' && <AIAdvisor />}
        {currentView === 'contact' && (
          <div className="max-w-4xl mx-auto py-20 px-4 text-center">
            <h1 className="text-4xl font-bold mb-6">Get in Touch</h1>
            <p className="text-slate-600 mb-12">We are available 24/7 for emergency towing across Malaysia.</p>
            <div className="grid md:grid-cols-2 gap-8 text-left">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-xl font-bold mb-4">Contact Info</h3>
                <p className="mb-2"><strong>Domain:</strong> autoassist.com.my</p>
                <p className="mb-2"><strong>Phone:</strong> 1-800-ASSIST-MY</p>
                <p className="mb-2"><strong>Email:</strong> support@autoassist.com.my</p>
                <p><strong>Address:</strong> Level 12, Tower A, Bangsar South, KL</p>
              </div>
              <form className="space-y-4">
                <input type="text" placeholder="Your Name" className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none" />
                <input type="email" placeholder="Your Email" className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none" />
                <textarea placeholder="How can we help?" rows={4} className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
                <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">Send Message</button>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer navigate={navigate} />
    </div>
  );
};

export default App;

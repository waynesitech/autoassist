
import React from 'react';
import { ViewState } from '../App';

interface LandingPageProps {
  navigate: (view: ViewState) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ navigate }) => {
  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/id/183/1600/900" 
            className="w-full h-full object-cover opacity-10" 
            alt="Background"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-50 to-transparent"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-in slide-in-from-left duration-700">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-2">
              <span className="relative flex h-3 w-3 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
              24/7 Roadside Assistance Available
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight text-slate-900">
              Reliable <span className="text-blue-600">Towing</span> at Your Fingertips
            </h1>
            <p className="text-xl text-slate-600 max-w-lg">
              AutoAssist provides Malaysia's most advanced towing management ecosystem. From real-time tracking to automated quotations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => navigate('dashboard')}
                className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-xl shadow-blue-200 transform hover:-translate-y-1"
              >
                Request Service Now
              </button>
              <button 
                onClick={() => navigate('ai-advisor')}
                className="bg-white text-slate-900 border-2 border-slate-200 px-8 py-4 rounded-xl font-bold text-lg hover:border-blue-600 transition"
              >
                Try AI Breakdown Advisor
              </button>
            </div>
          </div>
          
          <div className="hidden lg:block relative">
            <div className="relative z-10 bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 animate-float">
              <img 
                src="https://picsum.photos/id/1071/600/400" 
                className="rounded-2xl mb-6 shadow-inner" 
                alt="Truck App UI"
              />
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Active Job</span>
                  <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-bold uppercase">Dispatched</span>
                </div>
                <h4 className="text-lg font-bold">Toyota Hilux Recovery</h4>
                <div className="flex items-center text-slate-500 text-sm">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Bangsar South, Kuala Lumpur
                </div>
              </div>
            </div>
            {/* Decorative dots/circles */}
            <div className="absolute top-1/2 -right-10 w-40 h-40 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Comprehensive Roadside Support</h2>
          <p className="text-slate-500 max-w-2xl mx-auto">We handle everything from minor repairs to emergency towing with high-tech dispatching systems.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: 'Emergency Towing', desc: 'Flatbed or tow-bar recovery for all vehicle types.', icon: '🚛' },
            { title: 'Battery Jumpstart', desc: 'Fast response for dead batteries anywhere in the city.', icon: '🔋' },
            { title: 'Tire Change', desc: 'Safe roadside tire replacement and repair services.', icon: '⚙️' },
            { title: 'Fuel Delivery', desc: 'Ran out of gas? We bring fuel directly to your location.', icon: '⛽' },
            { title: 'Accident Recovery', desc: 'Professional handling of sensitive accident scenes.', icon: '⚠️' },
            { title: 'Locksmith Service', desc: 'Locked out? Our experts help you regain access.', icon: '🔑' },
          ].map((service, i) => (
            <div key={i} className="group bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
              <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">{service.icon}</div>
              <h3 className="text-xl font-bold mb-3">{service.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{service.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="bg-slate-900 py-24 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative z-10 order-2 lg:order-1">
            <h2 className="text-4xl font-bold mb-6">Manage Everything on Mobile</h2>
            <p className="text-slate-400 text-lg mb-8">Download our application to track your tow truck in real-time, manage digital receipts, and get instant quotes.</p>
            <ul className="space-y-4 mb-10">
              {['Live GPS Tracking', 'Direct Chat with Driver', 'Secure In-App Payments', 'Digital Quotation & History'].map((feat, i) => (
                <li key={i} className="flex items-center">
                  <svg className="w-5 h-5 text-blue-500 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  {feat}
                </li>
              ))}
            </ul>
            <div className="flex gap-4">
              <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" className="h-12 cursor-pointer" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" className="h-12 cursor-pointer" />
            </div>
          </div>
          <div className="order-1 lg:order-2 flex justify-center">
            <div className="relative w-64 h-[500px] bg-slate-800 rounded-[3rem] border-8 border-slate-700 shadow-2xl overflow-hidden">
               <div className="absolute top-0 w-full h-8 bg-slate-700 flex justify-center items-center">
                  <div className="w-16 h-3 bg-slate-900 rounded-full"></div>
               </div>
               <div className="pt-10 p-4">
                  <div className="h-4 w-1/2 bg-blue-500/20 rounded mb-4"></div>
                  <div className="h-32 w-full bg-slate-700 rounded-xl mb-4 animate-pulse"></div>
                  <div className="space-y-2">
                     <div className="h-3 w-full bg-slate-700 rounded"></div>
                     <div className="h-3 w-full bg-slate-700 rounded"></div>
                     <div className="h-3 w-2/3 bg-slate-700 rounded"></div>
                  </div>
                  <div className="mt-8 h-12 w-full bg-blue-600 rounded-full"></div>
               </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

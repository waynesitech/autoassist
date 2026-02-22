
import React from 'react';
import { ViewState } from '../App';

interface FooterProps {
  navigate: (view: ViewState) => void;
}

const Footer: React.FC<FooterProps> = ({ navigate }) => {
  return (
    <footer className="bg-white border-t border-slate-100 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mr-2">
                <span className="text-white font-bold">A</span>
              </div>
              <span className="text-xl font-bold">AutoAssist</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Leading the digital transformation of roadside assistance in Malaysia since 2023.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-6">Services</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li><button className="hover:text-blue-600 transition">Emergency Towing</button></li>
              <li><button className="hover:text-blue-600 transition">Roadside Repair</button></li>
              <li><button className="hover:text-blue-600 transition">Fleet Management</button></li>
              <li><button className="hover:text-blue-600 transition">Battery Recovery</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6">Company</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li><button onClick={() => navigate('home')} className="hover:text-blue-600 transition">About Us</button></li>
              <li><button onClick={() => navigate('contact')} className="hover:text-blue-600 transition">Contact</button></li>
              <li><button className="hover:text-blue-600 transition">Partnerships</button></li>
              <li><button className="hover:text-blue-600 transition">Careers</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6">Support</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li><button className="hover:text-blue-600 transition">Help Center</button></li>
              <li><button className="hover:text-blue-600 transition">Privacy Policy</button></li>
              <li><button className="hover:text-blue-600 transition">Terms of Service</button></li>
              <li><button className="hover:text-blue-600 transition">Refund Policy</button></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-xs">
            © 2024 AutoAssist (autoassist.com.my). All rights reserved.
          </p>
          <div className="flex gap-6">
            {['Twitter', 'Facebook', 'LinkedIn', 'Instagram'].map((social) => (
              <button key={social} className="text-slate-400 hover:text-blue-600 transition text-xs font-medium">
                {social}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

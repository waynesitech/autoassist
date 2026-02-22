
import React, { useState } from 'react';
import { breakdownAdvisor } from '../services/geminiService';

const AIAdvisor: React.FC = () => {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<any>(null);

  const handleAsk = async () => {
    if (!description.trim()) return;
    setLoading(true);
    const result = await breakdownAdvisor(description);
    setAdvice(result);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <div className="inline-block p-3 bg-blue-100 rounded-2xl mb-4">
          <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold mb-4">AI Breakdown Advisor</h1>
        <p className="text-slate-500">Describe your car trouble and our AI will suggest the best course of action instantly.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Describe your situation</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="E.g., My car won't start and there's a clicking sound when I turn the key..."
            className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none h-32 transition"
          />
        </div>
        
        <button 
          onClick={handleAsk}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Analyzing Problem...
            </>
          ) : 'Get Expert Advice'}
        </button>

        {advice && (
          <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={`p-6 rounded-2xl border-l-8 ${advice.serviceType === 'TOWING' ? 'bg-red-50 border-red-500' : 'bg-green-50 border-green-500'}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold uppercase text-slate-500 tracking-wider">Recommended Service</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${advice.serviceType === 'TOWING' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {advice.serviceType}
                </span>
              </div>
              <p className="text-lg font-medium text-slate-800">{advice.explanation}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                  <span className="bg-yellow-100 text-yellow-600 p-1 rounded mr-2">⚠️</span> Safety Precautions
                </h3>
                <ul className="space-y-3">
                  {advice.safetyTips.map((tip: string, i: number) => (
                    <li key={i} className="flex items-start text-sm text-slate-600">
                      <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5 mr-3 flex-shrink-0"></span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                  <span className="bg-blue-100 text-blue-600 p-1 rounded mr-2">🔍</span> Likely Cause
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {advice.likelyCause}
                </p>
              </div>
            </div>
            
            <div className="pt-8 border-t border-slate-100 text-center">
               <button className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-blue-200 transition">
                  Request {advice.serviceType} Now
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAdvisor;

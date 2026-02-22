
import React, { useState } from 'react';
import { JobStatus, TowingJob, Quotation, Product } from '../types';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'quotations' | 'products'>('jobs');
  
  const [jobs] = useState<TowingJob[]>([
    { id: 'JOB-101', customerName: 'Ali bin Ahmad', vehicleModel: 'Proton X50', location: 'Section 14, PJ', status: JobStatus.DISPATCHED, timestamp: '10:30 AM', driver: 'Zulkifli', priority: 'High' },
    { id: 'JOB-102', customerName: 'Siti Sarah', vehicleModel: 'Perodua Myvi', location: 'Taman Melawati', status: JobStatus.PENDING, timestamp: '11:15 AM', priority: 'Normal' },
    { id: 'JOB-103', customerName: 'John Doe', vehicleModel: 'Honda Civic', location: 'Cheras', status: JobStatus.COMPLETED, timestamp: '09:45 AM', driver: 'Ravi', priority: 'Low' },
  ]);

  const [quotations] = useState<Quotation[]>([
    { id: 'QT-882', title: 'Accident Recovery & Storage', amount: 450.00, status: 'Sent', date: '2023-11-20', customer: 'Ali bin Ahmad' },
    { id: 'QT-883', title: 'Interstate Towing (KL to Penang)', amount: 1200.00, status: 'Draft', date: '2023-11-21', customer: 'Tan Ah Kow' },
    { id: 'QT-884', title: 'Premium Battery Replacement', amount: 320.00, status: 'Paid', date: '2023-11-19', customer: 'Siti Sarah' },
  ]);

  const [products] = useState<Product[]>([
    { id: 'P1', name: 'Delphi AGM Battery', category: 'Battery', price: 450, stock: 12, image: 'https://picsum.photos/seed/bat/200' },
    { id: 'P2', name: 'Michelin Pilot Sport 4', category: 'Tire', price: 680, stock: 8, image: 'https://picsum.photos/seed/tire/200' },
    { id: 'P3', name: 'Castrol Edge 5W-40', category: 'Lubricant', price: 180, stock: 45, image: 'https://picsum.photos/seed/oil/200' },
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">System Control Center</h1>
          <p className="text-slate-500">Manage your fleet, billing, and inventory from one place.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('jobs')}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'jobs' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Towing Jobs
          </button>
          <button 
            onClick={() => setActiveTab('quotations')}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'quotations' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Quotations
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'products' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Products
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
        {activeTab === 'jobs' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Job ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Vehicle</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-mono text-sm font-bold text-blue-600">{job.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold">{job.customerName}</div>
                      <div className="text-xs text-slate-400">{job.timestamp}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{job.vehicleModel}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 truncate max-w-[150px]">{job.location}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        job.status === JobStatus.DISPATCHED ? 'bg-blue-100 text-blue-600' :
                        job.status === JobStatus.PENDING ? 'bg-yellow-100 text-yellow-600' :
                        job.status === JobStatus.COMPLETED ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-bold underline">View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'quotations' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Quotation ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-mono text-sm font-bold">{q.id}</td>
                    <td className="px-6 py-4 font-semibold">{q.customer}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{q.title}</td>
                    <td className="px-6 py-4 font-bold">RM {q.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        q.status === 'Paid' ? 'bg-green-100 text-green-600' :
                        q.status === 'Sent' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                       <button className="bg-slate-900 text-white px-3 py-1 rounded text-xs font-bold hover:bg-slate-800">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="p-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <div key={p.id} className="border border-slate-100 rounded-xl p-4 hover:shadow-lg transition">
                  <img src={p.image} className="w-full h-40 object-cover rounded-lg mb-4" alt={p.name} />
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg">{p.name}</h4>
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500 uppercase">{p.category}</span>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-xl font-bold text-blue-600">RM {p.price}</span>
                    <span className="text-sm text-slate-400">Stock: {p.stock}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

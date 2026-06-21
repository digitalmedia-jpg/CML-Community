import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Cpu, 
  Key, 
  Layers, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  MoreVertical,
  Activity,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface CloudUsageData {
  dateRange: { start: string; end: string };
  grouping: string;
  services: {
    id: string;
    name: string;
    requests: number;
    cost: number;
    usage: { date: string; count: number }[];
  }[];
  keys: {
    id: string;
    name: string;
    totalRequests: number;
    lastActive: string;
  }[];
}

export const CloudInsights: React.FC = () => {
  const [data, setData] = useState<CloudUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/cloud/usage');
        if (!response.ok) throw new Error('Failed to fetch usage data');
        const json = await response.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="animate-spin text-gold mr-3" />
        <span className="luxury-label opacity-60">Synchronizing Enterprise Billing Data...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-10 bg-red-500/5 border border-red-500/20 text-red-500 flex items-center gap-4">
        <AlertCircle size={24} />
        <div>
          <h3 className="font-serif italic text-lg">Billing API Connection Failed</h3>
          <p className="text-xs opacity-70">Resolution required: {error || 'Data payload unavailable'}</p>
        </div>
      </div>
    );
  }

  const combinedUsage = data.services[0].usage.map((item, idx) => ({
    date: item.date,
    gemini: item.count,
    vertex: data.services[1].usage[idx]?.count || 0
  }));

  const totalCost = data.services.reduce((acc, s) => acc + s.cost, 0);
  const totalRequests = data.services.reduce((acc, s) => acc + s.requests, 0);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-serif text-slate-900 italic leading-tight">Gemini Cloud Insights</h2>
          <div className="flex items-center gap-3 mt-2">
            <p className="luxury-label opacity-60">Enterprise Usage & Resource Allocation</p>
            <div className="h-px w-8 bg-slate-300" />
            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-600/5 px-2 py-0.5 border border-emerald-600/10">
              <CheckCircle2 size={10} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Real-time Connected</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 border border-slate-100 shadow-sm">
          <div className="px-4 py-1.5 border-r border-slate-100">
            <p className="text-[8px] text-slate-400 font-display uppercase tracking-widest leading-none mb-1">Billing Period</p>
            <p className="text-xs font-serif italic text-slate-900">{data.dateRange.start} — {data.dateRange.end}</p>
          </div>
          <div className="px-4 py-1.5">
            <p className="text-[8px] text-slate-400 font-display uppercase tracking-widest leading-none mb-1">Aggregation</p>
            <p className="text-xs font-serif italic text-slate-900 capitalize">{data.grouping.replace(/_/g, ' ')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="luxury-card p-6 bg-white shadow-sm border-l-4 border-gold">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-luxury-cream text-gold flex items-center justify-center">
              <Cpu size={20} />
            </div>
            <span className="text-[10px] font-display font-black text-emerald-500 flex items-center gap-1">
              <TrendingUp size={10} /> +12.5%
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-display uppercase tracking-widest mb-1">Total API Calls</p>
          <p className="text-2xl font-serif italic text-slate-900">{(totalRequests / 1000).toFixed(1)}k</p>
          <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
            <p className="text-[9px] text-slate-400 font-serif italic">Last 30 Days</p>
            <ArrowUpRight size={12} className="text-slate-300" />
          </div>
        </div>

        <div className="luxury-card p-6 bg-white shadow-sm border-l-4 border-gold">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-luxury-cream text-gold flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-display uppercase tracking-widest mb-1">Estimated Cost</p>
          <p className="text-2xl font-serif italic text-slate-900">${totalCost.toFixed(2)}</p>
          <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
            <p className="text-[9px] text-slate-400 font-serif italic">Credits Applied: $0.00</p>
            <ArrowUpRight size={12} className="text-slate-300" />
          </div>
        </div>

        <div className="luxury-card p-6 bg-white shadow-sm border-l-4 border-gold">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-luxury-cream text-gold flex items-center justify-center">
              <Key size={20} />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-display uppercase tracking-widest mb-1">Active Principals</p>
          <p className="text-2xl font-serif italic text-slate-900">{data.keys.length}</p>
          <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
            <p className="text-[9px] text-slate-400 font-serif italic">Identity Isolation Active</p>
            <ArrowUpRight size={12} className="text-slate-300" />
          </div>
        </div>

        <div className="luxury-card p-6 bg-white shadow-sm border-l-4 border-gold">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-luxury-cream text-gold flex items-center justify-center">
              <Activity size={20} />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-display uppercase tracking-widest mb-1">Error Rate</p>
          <p className="text-2xl font-serif italic text-slate-900">0.04%</p>
          <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
            <p className="text-[9px] text-slate-400 font-serif italic text-emerald-600">Within Threshold</p>
            <ArrowUpRight size={12} className="text-slate-300" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="luxury-card p-8 bg-white shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-serif italic text-slate-900">Request Velocity over Time</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gold" />
                <span className="text-[10px] font-display uppercase border-b border-gold/20">Gemini</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="text-[10px] font-display uppercase border-b border-slate-400/20">Vertex</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={combinedUsage}>
                <defs>
                  <linearGradient id="colorGemini" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C5A02D" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#C5A02D" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a1a', 
                    border: 'none', 
                    borderRadius: '0px',
                    color: '#fff',
                    fontFamily: 'serif',
                    fontStyle: 'italic'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="gemini" 
                  stroke="#C5A02D" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorGemini)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="vertex" 
                  stroke="#94a3b8" 
                  strokeWidth={2}
                  fillOpacity={0} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="luxury-card p-8 bg-white shadow-sm overflow-hidden">
          <h3 className="text-lg font-serif italic text-slate-900 mb-8 lowercase tracking-tight">Active Services Provisioned</h3>
          <div className="space-y-6">
            {data.services.map((service) => (
              <div key={service.id} className="p-5 border border-slate-50 bg-slate-50/30 hover:bg-white hover:shadow-lg transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-sm font-serif italic text-slate-900">{service.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-tight">ID: {service.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-serif italic text-gold">${service.cost.toFixed(2)}</p>
                    <p className="text-[9px] text-slate-400 font-display uppercase tracking-widest mt-1">{service.requests.toLocaleString()} Calls</p>
                  </div>
                </div>
                <div className="mt-4 h-1 bg-slate-100 w-full rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: service.name.includes('Gemini API') ? '70%' : '30%' }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gold"
                  />
                </div>
              </div>
            ))}
            
            <div className="mt-8 pt-8 border-t border-slate-100">
              <div className="flex items-center gap-3 p-4 bg-luxury-cream/50 border border-gold/10">
                 <AlertCircle size={16} className="text-gold" />
                 <p className="text-[11px] text-slate-700 font-serif italic">Dimension grouping by <span className="font-bold">principal_api_key_id</span> is active for this tenant.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="luxury-card bg-white shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <div>
            <h3 className="text-lg font-serif italic text-slate-900">Principal Access Segments</h3>
            <p className="text-[10px] text-slate-500 font-display uppercase tracking-widest mt-1">Usage attribution by security principal</p>
          </div>
          <button className="p-2 hover:bg-white rounded-full transition-colors text-slate-400">
            <MoreVertical size={20} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 bg-white">
                <th className="px-8 py-4 text-[9px] font-display uppercase tracking-widest text-slate-400 font-black">Principal / Access Key ID</th>
                <th className="px-8 py-4 text-[9px] font-display uppercase tracking-widest text-slate-400 font-black">Segment</th>
                <th className="px-8 py-4 text-[9px] font-display uppercase tracking-widest text-slate-400 font-black text-right">Volume</th>
                <th className="px-8 py-4 text-[9px] font-display uppercase tracking-widest text-slate-400 font-black">Last Active</th>
                <th className="px-8 py-4 text-[9px] font-display uppercase tracking-widest text-slate-400 font-black text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.keys.map((key) => (
                <tr key={key.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Key size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-serif italic text-slate-900">{key.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono tracking-tighter">{key.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-[10px] px-2 py-1 bg-luxury-cream text-gold border border-gold/10 font-bold uppercase tracking-tight">
                      {key.id.includes('hq') ? 'Corporate' : key.id.includes('ramada') ? 'Ramada' : 'Wyndham'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right font-mono text-xs text-slate-600">
                    {key.totalRequests.toLocaleString()}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock size={12} />
                      <span className="text-[10px] font-serif italic">{new Date(key.lastActive).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-emerald-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Active</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

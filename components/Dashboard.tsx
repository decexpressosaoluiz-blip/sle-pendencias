import React, { useEffect, useState, useMemo } from 'react';
import { Pendencia, DashboardStats } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, AreaChart, Area } from 'recharts';
import { getDashboardInsights } from '../services/ai';
import { Sparkles, AlertTriangle, TrendingUp, CheckCircle, Clock, Filter, DollarSign, BarChart3, Truck } from 'lucide-react';

interface DashboardProps {
  data: Pendencia[];
  onStatusClick: (status: 'ALL' | 'OVERDUE' | 'PRIORITY' | 'ON_TIME') => void;
}

const COLORS = {
  OVERDUE: '#ef4444',
  PRIORITY: '#eab308',
  TOMORROW: '#f97316',
  ON_TIME: '#22c55e',
  blue: '#0ea5e9',
  purple: '#8b5cf6',
  gray: '#94a3b8'
};

const Dashboard: React.FC<DashboardProps> = ({ data, onStatusClick }) => {
  // Filter States
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');
  const [activeStatusFilters, setActiveStatusFilters] = useState<string[]>(['OVERDUE', 'PRIORITY', 'TOMORROW', 'ON_TIME']);
  const [activePaymentFilters, setActivePaymentFilters] = useState<string[]>(['CIF', 'FOB', 'FATURAR_REMETENTE', 'FATURAR_DEST']);
  
  // AI State
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Derived Lists for Dropdowns/Toggles
  const uniqueUnits = useMemo(() => Array.from(new Set(data.map(d => d.entrega).filter(Boolean))).sort(), [data]);
  const paymentTypes = ['CIF', 'FOB', 'FATURAR_REMETENTE', 'FATURAR_DEST'];
  const statusTypes = [
      { key: 'OVERDUE', label: 'Crítico', color: 'bg-red-500' },
      { key: 'PRIORITY', label: 'Prioridade', color: 'bg-yellow-500' },
      { key: 'TOMORROW', label: 'Amanhã', color: 'bg-orange-500' },
      { key: 'ON_TIME', label: 'No Prazo', color: 'bg-green-500' }
  ];

  // --- FILTERING LOGIC ---
  const filteredData = useMemo(() => {
      return data.filter(item => {
          // Unit Filter
          if (selectedUnit !== 'ALL' && item.entrega !== selectedUnit) return false;
          
          // Status Filter
          let statusKey = item.calculatedStatus === 'TOMORROW' ? 'TOMORROW' : item.calculatedStatus;
          if (!activeStatusFilters.includes(statusKey)) return false;

          // Payment Filter
          const payment = item.fretePago ? item.fretePago.toUpperCase() : '';
          const paymentMatch = activePaymentFilters.some(filter => payment.includes(filter));
          if (!paymentMatch) return false;

          return true;
      });
  }, [data, selectedUnit, activeStatusFilters, activePaymentFilters]);

  // --- STATISTICS CALCULATION ---
  const stats = useMemo(() => {
      const s = {
          totalCount: filteredData.length,
          totalValue: filteredData.reduce((acc, curr) => acc + (curr.valorCte || 0), 0),
          byStatus: {
              OVERDUE: { count: 0, value: 0 },
              PRIORITY: { count: 0, value: 0 },
              TOMORROW: { count: 0, value: 0 },
              ON_TIME: { count: 0, value: 0 },
          } as Record<string, { count: number, value: number }>,
          byUnit: {} as Record<string, { count: number, value: number }>,
          byPayment: {} as Record<string, { count: number, value: number }>
      };

      filteredData.forEach(d => {
          // Status Stats
          const st = d.calculatedStatus === 'TOMORROW' ? 'TOMORROW' : d.calculatedStatus;
          if (s.byStatus[st]) {
              s.byStatus[st].count += 1;
              s.byStatus[st].value += (d.valorCte || 0);
          }

          // Unit Stats
          if (d.entrega) {
              if (!s.byUnit[d.entrega]) s.byUnit[d.entrega] = { count: 0, value: 0 };
              s.byUnit[d.entrega].count += 1;
              s.byUnit[d.entrega].value += (d.valorCte || 0);
          }

          // Payment Stats
          const payType = d.fretePago || 'OUTROS';
          // Simplify payment key for chart grouping
          let simplePay = 'OUTROS';
          if(payType.includes('CIF')) simplePay = 'CIF';
          else if(payType.includes('FOB')) simplePay = 'FOB';
          else if(payType.includes('REMETENTE')) simplePay = 'REM';
          else if(payType.includes('DEST')) simplePay = 'DEST';

          if (!s.byPayment[simplePay]) s.byPayment[simplePay] = { count: 0, value: 0 };
          s.byPayment[simplePay].count += 1;
          s.byPayment[simplePay].value += (d.valorCte || 0);
      });

      return s;
  }, [filteredData]);

  // --- CHART DATA PREPARATION ---
  const offenderVolumeData = Object.entries(stats.byUnit)
      .map(([name, data]) => ({ name, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

  const offenderValueData = Object.entries(stats.byUnit)
      .map(([name, data]) => ({ name, value: data.value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

  const statusPieData = Object.entries(stats.byStatus)
      .filter(([_, data]) => data.count > 0)
      .map(([key, data]) => ({ name: key, value: data.count }));

  const paymentBarData = Object.entries(stats.byPayment)
      .map(([name, data]) => ({ name, value: data.value }));


  // --- HANDLERS ---
  const toggleStatusFilter = (status: string) => {
      setActiveStatusFilters(prev => 
          prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
      );
  };

  const togglePaymentFilter = (payment: string) => {
      setActivePaymentFilters(prev => 
          prev.includes(payment) ? prev.filter(p => p !== payment) : [...prev, payment]
      );
  };

  const generateInsights = async () => {
      setLoadingAi(true);
      const dashboardStatsForAi: DashboardStats = {
          total: stats.totalCount,
          overdue: stats.byStatus.OVERDUE.count,
          priority: stats.byStatus.PRIORITY.count,
          onTime: stats.byStatus.ON_TIME.count + stats.byStatus.TOMORROW.count,
          byUnit: Object.fromEntries(Object.entries(stats.byUnit).map(([k,v]) => [k, v.count])),
          byStatus: Object.fromEntries(Object.entries(stats.byStatus).map(([k,v]) => [k, v.count]))
      };
      
      const criticalIssues = filteredData.filter(d => d.calculatedStatus === 'OVERDUE');
      
      const insights = await getDashboardInsights(dashboardStatsForAi, criticalIssues);
      setAiInsights(insights);
      setLoadingAi(false);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* 1. FILTERS & CONTROLS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Filter size={20} className="text-blue-600"/> Filtros Gerenciais
              </h2>
              
              {/* Unit Filter */}
              <div className="w-full md:w-auto">
                  <select 
                      value={selectedUnit} 
                      onChange={(e) => setSelectedUnit(e.target.value)}
                      className="w-full md:w-64 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium bg-white text-gray-900"
                  >
                      <option value="ALL">Todas as Unidades (Destino)</option>
                      {uniqueUnits.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status Toggles */}
              <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Status</label>
                  <div className="flex flex-wrap gap-2">
                      {statusTypes.map(type => (
                          <button
                              key={type.key}
                              onClick={() => toggleStatusFilter(type.key)}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-2 ${
                                  activeStatusFilters.includes(type.key) 
                                  ? `${type.color} text-white border-transparent shadow-md` 
                                  : 'bg-white text-gray-400 border-gray-200 grayscale'
                              }`}
                          >
                              {activeStatusFilters.includes(type.key) && <CheckCircle size={12} />}
                              {type.label}
                          </button>
                      ))}
                  </div>
              </div>

              {/* Payment Toggles */}
              <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Pagamento</label>
                  <div className="flex flex-wrap gap-2">
                      {paymentTypes.map(type => (
                          <button
                              key={type}
                              onClick={() => togglePaymentFilter(type)}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                                  activePaymentFilters.includes(type) 
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                                  : 'bg-white text-gray-400 border-gray-200'
                              }`}
                          >
                              {type.replace('FATURAR_', '')}
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      </div>

      {/* 2. KPI CARDS (DYNAMIC VALUES) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-blue-500 border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase">Total Pendente</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats.totalCount}</h3>
              <p className="text-sm font-medium text-blue-600 mt-1">{formatCurrency(stats.totalValue)}</p>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-red-500 border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase">Crítico (Vencido)</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats.byStatus.OVERDUE.count}</h3>
              <p className="text-sm font-medium text-red-600 mt-1">{formatCurrency(stats.byStatus.OVERDUE.value)}</p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-yellow-500 border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase">Prioridade (Hoje)</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats.byStatus.PRIORITY.count}</h3>
              <p className="text-sm font-medium text-yellow-600 mt-1">{formatCurrency(stats.byStatus.PRIORITY.value)}</p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-green-500 border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase">No Prazo / Amanhã</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats.byStatus.ON_TIME.count + stats.byStatus.TOMORROW.count}</h3>
              <p className="text-sm font-medium text-green-600 mt-1">{formatCurrency(stats.byStatus.ON_TIME.value + stats.byStatus.TOMORROW.value)}</p>
          </div>
      </div>

      {/* 3. OFFENDER ANALYSIS CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Volume Offenders */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="text-orange-500" size={20} />
                  <h3 className="font-bold text-gray-800">Maiores Ofensores (Volume)</h3>
              </div>
              <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={offenderVolumeData} layout="vertical" margin={{ left: 20 }}>
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={100} style={{fontSize: '10px', fontWeight: 'bold'}} interval={0} />
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} barSize={15} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Financial Offenders */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="text-emerald-600" size={20} />
                  <h3 className="font-bold text-gray-800">Maiores Ofensores (Faturamento)</h3>
              </div>
              <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={offenderValueData} layout="vertical" margin={{ left: 20 }}>
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={100} style={{fontSize: '10px', fontWeight: 'bold'}} interval={0} />
                          <Tooltip formatter={(val: number) => formatCurrency(val)} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={15} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>

      {/* 4. AI INSIGHTS (ON DEMAND) */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 bg-white/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="flex items-center gap-3">
                  <div className="bg-blue-500/20 p-2 rounded-lg backdrop-blur-sm border border-blue-500/30">
                      <Sparkles className="text-blue-400" size={24} />
                  </div>
                  <div>
                      <h2 className="text-xl font-bold">Inteligência Artificial</h2>
                      <p className="text-slate-400 text-sm">Análise estratégica baseada nos filtros atuais.</p>
                  </div>
              </div>
              <button 
                  onClick={generateInsights}
                  disabled={loadingAi}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                  {loadingAi ? 'Analisando...' : 'Gerar Análise Agora'}
              </button>
          </div>

          {loadingAi ? (
              <div className="animate-pulse space-y-3 opacity-50">
                  <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-700 rounded w-1/2"></div>
              </div>
          ) : aiInsights ? (
              <div className="space-y-4 animate-slideUp">
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
                      <p className="text-slate-200 leading-relaxed text-sm md:text-base">{aiInsights.analysis}</p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                          <h4 className="font-bold text-blue-300 text-sm mb-3 flex items-center gap-2"><TrendingUp size={16}/> Recomendações</h4>
                          <ul className="space-y-2">
                              {aiInsights.recommendations?.map((rec: string, i: number) => (
                                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                      <span className="text-blue-500 mt-1">•</span> {rec}
                                  </li>
                              ))}
                          </ul>
                      </div>
                      {aiInsights.anomaly && (
                           <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                              <h4 className="font-bold text-red-300 text-sm mb-3 flex items-center gap-2"><AlertTriangle size={16}/> Ponto de Atenção</h4>
                              <p className="text-sm text-slate-300">{aiInsights.anomaly}</p>
                          </div>
                      )}
                  </div>
              </div>
          ) : (
              <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-700 rounded-lg">
                  <p>Clique no botão para gerar uma análise personalizada.</p>
              </div>
          )}
      </div>
    </div>
  );
};

export default Dashboard;
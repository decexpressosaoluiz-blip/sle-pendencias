import React, { useState, useMemo, useEffect } from 'react';
import { Pendencia, User, UserRole, Note } from '../types';
import { Search, MessageSquare, AlertCircle, ArrowUpDown, FileSpreadsheet, Download, Truck, Package, Calendar, MapPin, DollarSign, X, Filter } from 'lucide-react';

interface IssueListProps {
  data: Pendencia[];
  user: User;
  notes?: Note[];
  onSelect: (issue: Pendencia) => void;
  initialFilter?: string | null;
  forceShowAllUnits?: boolean;
}

const IssueList: React.FC<IssueListProps> = ({ data, user, notes = [], onSelect, initialFilter, forceShowAllUnits = false }) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPayment, setFilterPayment] = useState<string | null>(null);
  const [filterNoteStatus, setFilterNoteStatus] = useState<'ALL' | 'WITH_NOTE' | 'WITHOUT_NOTE'>('ALL');
  const [filterUnit, setFilterUnit] = useState<string>('ALL');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Pendencia, direction: 'asc' | 'desc' }>({ key: 'dataLimiteBaixa', direction: 'asc' });
  const [viewMode, setViewMode] = useState<'DESTINATION' | 'ORIGIN'>('DESTINATION');

  useEffect(() => {
    if (initialFilter) setFilterStatus(initialFilter);
  }, [initialFilter]);

  // Extract unique units for filter dropdown (Only for Admin/Leitor)
  const uniqueUnits = useMemo(() => {
      if (user.role === UserRole.UNIDADE && !forceShowAllUnits) return [];
      return Array.from(new Set(data.map(d => d.entrega).filter(Boolean))).sort();
  }, [data, user, forceShowAllUnits]);

  const filteredData = useMemo(() => {
    let res = Array.isArray(data) ? data : [];

    // Role-based Unit Filtering
    if (!forceShowAllUnits && user.role === UserRole.UNIDADE) {
        if (viewMode === 'DESTINATION') {
            if (user.linkedDestUnit) res = res.filter(d => d.entrega === user.linkedDestUnit);
        } else {
            if (user.linkedOriginUnit) res = res.filter(d => d.coleta === user.linkedOriginUnit);
        }
    } else {
        // Admin/Leitor Unit Filter Logic
        if (filterUnit !== 'ALL') {
            res = res.filter(d => d.entrega === filterUnit);
        }
    }

    if (search) {
      const s = search.toLowerCase();
      res = res.filter(d => 
        (d.cte && d.cte.toLowerCase().includes(s)) || 
        (d.destinatario && d.destinatario.toLowerCase().includes(s)) ||
        (d.codigo && d.codigo.toLowerCase().includes(s))
      );
    }

    if (filterStatus !== 'ALL') {
      res = res.filter(d => d.calculatedStatus === filterStatus);
    }
    
    if (filterPayment) {
        res = res.filter(d => d.fretePago && d.fretePago.includes(filterPayment));
    }

    if (filterNoteStatus === 'WITH_NOTE') {
        res = res.filter(d => d.noteCount > 0);
    } else if (filterNoteStatus === 'WITHOUT_NOTE') {
        res = res.filter(d => d.noteCount === 0);
    }

    return res.sort((a, b) => {
        let valA: any = a[sortConfig.key];
        let valB: any = b[sortConfig.key];

        if (sortConfig.key === 'dataLimiteBaixa') {
            const parse = (d: string) => {
                if (!d) return 0;
                const parts = d.split('/');
                return parts.length === 3 ? new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0])).getTime() : 0;
            };
            valA = parse(valA);
            valB = parse(valB);
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

  }, [data, user, search, filterStatus, sortConfig, viewMode, forceShowAllUnits, filterPayment, filterNoteStatus, filterUnit]);

  const handleSort = (key: keyof Pendencia) => {
      setSortConfig(curr => ({
          key,
          direction: curr.key === key && curr.direction === 'asc' ? 'desc' : 'asc'
      }));
  };

  const handleExportXLS = () => {
      if (filteredData.length === 0) {
          alert("Não há dados filtrados para exportar.");
          return;
      }
      
      const safeNotes = Array.isArray(notes) ? notes : [];
      let tableContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="UTF-8">
            <style>
                th { background-color: #f0f0f0; font-weight: bold; border: 1px solid #000; }
                td { border: 1px solid #ccc; mso-number-format:"\@"; }
            </style>
        </head>
        <body>
        <table>
            <thead>
                <tr>
                    <th>PROCESSO ABERTO?</th>
                    <th>STATUS</th>
                    <th>PAGAMENTO</th>
                    <th>CTE</th>
                    <th>SÉRIE</th>
                    <th>CÓDIGO</th>
                    <th>EMISSÃO</th>
                    <th>DATA LIMITE</th>
                    <th>ORIGEM (COLETA)</th>
                    <th>DESTINO (ENTREGA)</th>
                    <th>DESTINATÁRIO</th>
                    <th>VALOR</th>
                    <th>JUSTIFICATIVA / ÚLTIMA NOTA</th>
                </tr>
            </thead>
            <tbody>
      `;
      filteredData.forEach(item => {
          const itemNotes = safeNotes.filter(n => String(n.cte).trim() === String(item.cte).trim());
          const latestNote = itemNotes.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];
          const obsFinal = latestNote 
              ? `[${new Date(latestNote.data).toLocaleDateString()}] ${latestNote.autor}: ${latestNote.texto}`
              : item.justificativa;
          tableContent += `
            <tr>
                <td>${item.hasOpenProcess ? 'SIM' : 'NÃO'}</td>
                <td>${item.calculatedStatus === 'OVERDUE' ? 'CRÍTICO' : item.calculatedStatus}</td>
                <td>${item.fretePago}</td>
                <td>${item.cte}</td>
                <td>${item.serie}</td>
                <td>${item.codigo}</td>
                <td>${item.dataEmissao}</td>
                <td>${item.dataLimiteBaixa}</td>
                <td>${item.coleta}</td>
                <td>${item.entrega}</td>
                <td>${item.destinatario}</td>
                <td>${item.valorCte?.toFixed(2).replace('.', ',')}</td>
                <td>${obsFinal || ''}</td>
            </tr>
          `;
      });
      tableContent += `</tbody></table></body></html>`;
      const blob = new Blob([tableContent], { type: 'application/vnd.ms-excel' });
      const url = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = `Relatorio_Pendencias_${new Date().toLocaleDateString().replace(/\//g, '-')}.xls`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
  };

  const getStatusBadge = (status: Pendencia['calculatedStatus']) => {
    switch (status) {
      case 'OVERDUE': return <span className="inline-block w-fit px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded border border-red-200 whitespace-nowrap">CRÍTICO</span>;
      case 'PRIORITY': return <span className="inline-block w-fit px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded border border-yellow-200 whitespace-nowrap">HOJE</span>;
      case 'TOMORROW': return <span className="inline-block w-fit px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded border border-amber-100 whitespace-nowrap">AMANHÃ</span>;
      default: return <span className="inline-block w-fit px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded border border-blue-100 whitespace-nowrap">NO PRAZO</span>;
    }
  };

  const getPaymentBadge = (type: string) => {
      const t = type ? type.toUpperCase().trim() : 'N/A';
      let style = "bg-gray-100 text-gray-600 border-gray-200";
      if (t.includes('CIF')) style = "bg-emerald-100 text-emerald-800 border-emerald-200";
      else if (t.includes('FOB')) style = "bg-purple-100 text-purple-800 border-purple-200";
      else if (t.includes('REMETENTE')) style = "bg-orange-100 text-orange-800 border-orange-200";
      else if (t.includes('DEST')) style = "bg-cyan-100 text-cyan-800 border-cyan-200";
      
      return (
        <button 
            onClick={(e) => { e.stopPropagation(); setFilterPayment(t); }}
            className={`inline-block w-fit px-2 py-0.5 text-[10px] font-bold rounded border whitespace-nowrap cursor-pointer hover:opacity-80 active:scale-95 transition-all ${style}`}
            title="Clique para filtrar"
        >
            {t}
        </button>
      );
  };

  return (
    <div className="flex flex-col h-full space-y-4">
        
      {/* Cards de Seleção de Unidade */}
      {!forceShowAllUnits && user.role === UserRole.UNIDADE && (
          <div className="grid grid-cols-2 gap-3 w-full shrink-0">
              <div 
                  onClick={() => setViewMode('DESTINATION')}
                  className={`
                      relative p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-1 md:gap-2 text-center h-20 md:h-24
                      ${viewMode === 'DESTINATION' 
                          ? 'bg-blue-50 border-blue-500 shadow-md transform scale-[1.02]' 
                          : 'bg-white border-gray-100 text-gray-400 hover:border-blue-200 hover:bg-gray-50'
                      }
                  `}
              >
                  <Truck size={24} className={`md:w-7 md:h-7 ${viewMode === 'DESTINATION' ? 'text-blue-600' : 'text-gray-300'}`} />
                  <div>
                      <span className={`block font-bold text-xs md:text-base leading-tight ${viewMode === 'DESTINATION' ? 'text-blue-800' : 'text-gray-500'}`}>
                          Minhas Entregas
                      </span>
                      <span className="text-[10px] md:text-xs font-medium opacity-70">(Destino)</span>
                  </div>
                  {viewMode === 'DESTINATION' && <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>}
              </div>

              <div 
                  onClick={() => setViewMode('ORIGIN')}
                  className={`
                      relative p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-1 md:gap-2 text-center h-20 md:h-24
                      ${viewMode === 'ORIGIN' 
                          ? 'bg-indigo-50 border-indigo-500 shadow-md transform scale-[1.02]' 
                          : 'bg-white border-gray-100 text-gray-400 hover:border-indigo-200 hover:bg-gray-50'
                      }
                  `}
              >
                  <Package size={24} className={`md:w-7 md:h-7 ${viewMode === 'ORIGIN' ? 'text-indigo-600' : 'text-gray-300'}`} />
                   <div>
                      <span className={`block font-bold text-xs md:text-base leading-tight ${viewMode === 'ORIGIN' ? 'text-indigo-800' : 'text-gray-500'}`}>
                          Minhas Emissões
                      </span>
                      <span className="text-[10px] md:text-xs font-medium opacity-70">(Origem)</span>
                  </div>
                  {viewMode === 'ORIGIN' && <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>}
              </div>
          </div>
      )}

      {forceShowAllUnits && (
          <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-3 rounded-md flex items-center gap-2 text-sm">
              <Package size={18} />
              <span className="font-bold">Todos os Processos em Aberto</span>
          </div>
      )}

      <div className="bg-white md:rounded-xl md:shadow-sm md:border border-gray-200 h-full flex flex-col bg-transparent md:bg-white overflow-hidden">
        
        {/* Sticky Header with Search and Filters */}
        <div className="p-3 md:p-4 border-b border-gray-100 flex flex-col gap-3 bg-white sticky top-0 z-20 shrink-0 shadow-sm md:rounded-t-xl">
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar CTE, Destinatário, Código..." 
                        className="w-full pl-10 pr-4 py-2 bg-blue-50 border border-blue-100 text-blue-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-blue-300 text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                {/* Admin Unit Filter */}
                {(user.role === UserRole.ADMIN || user.role === UserRole.LEITOR) && uniqueUnits.length > 0 && (
                    <select 
                        value={filterUnit}
                        onChange={(e) => setFilterUnit(e.target.value)}
                        className="p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-48"
                    >
                        <option value="ALL">Todas Unidades</option>
                        {uniqueUnits.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                )}
            </div>
            
            {/* Filter Buttons Container - Changed to Flex Wrap for Mobile */}
            <div className="flex flex-wrap gap-2 w-full pb-2 md:pb-0 items-center">
                {/* Status Buttons Group */}
                <div className="flex flex-wrap gap-2 grow">
                    {['ALL', 'OVERDUE', 'PRIORITY', 'TOMORROW', 'ON_TIME'].map(st => (
                        <button
                            key={st}
                            onClick={() => setFilterStatus(st)}
                            className={`
                                flex-1 min-w-[70px] px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold whitespace-nowrap transition-colors border uppercase tracking-wide text-center
                                ${filterStatus === st 
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}
                            `}
                        >
                            {st === 'ALL' ? 'Todos' : st === 'OVERDUE' ? 'Críticos' : st === 'PRIORITY' ? 'Prioridade' : st === 'TOMORROW' ? 'Amanhã' : 'No Prazo'}
                        </button>
                    ))}
                </div>

                <div className="hidden md:block h-6 w-px bg-gray-300 mx-1"></div>

                {/* Filter by Note Status */}
                <div className="flex bg-gray-100 p-0.5 rounded-lg shrink-0 w-full md:w-auto">
                    <button 
                        onClick={() => setFilterNoteStatus('ALL')}
                        className={`flex-1 px-3 py-1 rounded text-[10px] font-bold transition-all whitespace-nowrap ${filterNoteStatus === 'ALL' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}
                    >
                        Todos
                    </button>
                    <button 
                        onClick={() => setFilterNoteStatus('WITH_NOTE')}
                        className={`flex-1 px-3 py-1 rounded text-[10px] font-bold transition-all whitespace-nowrap ${filterNoteStatus === 'WITH_NOTE' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
                    >
                        Com Nota
                    </button>
                    <button 
                        onClick={() => setFilterNoteStatus('WITHOUT_NOTE')}
                        className={`flex-1 px-3 py-1 rounded text-[10px] font-bold transition-all whitespace-nowrap ${filterNoteStatus === 'WITHOUT_NOTE' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}
                    >
                        Sem Nota
                    </button>
                </div>
                
                {filterPayment && (
                     <button 
                        onClick={() => setFilterPayment(null)}
                        className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-gray-800 text-white rounded-full text-[10px] font-bold whitespace-nowrap hover:bg-gray-700 animate-fadeIn ml-2"
                    >
                        Filtro: {filterPayment} <X size={12} />
                    </button>
                )}

                <button 
                    onClick={handleExportXLS}
                    className="ml-auto flex-shrink-0 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg flex items-center gap-1 text-[10px] font-bold hover:bg-green-100 transition-colors whitespace-nowrap"
                >
                    <Download size={14} /> <span className="hidden sm:inline">Exportar XLS</span>
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto md:bg-white bg-gray-50/50 p-2 md:p-0">
            <table className="w-full text-left border-collapse">
            
            {/* Desktop Header - Hidden on Mobile */}
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm hidden md:table-header-group">
                <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('calculatedStatus')}>Status <ArrowUpDown size={12} className="inline ml-1"/></th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('fretePago')}>Pagamento <ArrowUpDown size={12} className="inline ml-1"/></th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">CTE / Série</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {forceShowAllUnits ? 'Origem / Destino' : (viewMode === 'DESTINATION' ? 'Origem' : 'Destino')}
                </th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('dataLimiteBaixa')}>Data Limite <ArrowUpDown size={12} className="inline ml-1"/></th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('destinatario')}>Destinatário <ArrowUpDown size={12} className="inline ml-1"/></th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Obs</th>
                </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-gray-100 md:divide-y-0 block md:table-row-group">
                {filteredData.map((item, idx) => (
                <tr 
                    key={`${item.cte}-${idx}`} 
                    className="
                        group cursor-pointer transition-all
                        /* Mobile Styles (Card Look) */
                        flex flex-col bg-white p-4 mb-3 rounded-xl shadow-sm border border-gray-100
                        /* Desktop Styles (Table Row Look) */
                        md:table-row md:mb-0 md:rounded-none md:shadow-none md:border-b md:hover:bg-blue-50/50
                    "
                    onClick={() => onSelect(item)}
                >
                    
                    {/* Status & Payment (Mobile: Top Row) */}
                    <td className="md:p-3 md:align-middle block md:table-cell mb-2 md:mb-0">
                        <div className="flex justify-between items-start md:block">
                            <div className="flex flex-col gap-1 items-start"> 
                                {item.hasOpenProcess && <span className="inline-block w-fit text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold">EM ABERTO</span>}
                                {getStatusBadge(item.calculatedStatus)}
                            </div>
                            {/* Mobile Payment Tag */}
                            <div className="md:hidden">
                                {getPaymentBadge(item.fretePago)}
                            </div>
                        </div>
                    </td>

                    {/* Payment (Desktop only column, hidden mobile because it's moved up) */}
                    <td className="p-3 align-middle hidden md:table-cell">{getPaymentBadge(item.fretePago)}</td>

                    {/* CTE Info */}
                    <td className="md:p-3 md:align-middle block md:table-cell mb-1 md:mb-0">
                        <div className="flex items-center gap-2 md:block">
                            <span className="md:hidden text-xs text-gray-400 font-bold w-16">CTE:</span>
                            <div>
                                <div className="text-sm font-bold text-gray-900">#{item.cte}</div>
                                <div className="text-[10px] text-gray-500">Série {item.serie}</div>
                            </div>
                        </div>
                    </td>

                    {/* Origin/Dest Info */}
                    <td className="md:p-3 md:align-middle block md:table-cell text-sm text-gray-600 font-medium mb-1 md:mb-0">
                        {/* Mobile Route Display - Explicitly show BOTH */}
                        <div className="md:hidden mt-1 mb-2 bg-gray-50 rounded-lg p-2 border border-gray-100 flex flex-col gap-1">
                             <div className="flex items-center justify-between">
                                 <span className="text-[10px] uppercase font-bold text-gray-400">Origem</span>
                                 <div className="flex items-center gap-1 text-xs font-bold text-gray-700">
                                     <MapPin size={10} /> {item.coleta}
                                 </div>
                             </div>
                             <div className="w-full h-px bg-gray-200"></div>
                             <div className="flex items-center justify-between">
                                 <span className="text-[10px] uppercase font-bold text-gray-400">Destino</span>
                                 <div className="flex items-center gap-1 text-xs font-bold text-blue-700">
                                     <Truck size={10} /> {item.entrega}
                                 </div>
                             </div>
                        </div>

                        {/* Desktop Route Display - Context Aware */}
                        <div className="hidden md:block">
                            <div className="flex items-center gap-2 md:block">
                                <div className="flex flex-col">
                                    {forceShowAllUnits ? (
                                        <>
                                            <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10}/> {item.coleta}</span>
                                            <span className="text-xs text-gray-700 flex items-center gap-1"><Truck size={10}/> {item.entrega}</span>
                                        </>
                                    ) : (
                                        viewMode === 'DESTINATION' ? (
                                            <div className="flex items-center gap-1">
                                                <span className="md:hidden text-xs text-gray-400">Origem:</span>
                                                {item.coleta}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1">
                                                <span className="md:hidden text-xs text-gray-400">Destino:</span>
                                                {item.entrega}
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </td>

                    {/* Date Limit */}
                    <td className="md:p-3 md:align-middle block md:table-cell text-sm text-gray-600 mb-1 md:mb-0">
                        <div className="flex items-center gap-2 md:block">
                            <span className="md:hidden text-xs text-gray-400 font-bold w-16">Limite:</span>
                            <div className="flex items-center gap-1">
                                <Calendar size={12} className="md:hidden text-gray-400" />
                                {item.dataLimiteBaixa}
                            </div>
                        </div>
                    </td>

                    {/* Destinatário */}
                    <td className="md:p-3 md:align-middle block md:table-cell text-sm text-gray-600 mb-2 md:mb-0">
                        <div className="flex items-start gap-2 md:block">
                            <span className="md:hidden text-xs text-gray-400 font-bold w-16 shrink-0">Cliente:</span>
                            <span className="font-medium text-gray-800 line-clamp-1" title={item.destinatario}>{item.destinatario}</span>
                        </div>
                    </td>

                    {/* Notes (Mobile: Absolute positioned or flex end) */}
                    <td className="md:p-3 md:align-middle block md:table-cell text-center relative md:static">
                         <div className="flex justify-end md:justify-center border-t border-gray-100 pt-3 mt-1 md:border-0 md:pt-0 md:mt-0">
                            {/* Larger Button for Mobile Notes */}
                            <button 
                                className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg transition-colors w-full md:w-auto justify-center ${item.noteCount > 0 ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'text-gray-500 bg-gray-100 hover:bg-gray-200'}`}
                                onClick={(e) => { e.stopPropagation(); onSelect(item); }}
                            >
                                <MessageSquare size={18} fill={item.noteCount > 0 ? "currentColor" : "none"} />
                                <span>{item.noteCount > 0 ? `${item.noteCount} notas` : 'Adicionar Nota'}</span>
                            </button>
                         </div>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
            
            {filteredData.length === 0 && (
                <div className="p-16 text-center text-gray-400 flex flex-col items-center justify-center">
                    <AlertCircle size={48} className="opacity-20 mb-4" />
                    <h3 className="text-lg font-medium text-gray-600">Nenhuma pendência encontrada</h3>
                    <p className="text-sm">Verifique se está na aba correta (Entregas vs Emissões) ou ajuste os filtros.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default IssueList;

import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import IssueList from './components/IssueList';
import IssueDetail from './components/IssueDetail';
import { SettingsPanel } from './components/SettingsPanel';
import NotificationCenter from './components/NotificationCenter';
import { Sidebar } from './components/Sidebar';
import PasswordModal from './components/PasswordModal';
import { fetchPendencias, fetchNotes, fetchOpenProcesses } from './services/api';
import { Pendencia, UserRole, Note } from './types';
import { Menu, Loader2, RefreshCw } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [view, setView] = useState<'dashboard' | 'list' | 'critical' | 'open_process' | 'settings'>('dashboard');
  const [pendencias, setPendencias] = useState<Pendencia[]>([]);
  const [notes, setNotes] = useState<Note[]>([]); 
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Pendencia | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const [listFilterOverride, setListFilterOverride] = useState<string | null>(null);

  // Função centralizada para carregar dados
  const refreshData = useCallback(async (isManual = false) => {
      if (!user) return;
      
      if (isManual) setIsRefreshing(true);
      
      try {
          // Não ativamos setLoading aqui para não piscar a tela inteira em atualizações de fundo
          const [pData, nData, openCtes] = await Promise.all([
              fetchPendencias(), 
              fetchNotes(),
              fetchOpenProcesses()
          ]);
          
          const safePData = Array.isArray(pData) ? pData : [];
          const safeNData = Array.isArray(nData) ? nData : [];
          const safeOpen = Array.isArray(openCtes) ? openCtes : [];

          const enhanced = safePData.map(p => ({
              ...p,
              noteCount: safeNData.filter(n => String(n.cte).trim() === String(p.cte).trim()).length,
              hasOpenProcess: safeOpen.includes(String(p.cte).trim())
          }));
          
          setPendencias(enhanced);
          setNotes(safeNData);
          setLastUpdated(new Date());
      } catch (error) {
          console.error("Erro crítico ao carregar dados:", error);
      } finally {
          if (isManual) setIsRefreshing(false);
      }
  }, [user]);

  // Carga inicial e Intervalo
  useEffect(() => {
    if (user) {
      if (user.role === UserRole.UNIDADE) {
          setView('list');
      }
      setLoading(true);
      refreshData().finally(() => setLoading(false));
      
      // Atualiza a cada 30 segundos
      const interval = setInterval(() => refreshData(false), 30000);
      return () => clearInterval(interval);
    }
  }, [user, refreshData]);

  if (!user) return <Login />;

  const handleDashboardClick = (filter: string) => {
      setListFilterOverride(filter);
      setView('list');
  };

  const handleNotificationClick = (cte: string) => {
      const issue = pendencias.find(p => String(p.cte).trim() === String(cte).trim());
      if (issue) setSelectedIssue(issue);
  };

  const safeUsername = user.username || 'Usuário';
  const userInitial = (safeUsername.charAt(0) || 'U').toUpperCase();

  // Calcula quantos processos estão em aberto para o Badge do Menu
  const openProcessCount = pendencias.filter(p => p.hasOpenProcess).length;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {sidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
            onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar 
        user={user} 
        activeView={view} 
        setView={setView} 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onOpenPassword={() => setShowPasswordModal(true)}
        openProcessCount={openProcessCount}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative md:ml-64 transition-all duration-300">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 z-40 shrink-0 relative shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Menu size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-800 hidden md:block">
                {view === 'dashboard' ? 'Visão Geral' : 
                 view === 'list' ? 'Lista de Pendências' : 
                 view === 'critical' ? 'Pendências Críticas' : 
                 view === 'open_process' ? 'Mercadorias em Buscas' : 'Configurações'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
             {/* Refresh Button & Timestamp */}
             <div className="flex flex-col items-end mr-2">
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 hidden md:block">
                        {lastUpdated ? `Atualizado às ${lastUpdated.toLocaleTimeString()}` : 'Carregando...'}
                    </span>
                    <button 
                        onClick={() => refreshData(true)} 
                        disabled={isRefreshing}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-full transition-all disabled:opacity-50"
                        title="Atualizar Dados Agora"
                    >
                        <RefreshCw size={18} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
                    </button>
                 </div>
             </div>

             <NotificationCenter 
                user={user} 
                pendencias={pendencias || []} 
                notes={notes || []} 
                onNotificationClick={handleNotificationClick}
             />
             <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="text-right hidden md:block">
                    <p className="text-sm font-bold text-gray-900">{safeUsername}</p>
                    <p className="text-xs text-gray-500 font-medium">{user.role}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg border border-blue-200">
                    {userInitial}
                </div>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative z-0">
            {loading && pendencias.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-50">
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                </div>
            )}

            {view === 'dashboard' && (
                user.role !== UserRole.UNIDADE ? (
                    <Dashboard data={pendencias} onStatusClick={handleDashboardClick} />
                ) : (
                    <div className="text-center p-10 flex flex-col items-center">
                        <h2 className="text-2xl font-bold text-gray-400">Acesso Restrito ao Painel Gerencial</h2>
                        <p className="text-gray-500 mb-4">Seu perfil visualiza apenas listas operacionais.</p>
                        <button onClick={() => setView('list')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Ir para Lista</button>
                    </div>
                )
            )}
            
            {view === 'list' && (
                <IssueList 
                    data={pendencias} 
                    user={user} 
                    notes={notes} 
                    onSelect={setSelectedIssue} 
                    initialFilter={listFilterOverride} 
                />
            )}

            {view === 'critical' && (
                <IssueList 
                    data={pendencias} 
                    user={user} 
                    notes={notes}
                    onSelect={setSelectedIssue} 
                    initialFilter="OVERDUE" 
                />
            )}

            {view === 'open_process' && (
                <IssueList 
                    data={pendencias.filter(p => p.hasOpenProcess)} 
                    user={user} 
                    notes={notes}
                    onSelect={setSelectedIssue} 
                    forceShowAllUnits={true} 
                />
            )}

            {view === 'settings' && <SettingsPanel />}
        </main>
      </div>

      {selectedIssue && (
          <IssueDetail 
            issue={selectedIssue} 
            user={user} 
            onUpdate={() => refreshData(false)} // PASSA A FUNÇÃO DE ATUALIZAÇÃO
            onClose={() => setSelectedIssue(null)} 
          />
      )}

      {showPasswordModal && (
          <PasswordModal 
            user={user} 
            onClose={() => setShowPasswordModal(false)} 
          />
      )}
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;

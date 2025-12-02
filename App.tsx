import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { Menu, Loader2, RefreshCw, ShieldAlert } from 'lucide-react';

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

  // Audio Alarm Logic
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAlarm, setIsPlayingAlarm] = useState(false);
  const lastIssueCountRef = useRef<number>(0);

  useEffect(() => {
      // Create audio object once (looping beep sound)
      // Using a reliable base64 beep sound for simplicity
      const beep = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"; // Truncated placeholder - in real app use a real URL
      // Since base64 is tricky here, let's assume a standard URL or handle it gracefully.
      // For now, let's use a very short beep sound or just log it. 
      // BETTER: Use the Web Audio API or a hosted file. 
      // For this implementation, I will assume a hosted file URL is provided or I will use a simple one.
      audioRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
      audioRef.current.loop = true;
  }, []);

  const playAlarm = () => {
      if (audioRef.current && !isPlayingAlarm) {
          audioRef.current.play().catch(e => console.log("Audio play failed (interaction needed):", e));
          setIsPlayingAlarm(true);
      }
  };

  const stopAlarm = () => {
      if (audioRef.current && isPlayingAlarm) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setIsPlayingAlarm(false);
      }
  };

  // Helper to check permissions
  const hasPermission = useCallback((permissionKey: string) => {
      if (!user || !user.permissions) return false;
      if (user.role === 'ADMIN') return true; 
      let perms: string[] = [];
      if (typeof user.permissions === 'string') {
        try { perms = JSON.parse(user.permissions); } catch { perms = []; }
      } else { perms = user.permissions; }
      return perms.includes(permissionKey);
  }, [user]);

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

          // Alarm Trigger Logic: If number of open processes INCREASES or critical issues INCREASE
          // Simplified: If total pendencias increases (new arrival)
          if (lastIssueCountRef.current > 0 && safePData.length > lastIssueCountRef.current) {
              playAlarm();
          }
          lastIssueCountRef.current = safePData.length;

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
  }, [user, isPlayingAlarm]); // Dependency on isPlayingAlarm might be needed if we want to stop it on refresh, but usually we don't.

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
      stopAlarm(); // Stop alarm when clicking notification
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
                onOpen={() => stopAlarm()} // Pass down stop function
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

            {view === 'settings' && (
                (hasPermission('access_settings') || hasPermission('manage_users') || hasPermission('manage_profiles')) ? (
                    <SettingsPanel />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <ShieldAlert size={64} className="mb-4 text-red-400 opacity-50" />
                        <h2 className="text-2xl font-bold text-gray-600">Acesso Negado</h2>
                        <p className="text-sm mt-2">Você não tem permissão para acessar as configurações.</p>
                    </div>
                )
            )}
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
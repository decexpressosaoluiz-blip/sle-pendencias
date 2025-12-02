import React from 'react';
import { LayoutDashboard, AlertCircle, Search, Settings, Shield, LogOut, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import ConnectionStatus from './ConnectionStatus';

type ViewOption = 'dashboard' | 'list' | 'critical' | 'open_process' | 'settings';

interface SidebarProps {
  user: User;
  activeView: string;
  setView: (view: ViewOption) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenPassword: () => void;
  openProcessCount: number;
}

export function Sidebar({ user, activeView, setView, isOpen, onClose, onOpenPassword, openProcessCount }: SidebarProps) {
  const { logout } = useAuth();

  const hasPermission = (permissionKey: string) => {
    if (!user || !user.permissions) return false;
    if (user.role === 'ADMIN') return true; 
    let perms: string[] = [];
    if (typeof user.permissions === 'string') {
      try { perms = JSON.parse(user.permissions); } catch { perms = []; }
    } else { perms = user.permissions; }
    return perms.includes(permissionKey);
  };

  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Visão Geral', 
      icon: LayoutDashboard,
      show: hasPermission('view_dashboard'),
      colorClass: 'text-blue-500' 
    },
    { 
      id: 'list', 
      label: 'Pendências', 
      icon: AlertCircle,
      show: hasPermission('view_all_pendencias') || hasPermission('view_unit_dest'),
      colorClass: 'text-blue-400'
    },
    { 
      id: 'critical', 
      label: 'Críticos', 
      icon: Shield,
      show: hasPermission('view_critical'),
      colorClass: 'text-red-400'
    },
    { 
      id: 'open_process', 
      label: 'Em Buscas', 
      icon: Search,
      show: hasPermission('search_cte'),
      badge: openProcessCount > 0 ? openProcessCount : undefined,
      colorClass: 'text-amber-400'
    },
    { 
      id: 'settings', 
      label: 'Configurações', 
      icon: Settings,
      show: hasPermission('access_settings') || hasPermission('manage_users'),
      colorClass: 'text-slate-400'
    }
  ];

  return (
    <div className={`w-64 bg-slate-900 text-white h-screen flex flex-col fixed left-0 top-0 border-r border-slate-800 transition-transform duration-300 z-[60] ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg">
          <Shield size={24} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight">São Luiz</h1>
          <p className="text-xs text-slate-400">Sistema de Controle</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          item.show && (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id as ViewOption);
                if (window.innerWidth < 768) onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative ${
                activeView === item.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} className={activeView === item.id ? 'text-white' : `${item.colorClass} group-hover:text-white opacity-80`} />
              <span className="font-medium">{item.label}</span>
              {item.badge !== undefined && (
                <span className="absolute right-3 bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          )
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-2">
        <div className="bg-slate-800/50 rounded-lg p-4 mb-2">
          <p className="text-xs text-slate-400 mb-1">Logado como</p>
          <p className="font-medium text-sm truncate">{user?.username || 'Usuário'}</p>
          <p className="text-xs text-blue-400 mt-1 uppercase tracking-wider">{user?.role || 'Visitante'}</p>
        </div>
        
        <ConnectionStatus />

        <button
          onClick={() => {
            onOpenPassword();
            if (window.innerWidth < 768) onClose();
          }}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors text-sm"
        >
          <Key size={16} />
          <span>Alterar Senha</span>
        </button>
        
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut size={18} />
          <span>Sair do Sistema</span>
        </button>
      </div>
    </div>
  );
}
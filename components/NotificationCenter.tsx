import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, MessageCircle, AlertTriangle, Info, PackageOpen } from 'lucide-react';
import { Notification, User, Pendencia, Note, UserRole } from '../types';

interface NotificationCenterProps {
  user: User;
  pendencias: Pendencia[];
  notes: Note[];
  onNotificationClick: (cte: string) => void;
  onOpen?: () => void; // New prop to handle opening actions like stopping sound
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ user, pendencias, notes, onNotificationClick, onOpen }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
          if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const toggleOpen = () => {
      if (!isOpen && onOpen) onOpen(); // Trigger callback when opening
      setIsOpen(!isOpen);
  }

  useEffect(() => {
    if (!user || !Array.isArray(pendencias) || !Array.isArray(notes)) return;

    const generated: Notification[] = [];
    const now = new Date();
    
    pendencias.forEach(p => {
        // Critical Alerts
        const isTarget = user.role === UserRole.ADMIN || user.role === UserRole.LEITOR || p.entrega === user.linkedDestUnit || p.coleta === user.linkedOriginUnit;
        if (p.calculatedStatus === 'OVERDUE' && isTarget) {
            generated.push({
                id: `alert-${p.cte}`,
                type: 'ALERT',
                title: 'Crítico',
                message: `CTE ${p.cte} vencido!`,
                timestamp: now,
                read: false,
                relatedCte: p.cte
            });
        }

        // Process Open Alerts (Diário)
        if (p.hasOpenProcess) {
             generated.push({
                id: `proc-${p.cte}`,
                type: 'PROCESS',
                title: 'Processo em Aberto',
                message: `CTE ${p.cte} com processo marcado!`,
                timestamp: now,
                read: false,
                relatedCte: p.cte
            });
        }
    });

    notes.forEach(note => {
        if (note.autor === user.username) return;
        const issue = pendencias.find(p => String(p.cte) === String(note.cte));
        if (!issue) return;

        let shouldNotify = false;
        if (user.role === UserRole.ADMIN) shouldNotify = true;
        else if (user.role === UserRole.UNIDADE && (issue.coleta === user.linkedOriginUnit || issue.entrega === user.linkedDestUnit)) shouldNotify = true;

        if (shouldNotify) {
            generated.push({
                id: `note-${note.cte}-${note.id}`,
                type: 'NEW_NOTE',
                title: 'Nova Nota',
                message: `${note.autor} comentou no CTE ${note.cte}`,
                timestamp: new Date(note.data),
                read: false,
                relatedCte: note.cte
            });
        }
    });

    const readIds = JSON.parse(localStorage.getItem('sle_read_notifs') || '[]');
    const unread = generated.filter(n => !readIds.includes(n.id)).reverse();
    setNotifications(unread);

  }, [pendencias, notes, user]);

  const handleItemClick = (n: Notification) => {
      if (n.relatedCte) onNotificationClick(n.relatedCte);
      setIsOpen(false);
  };

  const markAllRead = () => {
      const ids = notifications.map(n => n.id);
      const readIds = JSON.parse(localStorage.getItem('sle_read_notifs') || '[]');
      localStorage.setItem('sle_read_notifs', JSON.stringify([...readIds, ...ids]));
      setNotifications([]);
  };

  const hasUnread = notifications.length > 0;

  return (
    <div className="relative" ref={wrapperRef}>
        <button 
            onClick={toggleOpen}
            className={`p-2 rounded-full transition-all duration-300 relative ${
                isOpen ? 'bg-blue-100 text-blue-600' : 
                hasUnread ? 'text-amber-500 hover:bg-amber-50' : 
                'text-gray-500 hover:bg-gray-100'
            }`}
        >
            {/* SINO AMARELO E PISCANTE */}
            <Bell size={24} className={hasUnread && !isOpen ? 'animate-pulse' : ''} fill={hasUnread ? "currentColor" : "none"} />
            
            {hasUnread && (
                // BADGE AUMENTADO E AJUSTADO
                <span className="absolute -top-1 -right-2 min-w-[20px] h-[20px] px-1 bg-red-600 text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm z-10">
                    {notifications.length > 99 ? '99+' : notifications.length}
                </span>
            )}
        </button>

        {isOpen && (
            // Largura aumentada para mobile e desktop
            <div className="absolute right-0 mt-4 w-[92vw] max-w-sm sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-[100] overflow-hidden animate-fadeIn origin-top-right">
                <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                    <span className="font-bold text-gray-800 text-base">Notificações</span>
                    {notifications.length > 0 && (
                        <button onClick={markAllRead} className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1">
                            <Check size={14} /> Marcar todas como lidas
                        </button>
                    )}
                </div>
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 flex flex-col items-center">
                            <Info className="opacity-50 mb-3" size={24} />
                            <p className="text-sm">Tudo limpo! Nenhuma notificação nova.</p>
                        </div>
                    ) : (
                        notifications.map(n => (
                            <div key={n.id} onClick={() => handleItemClick(n)} className="p-4 border-b border-gray-50 hover:bg-blue-50/80 cursor-pointer transition-colors flex gap-4 group">
                                <div className={`mt-1 p-2 rounded-full h-fit shrink-0 ${n.type === 'ALERT' ? 'bg-red-100 text-red-600' : n.type === 'PROCESS' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {n.type === 'ALERT' ? <AlertTriangle size={18} /> : n.type === 'PROCESS' ? <PackageOpen size={18} /> : <MessageCircle size={18} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm font-bold text-gray-900 group-hover:text-blue-700 truncate pr-2">{n.title}</p>
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap">{n.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1 leading-relaxed line-clamp-2">{n.message}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default NotificationCenter;
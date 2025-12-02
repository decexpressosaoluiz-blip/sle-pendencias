import React, { useState, useEffect } from 'react';
import { checkConnection } from '../services/api';

const ConnectionStatus: React.FC = () => {
    const [isOnline, setIsOnline] = useState<boolean | null>(null);

    useEffect(() => {
        const check = async () => {
            const online = await checkConnection();
            setIsOnline(online);
        };
        
        check(); // Initial check
        const interval = setInterval(check, 30000); // Poll every 30s
        
        return () => clearInterval(interval);
    }, []);

    if (isOnline === null) return null; // Initial loading state

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800/50 mt-2" title={isOnline ? "Conectado à API Google Sheets" : "Sem conexão com a API"}>
            <div className="relative flex h-3 w-3">
              {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
            </div>
            <span className={`text-xs font-medium ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
                {isOnline ? 'Online' : 'Offline'}
            </span>
        </div>
    );
};

export default ConnectionStatus;
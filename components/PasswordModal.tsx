import React, { useState } from 'react';
import { User } from '../types';
import { X, Lock, Loader2, Save } from 'lucide-react';
import { changePassword } from '../services/api';

interface PasswordModalProps {
  username?: string; // Alterado para receber apenas o username se necessário ou o objeto user
  user?: User; 
  onClose: () => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ username, user, onClose }) => {
  const targetUser = username || user?.username || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("As senhas não coincidem!");
      return;
    }
    if (newPassword.length < 3) {
      alert("A senha deve ter pelo menos 3 caracteres.");
      return;
    }

    setLoading(true);
    const success = await changePassword(targetUser, newPassword);
    setLoading(false);

    if (success) {
      alert(`Senha alterada com sucesso!`);
      onClose();
    } else {
      alert("Erro ao alterar senha. Verifique a conexão.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slideUp">
        
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-2 text-gray-800">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Lock size={20}/></div>
            <h3 className="font-bold text-lg">Alterar Senha</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Usuário</label>
            <input 
              type="text" 
              value={targetUser} 
              disabled 
              className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Nova Senha</label>
            <input 
              type="password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Digite a nova senha"
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Confirmar Senha</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme a nova senha"
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              required
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading || !newPassword}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} /> Confirmar Alteração</>}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default PasswordModal;
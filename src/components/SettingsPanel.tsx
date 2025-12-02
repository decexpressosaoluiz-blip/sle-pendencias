import React, { useState, useEffect, useMemo } from 'react';
import { Save, CheckCircle2, Loader2, Plus, Trash2, Shield, Users, ArrowLeft, User as UserIcon } from 'lucide-react';
import { Profile, User, UserRole } from '../types';
import { PERMISSIONS_LIST } from '../constants';
import { fetchProfiles, saveProfile, deleteProfile, fetchUsers, saveUser, deleteUser, fetchPendencias } from '../services/api';

export function SettingsPanel() {
  const [activeTab, setActiveTab] = useState<'profiles' | 'users'>('profiles');
  
  // Profile State
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  
  // User State
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);

  // Unit Options State (Extracted from BASE sheet)
  const [originOptions, setOriginOptions] = useState<string[]>([]);
  const [destOptions, setDestOptions] = useState<string[]>([]);

  // Shared State
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Load both on mount or tab switch to ensure dropdowns are populated
    loadData();
  }, []);

  const loadData = async () => {
      setIsLoading(true);
      try {
          const [pData, uData, pendenciaData] = await Promise.all([
              fetchProfiles(), 
              fetchUsers(),
              fetchPendencias()
          ]);
          setProfiles(pData);
          setUsers(uData);

          // Extract Unique Units from BASE sheet (Columns H and I)
          const uniqueOrigins = Array.from(new Set(pendenciaData.map(p => p.coleta).filter(Boolean))).sort();
          const uniqueDests = Array.from(new Set(pendenciaData.map(p => p.entrega).filter(Boolean))).sort();
          
          setOriginOptions(uniqueOrigins);
          setDestOptions(uniqueDests);

      } catch (e) {
          console.error(e);
      } finally {
          setIsLoading(false);
      }
  }

  const loadProfiles = async () => {
    setIsLoading(true);
    try {
      const data = await fetchProfiles();
      setProfiles(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
        const data = await fetchUsers();
        setUsers(data);
    } catch(error) {
        console.error(error);
    } finally {
        setIsLoading(false);
    }
  }

  const showFeedback = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // --- Profile Handlers ---
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;

    try {
      setIsLoading(true);
      await saveProfile(editingProfile); 
      showFeedback('Perfil salvo com sucesso!');
      setEditingProfile(null);
      await loadProfiles();
    } catch (error) {
      alert('Erro ao salvar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProfile = async (name: string) => {
      if(!window.confirm('Tem certeza?')) return;
      setIsLoading(true);
      await deleteProfile(name);
      await loadProfiles();
      setIsLoading(false);
  }

  const handlePermissionToggle = (key: string) => {
      if(!editingProfile) return;
      const current = editingProfile.permissions || [];
      const updated = current.includes(key) 
        ? current.filter(k => k !== key)
        : [...current, key];
      setEditingProfile({...editingProfile, permissions: updated});
  }

  // --- User Handlers ---
  const handleSaveUser = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingUser || !editingUser.username) return;

      try {
          setIsLoading(true);
          await saveUser(editingUser);
          showFeedback('Usuário salvo com sucesso!');
          setEditingUser(null);
          await loadUsers();
      } catch (error) {
          alert('Erro ao salvar usuário');
      } finally {
          setIsLoading(false);
      }
  }

  const handleDeleteUser = async (username: string) => {
      if(!window.confirm(`Excluir usuário ${username}?`)) return;
      setIsLoading(true);
      await deleteUser(username);
      await loadUsers();
      setIsLoading(false);
  }

  // Generate Unique Roles List for Dropdown
  const uniqueRoles = useMemo(() => {
      const defaultRoles = [UserRole.ADMIN, UserRole.UNIDADE, UserRole.LEITOR];
      const profileNames = profiles.map(p => p.name.toUpperCase());
      
      // Combine and remove duplicates (case insensitive check)
      const allRoles = [...defaultRoles, ...profileNames];
      return Array.from(new Set(allRoles));
  }, [profiles]);

  return (
    <div className="p-4 md:p-8 relative max-w-6xl mx-auto">
      {showSuccess && (
        <div className="fixed top-5 left-0 right-0 mx-auto z-[100] flex justify-center px-4 animate-slideDown">
          <div className="bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 border border-emerald-500 max-w-sm w-full">
            <div className="bg-white/20 p-2 rounded-full shrink-0"><CheckCircle2 size={24} /></div>
            <div>
              <h4 className="font-bold text-base uppercase tracking-wide">Sucesso</h4>
              <p className="text-sm opacity-95 font-medium">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Shield className="text-blue-600"/> Configurações
          </h2>
          
          <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm w-full md:w-auto">
              <button 
                onClick={() => { setActiveTab('profiles'); setEditingProfile(null); setEditingUser(null); }}
                className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'profiles' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                  <Shield size={16} /> Perfis
              </button>
              <div className="w-px bg-gray-200 my-1 mx-1"></div>
              <button 
                onClick={() => { setActiveTab('users'); setEditingProfile(null); setEditingUser(null); }}
                className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'users' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                  <Users size={16} /> Usuários
              </button>
          </div>
      </div>

      {isLoading && <div className="text-center py-4"><Loader2 className="animate-spin inline text-blue-600 mr-2" /> Carregando...</div>}

      {/* --- PROFILES TAB --- */}
      {activeTab === 'profiles' && (
          <div className="animate-fadeIn">
              {!editingProfile ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                          <h3 className="font-bold text-gray-700">Perfis de Acesso</h3>
                          <button 
                            onClick={() => setEditingProfile({ name: '', description: '', permissions: [] })}
                            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold"
                          >
                              <Plus size={16} /> Novo Perfil
                          </button>
                      </div>
                      <div className="divide-y divide-gray-100">
                          {profiles.map((profile, idx) => (
                              <div key={idx} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-blue-50/30 transition-colors gap-3">
                                  <div>
                                      <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                          {profile.name}
                                          <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">ID: {profile.id || 'N/A'}</span>
                                      </h4>
                                      <p className="text-sm text-gray-500 mt-1">{profile.description}</p>
                                      <div className="mt-2 flex flex-wrap gap-1">
                                          <span className="text-[10px] uppercase font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                              {profile.permissions?.length || 0} permissões
                                          </span>
                                      </div>
                                  </div>
                                  <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                                      <button onClick={() => setEditingProfile(profile)} className="flex-1 md:flex-none px-3 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded text-sm font-medium transition-colors">Editar</button>
                                      <button onClick={() => handleDeleteProfile(profile.name)} className="px-3 py-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors"><Trash2 size={16}/></button>
                                  </div>
                              </div>
                          ))}
                          {profiles.length === 0 && !isLoading && <div className="p-8 text-center text-gray-400">Nenhum perfil encontrado.</div>}
                      </div>
                  </div>
              ) : (
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-slideUp">
                      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                          <button onClick={() => setEditingProfile(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                              <ArrowLeft size={20} />
                          </button>
                          <h3 className="text-lg font-bold text-gray-800">{editingProfile.id ? 'Editar' : 'Novo'} Perfil</h3>
                      </div>
                      
                      <form onSubmit={handleSaveProfile} className="space-y-6">
                          <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Perfil</label>
                                  <input 
                                    type="text" 
                                    value={editingProfile.name}
                                    onChange={e => setEditingProfile({...editingProfile, name: e.target.value})}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900"
                                    required
                                    placeholder="EX: FINANCEIRO"
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">Descrição</label>
                                  <input 
                                    type="text" 
                                    value={editingProfile.description}
                                    onChange={e => setEditingProfile({...editingProfile, description: e.target.value})}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900"
                                    placeholder="Breve descrição da função"
                                  />
                              </div>
                          </div>
                          
                          <div>
                              <label className="block text-sm font-bold text-gray-700 mb-3">Permissões de Acesso</label>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200 max-h-[400px] overflow-y-auto custom-scrollbar">
                                  {PERMISSIONS_LIST.map(perm => (
                                      <label key={perm.key} className="flex items-start gap-3 cursor-pointer p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all shadow-sm">
                                          <input 
                                            type="checkbox" 
                                            checked={(editingProfile.permissions || []).includes(perm.key)}
                                            onChange={() => handlePermissionToggle(perm.key)}
                                            className="mt-1 rounded text-blue-600 focus:ring-blue-500"
                                          />
                                          <span className="text-sm text-gray-600 font-medium leading-tight">{perm.label}</span>
                                      </label>
                                  ))}
                              </div>
                          </div>

                          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                              <button type="button" onClick={() => setEditingProfile(null)} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 font-medium">Cancelar</button>
                              <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-bold shadow-lg shadow-blue-200">
                                  <Save size={18} /> Salvar Perfil
                              </button>
                          </div>
                      </form>
                  </div>
              )}
          </div>
      )}

      {/* --- USERS TAB --- */}
      {activeTab === 'users' && (
          <div className="animate-fadeIn">
              {!editingUser ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                          <h3 className="font-bold text-gray-700">Usuários do Sistema</h3>
                          <button 
                            onClick={() => setEditingUser({ username: '', role: UserRole.UNIDADE })}
                            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold"
                          >
                              <Plus size={16} /> Novo Usuário
                          </button>
                      </div>
                      <div className="divide-y divide-gray-100">
                          {users.map((user, idx) => (
                              <div key={idx} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-blue-50/30 transition-colors gap-3">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold uppercase">
                                          {user.username.charAt(0)}
                                      </div>
                                      <div>
                                          <h4 className="font-bold text-gray-800">{user.username}</h4>
                                          <div className="flex gap-2 mt-1">
                                              <span className="text-[10px] uppercase font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                                  {user.role}
                                              </span>
                                              {user.linkedOriginUnit && <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Origem: {user.linkedOriginUnit}</span>}
                                              {user.linkedDestUnit && <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Destino: {user.linkedDestUnit}</span>}
                                          </div>
                                      </div>
                                  </div>
                                  <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                                      <button onClick={() => setEditingUser(user)} className="flex-1 md:flex-none px-3 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded text-sm font-medium transition-colors">Editar</button>
                                      <button onClick={() => handleDeleteUser(user.username)} className="px-3 py-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors"><Trash2 size={16}/></button>
                                  </div>
                              </div>
                          ))}
                          {users.length === 0 && !isLoading && <div className="p-8 text-center text-gray-400">Nenhum usuário encontrado.</div>}
                      </div>
                  </div>
              ) : (
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-slideUp">
                      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                          <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                              <ArrowLeft size={20} />
                          </button>
                          <h3 className="text-lg font-bold text-gray-800">{editingUser.username ? 'Editar' : 'Novo'} Usuário</h3>
                      </div>

                      <form onSubmit={handleSaveUser} className="space-y-6">
                          <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">Nome de Usuário (Login)</label>
                                  <div className="relative">
                                      <UserIcon size={18} className="absolute left-3 top-2.5 text-gray-400"/>
                                      <input 
                                        type="text" 
                                        value={editingUser.username || ''}
                                        onChange={e => setEditingUser({...editingUser, username: e.target.value})}
                                        className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900"
                                        required
                                        disabled={!!users.find(u => u.username === editingUser.username && u !== editingUser)} 
                                        readOnly={users.some(u => u.username === editingUser.username && editingUser.password === undefined)} 
                                      />
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">Senha</label>
                                  <input 
                                    type="text" 
                                    value={editingUser.password || ''}
                                    onChange={e => setEditingUser({...editingUser, password: e.target.value})}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900"
                                    placeholder={editingUser.username ? "Deixe em branco para manter" : "Senha inicial"}
                                  />
                              </div>
                          </div>

                          <div className="grid md:grid-cols-3 gap-4">
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">Perfil (Role)</label>
                                  <select 
                                    value={editingUser.role} 
                                    onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900"
                                  >
                                      {uniqueRoles.map(role => (
                                          <option key={role} value={role}>{role}</option>
                                      ))}
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">Unidade Origem (Coleta)</label>
                                  <select
                                    value={editingUser.linkedOriginUnit || ''}
                                    onChange={e => setEditingUser({...editingUser, linkedOriginUnit: e.target.value})}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900"
                                  >
                                      <option value="">Selecione...</option>
                                      {originOptions.map(u => (
                                          <option key={u} value={u}>{u}</option>
                                      ))}
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">Unidade Destino (Entrega)</label>
                                  <select
                                    value={editingUser.linkedDestUnit || ''}
                                    onChange={e => setEditingUser({...editingUser, linkedDestUnit: e.target.value})}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900"
                                  >
                                      <option value="">Selecione...</option>
                                      {destOptions.map(u => (
                                          <option key={u} value={u}>{u}</option>
                                      ))}
                                  </select>
                              </div>
                          </div>

                          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                              <button type="button" onClick={() => setEditingUser(null)} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 font-medium">Cancelar</button>
                              <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-bold shadow-lg shadow-blue-200">
                                  <Save size={18} /> Salvar Usuário
                              </button>
                          </div>
                      </form>
                  </div>
              )}
          </div>
      )}
    </div>
  );
}
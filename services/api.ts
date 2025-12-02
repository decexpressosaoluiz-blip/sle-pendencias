import { APPS_SCRIPT_URL, CSV_URL_BASE, PERMISSIONS_LIST } from '../constants';
import { User, UserRole, Pendencia, Note, Profile } from '../types';

// ... (postData e parseCSV mantidos iguais, focando nas correções abaixo) ...
const postData = async (action: string, payload: any): Promise<boolean> => {
    try {
        await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action, ...payload })
        });
        return true; 
    } catch (e) {
        console.error(`Erro no POST ${action}:`, e);
        return false;
    }
};

const parseCSV = (text: string): string[][] => {
  const result: string[][] = [];
  let row: string[] = [];
  let current = '';
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuote && text[i + 1] === '"') { current += '"'; i++; } else { inQuote = !inQuote; }
    } else if (char === ',' && !inQuote) {
      row.push(current.trim()); current = '';
    } else if ((char === '\r' || char === '\n') && !inQuote) {
      if (current || row.length > 0) row.push(current.trim());
      if (row.length > 0) result.push(row);
      row = []; current = '';
      if (char === '\r' && text[i + 1] === '\n') i++;
    } else { current += char; }
  }
  if (current || row.length > 0) { row.push(current.trim()); result.push(row); }
  return result;
};

export const fetchPendencias = async (): Promise<Pendencia[]> => {
  try {
    const response = await fetch(`${CSV_URL_BASE}&t=${new Date().getTime()}`);
    if (!response.ok) throw new Error(`Erro HTTP CSV: ${response.status}`);
    const text = await response.text();
    const rows = parseCSV(text);
    const dataRows = rows.slice(1);
    
    return dataRows.map((r, index) => {
      const getVal = (idx: number) => r[idx] !== undefined ? r[idx] : '';
      const cte = getVal(0);
      if (!cte) return null; 
      const dataLimiteBaixa = getVal(5);
      
      const dateParts = dataLimiteBaixa.split('/');
      let dtLimite = new Date();
      if(dateParts.length === 3) { dtLimite = new Date(parseInt(dateParts[2]), parseInt(dateParts[1])-1, parseInt(dateParts[0])); }

      const today = new Date();
      today.setHours(0,0,0,0);
      dtLimite.setHours(0,0,0,0);
      const diffDays = Math.ceil((dtLimite.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      let calcStatus: Pendencia['calculatedStatus'] = 'ON_TIME';
      if (diffDays < 0) calcStatus = 'OVERDUE';
      else if (diffDays === 0) calcStatus = 'PRIORITY';
      else if (diffDays === 1) calcStatus = 'TOMORROW';

      return {
        id: `${cte}-${getVal(1)}-${index}`,
        cte: String(cte).trim(),
        serie: String(getVal(1)).trim(),
        codigo: getVal(2),
        dataEmissao: getVal(3),
        prazoParaBaixa: parseInt(getVal(4)) || 0,
        dataLimiteBaixa: dataLimiteBaixa,
        status: getVal(6),
        coleta: getVal(7).toUpperCase().trim(),
        entrega: getVal(8).toUpperCase().trim(),
        valorCte: parseFloat(getVal(9).replace('R$','').replace('.','').replace(',','.') || '0'),
        txEntrega: parseFloat(getVal(10).replace('R$','').replace('.','').replace(',','.') || '0'),
        volumes: parseInt(getVal(11)) || 0,
        peso: parseFloat(getVal(12).replace('.','').replace(',','.') || '0'),
        fretePago: getVal(13).toUpperCase(),
        destinatario: getVal(14),
        justificativa: getVal(15),
        calculatedStatus: calcStatus,
        noteCount: 0,
        hasOpenProcess: false 
      };
    }).filter(Boolean) as Pendencia[];
  } catch (error) { return []; }
};

export const fetchNotes = async (cte?: string): Promise<Note[]> => {
  try {
    let url = `${APPS_SCRIPT_URL}?action=getNotes&t=${new Date().getTime()}`;
    if (cte) url += `&cte=${cte}`;

    const response = await fetch(url);
    const json = await response.json();
    if (json.success && Array.isArray(json.data)) {
        return json.data.map((n: any) => ({ ...n, cte: String(n.cte).trim(), serie: String(n.serie).trim() }));
    }
    return [];
  } catch (e) { return []; }
};

export const fetchOpenProcesses = async (): Promise<string[]> => {
    try {
        const response = await fetch(`${APPS_SCRIPT_URL}?action=getProcessStatus&t=${new Date().getTime()}`);
        const json = await response.json();
        if (json.success && Array.isArray(json.data)) {
            return json.data.map((cte: any) => String(cte).trim());
        }
        return [];
    } catch (e) { return []; }
};

export const toggleProcessStatus = async (cte: string, status: boolean, user: string): Promise<boolean> => {
    return await postData('toggleProcess', { cte, status, user });
};

// ============================================================================
// 3. USUÁRIOS (NORMALIZADO)
// ============================================================================
export const fetchUsers = async (): Promise<User[]> => {
    try {
        const response = await fetch(`${APPS_SCRIPT_URL}?action=getUsers&t=${new Date().getTime()}`);
        const json = await response.json();
        
        if (json.success && Array.isArray(json.data)) {
            return json.data
                .map((u: any) => {
                    // Normaliza chaves para minúsculo para evitar problemas de Case Sensitive
                    const normalizedUser: any = {};
                    Object.keys(u).forEach(key => {
                        normalizedUser[key.toLowerCase()] = u[key];
                    });

                    let perms = [];
                    try {
                        const pRaw = normalizedUser.permissions;
                        if (pRaw && typeof pRaw === 'string' && pRaw.startsWith('[')) {
                            perms = JSON.parse(pRaw);
                        } else if (Array.isArray(pRaw)) {
                            perms = pRaw;
                        }
                    } catch (e) {}

                    return {
                        username: normalizedUser.username || '',
                        password: normalizedUser.password || '',
                        role: (normalizedUser.role as UserRole) || UserRole.UNIDADE,
                        linkedOriginUnit: normalizedUser.linkedoriginunit || normalizedUser.linkedOriginUnit || '',
                        linkedDestUnit: normalizedUser.linkeddestunit || normalizedUser.linkedDestUnit || '',
                        permissions: perms
                    };
                })
                // FILTRO IMPORTANTE: Remove a linha de cabeçalho se ela vier como dado
                .filter((u: User) => u.username.toLowerCase() !== 'username' && u.username.toLowerCase() !== 'user');
        }
        return [];
    } catch (e) { return []; }
}

export const authenticateUser = async (username: string, password: string): Promise<User> => {
    if (username.toLowerCase() === 'admin' && password === '02965740155') {
        return { 
            username: 'admin', 
            role: UserRole.ADMIN, 
            linkedOriginUnit: 'MATRIZ', 
            linkedDestUnit: 'TODAS', 
            permissions: PERMISSIONS_LIST.map(p => p.key) 
        };
    }

    try {
        // Fetch Users AND Profiles to ensure permissions are up to date with Profile definitions
        const [users, profiles] = await Promise.all([fetchUsers(), fetchProfiles()]);
        
        const found = users.find((u) => String(u.username).trim().toLowerCase() === username.toLowerCase());

        if (!found) throw new Error('USER_NOT_FOUND');
        if (String(found.password).trim() !== password) throw new Error('WRONG_PASSWORD');

        let perms: string[] = [];

        if (found.role === 'ADMIN') {
             perms = PERMISSIONS_LIST.map(p => p.key);
        } else {
             // Try to find a profile matching the user's role
             const userProfile = profiles.find(p => p.name.toLowerCase() === found.role.toString().toLowerCase());
             
             if (userProfile) {
                 // Use the profile's permissions if found (Dynamic)
                 perms = userProfile.permissions || [];
             } else {
                 // Fallback to permissions stored in user row (Static/Legacy)
                 perms = found.permissions || [];
             }
        }

        return { ...found, permissions: perms };

    } catch (e: any) {
        if (e.message === 'USER_NOT_FOUND' || e.message === 'WRONG_PASSWORD') throw e;
        throw new Error('CONNECTION_ERROR');
    }
};

export const saveUser = async (user: Partial<User> & { password?: string }): Promise<boolean> => {
    return await postData('saveUser', {
        username: user.username,
        password: user.password,
        role: user.role,
        linkedOriginUnit: user.linkedOriginUnit,
        linkedDestUnit: user.linkedDestUnit,
        permissions: JSON.stringify(user.permissions || [])
    });
};

export const deleteUser = async (username: string): Promise<boolean> => {
    return await postData('deleteUser', { username });
};

export const changePassword = async (username: string, newPass: string): Promise<boolean> => {
    try {
        const users = await fetchUsers();
        const currentUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (!currentUser) return false;

        return await postData('saveUser', {
            username: currentUser.username,
            password: newPass,
            role: currentUser.role,
            linkedOriginUnit: currentUser.linkedOriginUnit,
            linkedDestUnit: currentUser.linkedDestUnit,
            permissions: JSON.stringify(currentUser.permissions)
        });
    } catch(e) { return false; }
};

export const sendNote = async (note: Partial<Note>, fileBase64?: string): Promise<boolean> => {
    return await postData('addNote', {
        cte: String(note.cte).trim(),
        serie: String(note.serie).trim(),
        codigo: note.codigo,
        autor: note.autor,
        texto: note.texto,
        image: fileBase64 || '' 
    });
};

// ============================================================================
// 4. PERFIS (NORMALIZADO)
// ============================================================================
export const fetchProfiles = async (): Promise<Profile[]> => {
  try {
    const response = await fetch(`${APPS_SCRIPT_URL}?action=getProfiles&t=${new Date().getTime()}`);
    const json = await response.json();
    
    if (json.success && Array.isArray(json.data)) {
      return json.data
        .map((p: any) => {
          const normalized: any = {};
          Object.keys(p).forEach(k => normalized[k.toLowerCase()] = p[k]);
          
          return {
            id: normalized.id,
            name: normalized.name || normalized.profilename || 'Sem Nome',
            description: normalized.description || '',
            permissions: (normalized.permissions && normalized.permissions.startsWith('[')) ? JSON.parse(normalized.permissions) : []
          };
      })
      // FILTRO IMPORTANTE: Remove a linha de cabeçalho se ela vier como dado
      .filter((p: Profile) => p.name !== 'Name' && p.name !== 'name' && p.id !== 'ID');
    }
    return [];
  } catch (e) { return []; }
};

export const saveProfile = async (profile: Profile): Promise<boolean> => {
    return await postData('saveProfile', {
        id: profile.id, // Ensure ID is passed for updates
        name: profile.name,
        profileName: profile.name, // Redundant key for compatibility
        description: profile.description,
        permissions: JSON.stringify(profile.permissions || [])
    });
};

export const deleteProfile = async (name: string): Promise<boolean> => {
    return await postData('deleteProfile', { name });
};

export const testConnection = async () => {
  const results = { script: { success: false, message: '' }, csv: { success: false, message: '' } };
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=ping&t=${new Date().getTime()}`);
    if (res.ok) { const json = await res.json(); results.script = json.status === 'online' ? { success: true, message: 'Online' } : { success: false, message: 'Erro Lógico' }; } 
    else { results.script = { success: false, message: 'Erro HTTP' }; }
  } catch (e) { results.script = { success: false, message: 'Sem conexão' }; }
  try {
    const res = await fetch(`${CSV_URL_BASE}&t=${new Date().getTime()}`);
    if (res.ok) results.csv = { success: true, message: 'Leitura OK' }; else results.csv = { success: false, message: 'Erro HTTP' };
  } catch (e) { results.csv = { success: false, message: 'Sem conexão' }; }
  return results;
};

export const checkConnection = async (): Promise<boolean> => {
    try {
        const res = await fetch(`${APPS_SCRIPT_URL}?action=ping`);
        return res.ok;
    } catch { return false; }
};

// Export grouped object for compatibility with components using 'import { api } from ...'
export const api = {
    fetchPendencias,
    fetchNotes,
    fetchOpenProcesses,
    toggleProcessStatus,
    fetchUsers,
    authenticateUser,
    saveUser,
    deleteUser,
    changePassword,
    sendNote,
    fetchProfiles,
    getProfiles: fetchProfiles, // Alias
    saveProfile,
    deleteProfile,
    testConnection,
    checkConnection
};
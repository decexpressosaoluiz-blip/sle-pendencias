import React, { useState, useEffect } from 'react';
import { Pendencia, Note, User } from '../types';
import { X, Send, Paperclip, Loader2, Camera, MessageSquare, Box } from 'lucide-react';
import { fetchNotes, sendNote, toggleProcessStatus } from '../services/api';

interface IssueDetailProps {
  issue: Pendencia | null;
  user: User;
  onClose: () => void;
  onUpdate?: () => void;
}

const IssueDetail: React.FC<IssueDetailProps> = ({ issue, user, onClose, onUpdate }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [isProcessOpen, setIsProcessOpen] = useState(issue?.hasOpenProcess || false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (issue) {
      setLoading(true);
      setIsProcessOpen(issue.hasOpenProcess || false);
      
      fetchNotes(issue.cte).then(allNotes => {
        const filtered = allNotes.filter(n => 
            String(n.cte).trim() === String(issue.cte).trim() && 
            String(n.serie).trim() === String(issue.serie).trim()
        );
        setNotes(filtered);
        setLoading(false);
      });
    }
  }, [issue]);

  if (!issue) return null;

  const canManageProcess = user.role === 'ADMIN' || (user.permissions && user.permissions.includes('manage_open_process'));

  const handleToggleProcess = async () => {
      setToggling(true);
      const newState = !isProcessOpen;
      const success = await toggleProcessStatus(issue.cte, newState, user.username);
      if (success) {
          setIsProcessOpen(newState);
          if (onUpdate) onUpdate();
      } else {
          alert('Erro ao alterar status do processo.');
      }
      setToggling(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setImage(e.target.files[0]);
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSubmitting(true);
    let base64Img = undefined;
    if (image) base64Img = await convertToBase64(image);

    const notePayload: Partial<Note> = {
        cte: issue.cte,
        serie: issue.serie,
        codigo: issue.codigo,
        autor: user.username,
        texto: newNote,
        data: new Date().toISOString()
    };

    const success = await sendNote(notePayload, base64Img);

    if (success) {
        setNotes([...notes, { ...notePayload, linkImagem: base64Img ? '#' : '', id: Date.now().toString() } as Note]);
        setNewNote('');
        setImage(null);
        if (onUpdate) onUpdate();
    } else {
        alert("Erro ao enviar.");
    }
    setSubmitting(false);
  };

  // Helper function to translate status codes to Portuguese
  const translateStatus = (status: string) => {
      switch(status) {
          case 'OVERDUE': return 'CRÍTICO';
          case 'PRIORITY': return 'PRIORIDADE (HOJE)';
          case 'TOMORROW': return 'VENCE AMANHÃ';
          case 'ON_TIME': return 'NO PRAZO';
          default: return status;
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full md:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-slideUp">
        
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 whitespace-nowrap">CTE {issue.cte}</h2>
                {isProcessOpen && <span className="bg-amber-400 text-amber-900 text-[10px] px-2 py-0.5 rounded-full font-bold">EM BUSCA</span>}
            </div>
            <p className="text-xs md:text-sm text-gray-500 truncate max-w-[200px] md:max-w-none">{issue.destinatario}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 shrink-0">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
          
          {canManageProcess && (
              <div className="p-3 md:p-4 bg-gray-100 rounded-xl flex items-center justify-between border border-gray-200">
                  <div className="flex items-center gap-3">
                      <Box size={20} className={isProcessOpen ? 'text-amber-500' : 'text-gray-400'} />
                      <div>
                          <h4 className="font-bold text-gray-800 text-xs md:text-sm">Processo em Aberto</h4>
                          <p className="hidden md:block text-xs text-gray-500">Marque para destacar.</p>
                      </div>
                  </div>
                  <button 
                    onClick={handleToggleProcess}
                    disabled={toggling}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${isProcessOpen ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                  >
                      {toggling ? '...' : isProcessOpen ? 'Desmarcar' : 'Marcar'}
                  </button>
              </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex justify-between items-center md:block">
                <p className="text-blue-500 text-xs font-bold uppercase mb-0 md:mb-1">Status</p>
                <p className="font-semibold text-gray-900">{translateStatus(issue.calculatedStatus)}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex justify-between items-center md:block">
                <p className="text-blue-500 text-xs font-bold uppercase mb-0 md:mb-1">Data Limite</p>
                <p className={`font-semibold ${issue.calculatedStatus === 'OVERDUE' ? 'text-red-600' : 'text-gray-900'}`}>{issue.dataLimiteBaixa}</p>
            </div>
            <div className="md:col-span-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-gray-400 text-xs font-bold uppercase mb-1">Observação Original</p>
                <p className="text-gray-700 italic text-xs md:text-sm">{issue.justificativa || "Nenhuma observação registrada."}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-100 text-sm md:text-base">
                <MessageSquare size={18} className="text-blue-500" /> Histórico
            </h3>
            
            {loading ? (
                <div className="flex justify-center py-4"><Loader2 className="animate-spin text-blue-500" /></div>
            ) : notes.length === 0 ? (
                <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-xl border border-dashed text-xs md:text-sm">
                    <p>Nenhuma interação registrada.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notes.map((note, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 md:p-4 rounded-xl border border-gray-100">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-gray-900 text-xs md:text-sm">{note.autor}</span>
                                <span className="text-[10px] text-gray-400">{new Date(note.data).toLocaleString()}</span>
                            </div>
                            <p className="text-gray-700 text-xs md:text-sm leading-relaxed">{note.texto}</p>
                            {note.linkImagem && (
                                <a href={note.linkImagem} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors">
                                    <Paperclip size={14} /> Ver Anexo
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-3 md:p-4 bg-white border-t border-gray-100 shrink-0">
            {image && (
                <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-2 rounded-lg mb-2">
                    <Paperclip size={14} /> <span className="truncate max-w-[200px]">{image.name}</span>
                    <button type="button" onClick={() => setImage(null)} className="ml-auto hover:text-red-500"><X size={14}/></button>
                </div>
            )}
            <div className="flex gap-2">
                <label className="p-3 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-100 cursor-pointer transition-colors shrink-0">
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    <Camera size={20} />
                </label>
                <input 
                    type="text" 
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Nova nota..." 
                    className="flex-1 p-3 bg-blue-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder-blue-300 text-blue-900 text-sm"
                />
                <button 
                    type="submit" 
                    disabled={submitting || !newNote}
                    className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-200 shrink-0"
                >
                    {submitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
            </div>
        </form>

      </div>
    </div>
  );
};

export default IssueDetail;
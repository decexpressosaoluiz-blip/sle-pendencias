export enum UserRole {
  ADMIN = 'ADMIN',
  UNIDADE = 'UNIDADE',
  LEITOR = 'LEITOR',
  CUSTOM = 'CUSTOM',
}

export interface User {
  username: string;
  role: UserRole;
  linkedOriginUnit?: string;
  linkedDestUnit?: string;
  permissions?: string[]; // Array of permission keys
  password?: string;
}

export interface Pendencia {
  id: string; 
  cte: string;
  serie: string;
  codigo: string;
  dataEmissao: string;
  prazoParaBaixa: number;
  dataLimiteBaixa: string;
  status: string; // "PENDENTE", "BAIXADO", etc.
  coleta: string; // Origin Unit
  entrega: string; // Dest Unit
  valorCte: number;
  txEntrega: number;
  volumes: number;
  peso: number;
  fretePago: string; 
  destinatario: string;
  justificativa: string;
  // Computed fields
  calculatedStatus: 'OVERDUE' | 'PRIORITY' | 'TOMORROW' | 'ON_TIME';
  noteCount: number;
  hasOpenProcess?: boolean; // Novo campo
}

export interface Note {
  id: string;
  cte: string;
  serie: string;
  codigo: string;
  data: string;
  autor: string;
  texto: string;
  linkImagem?: string;
}

export interface Profile {
  id?: string; 
  name: string;
  profileName?: string; 
  permissions: string[]; 
  description: string;
}

export interface DashboardStats {
  total: number;
  overdue: number;
  priority: number;
  onTime: number;
  byUnit: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface AppConfig {
  showDashboard: boolean;
  allowImageUpload: boolean;
  allowNotes: boolean;
  criticalDays: number; 
  enableNotifications: boolean;
  autoRefresh: boolean;
  showPaymentTags: boolean;
  compressImages: boolean;
  darkMode: boolean;
  exportXls: boolean;
  apiDebug: boolean;
  featureToggle8: boolean;
  featureToggle9: boolean;
  featureToggle10: boolean;
}

export interface Notification {
  id: string;
  type: 'NEW_ISSUE' | 'NEW_NOTE' | 'ALERT' | 'PROCESS';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  relatedCte?: string;
}
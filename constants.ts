// src/constants.ts

// URL do Google Apps Script
export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzv-z2U4IAX6NfXkIjZw6EHlGBXGPxc1P-6YNpRJeMVEXSFY0jve2K4HxpsNfR5V0R_/exec';

// URL Pública do CSV (Para LEITURA dos dados no Dashboard)
export const CSV_URL_BASE = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQBIokGV3Yw_J9VBIw1x8lw-cPXJt-jDRMmMlv4Cp8cvHYDvQz_1DA0TCjsk6YBQzdvFwNmq_FxF4Ti/pub?gid=1334351946&single=true&output=csv';

// Configurações do Sistema
export const DEFAULT_CONFIG = {
  showDashboard: true,
  allowImageUpload: true,
  allowNotes: true,
  criticalDays: 10,
};

// Permissões do Usuário
export const PERMISSIONS_LIST = [
  { key: 'view_all_pendencias', label: 'Visualizar Todas Pendências' },
  { key: 'view_unit_dest', label: 'Visualizar Apenas Destino (Unidade)' },
  { key: 'filter_payment', label: 'Filtrar por Pagamento' },
  { key: 'search_cte', label: 'Buscar por CTE/Série' },
  { key: 'add_notes', label: 'Adicionar Justificativas/Notas' },
  { key: 'upload_image', label: 'Upload de Imagens' },
  { key: 'export_xls', label: 'Exportar Excel (XLS)' },
  { key: 'view_dashboard', label: 'Acessar Dashboard Gerencial' },
  { key: 'manage_users', label: 'Gerenciar Usuários' },
  { key: 'manage_profiles', label: 'Gerenciar Perfis' },
  { key: 'access_settings', label: 'Acessar Configurações' },
  { key: 'view_critical', label: 'Visualizar Pendências Críticas (>10 dias)' },
  { key: 'receive_notifications', label: 'Receber Notificações' },
  { key: 'manage_open_process', label: 'Gerenciar Processos em Aberto (Marcação)' },
];
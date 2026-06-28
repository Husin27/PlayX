// Kontrak Data Sesi Pengguna Global (Dipakai Client & Server)
export interface AgnosticSession {
  userId: string;
  tenantId: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'ACCOUNTANT' | 'USER';
  iat: number;
  exp: number;
}

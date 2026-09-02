export type UserRole = 'amiri' | 'bakimci' | 'admin';

export type UrgencyLevel = 'normal' | 'hat_durusu';

export type TicketStatus = 'acik' | 'inceleniyor' | 'yapildi';

export type MaintenanceType = 'elektrik' | 'mekanik' | 'genel';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  companyId: string;
  departmentId?: string;
  authorityLevel?: 'seviye_1' | 'seviye_2';
  maintenanceType?: MaintenanceType;
  title?: string;
  phone?: string;
}

export interface Machine {
  id: string;
  companyId: string;
  name: string;           // Makine adı
  positions: number;      // Kaç pozisyonlu
  qrCode: string;         // QR kod (JSON stringi)
  createdBy: string;      // Amir user id
  createdAt: number;      // timestamp
  departmentId?: string;
  serialNumber?: string;
  maxSpeed?: number;
}

export interface Ticket {
  id: string;
  companyId: string;
  machineId?: string;     // Machine referansı
  machineName: string;
  position?: number;      // Hangi pozisyon
  maintenanceType: MaintenanceType;
  urgency: UrgencyLevel;
  description: string;
  photoUrl?: string;
  status: TicketStatus;
  createdBy: string;      // amiri user id
  createdByName: string;
  createdAt: number;      // timestamp
  assignedTo?: string;    // bakımcı user id
  resolvedByName?: string; // <--- YENİ: işlemi yapan bakımcının adı
  resolutionNote?: string;
  resolutionPhotoUrl?: string;
  resolvedAt?: number;
  departmentId?: string;
positionId?: string;
categoryId?: string;
}
export type UserRole = 'amiri' | 'bakimci' | 'admin';

export type UrgencyLevel = 'normal' | 'hat_durusu';

export type TicketStatus = 'acik' | 'inceleniyor' | 'yapildi';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  companyId: string;
}


export interface Machine {
  id: string;
  companyId: string;
  name: string;           // Makine adı
  positions: number;      // Kaç pozisyonlu
  qrCode: string;         // QR kod (JSON stringi)
  createdBy: string;      // Amir user id
  createdAt: number;      // timestamp
}

export interface Ticket {
  id: string;
  companyId: string;
  machineId?: string;     // Machine referansı
  machineName: string;
  position?: number;      // Hangi pozisyon
  urgency: UrgencyLevel;
  description: string;
  photoUrl?: string;
  status: TicketStatus;
  createdBy: string;      // amiri user id
  createdByName: string;
  createdAt: number;      // timestamp
  assignedTo?: string;    // bakımcı user id
  resolutionNote?: string;
  resolutionPhotoUrl?: string;
  resolvedAt?: number;
}
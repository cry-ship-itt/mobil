import { Machine, Ticket } from '../types';

// Mock database
const machinesDB = new Map<string, Machine[]>();
const ticketsDB = new Map<string, Ticket[]>();

export const machineService = {
  // Makine oluştur ve QR kod generate et
  createMachine: async (companyId: string, name: string, positions: number, createdBy: string): Promise<Machine> => {
    const machineId = 'machine-' + Date.now();
    const qrCodeData = {
      id: machineId,
      name,
      positions,
      companyId,
    };

    const machine: Machine = {
      id: machineId,
      companyId,
      name,
      positions,
      qrCode: JSON.stringify(qrCodeData),
      createdBy,
      createdAt: Date.now(),
    };

    if (!machinesDB.has(companyId)) {
      machinesDB.set(companyId, []);
    }
    machinesDB.get(companyId)!.push(machine);

    return machine;
  },

  // Şirketin tüm makinelerini getir
  getMachinesByCompany: async (companyId: string): Promise<Machine[]> => {
    return machinesDB.get(companyId) || [];
  },

  // QR koddan makine bilgisini çıkar
  decodeMachineFromQR: (qrCodeData: string): { id: string; name: string; positions: number; companyId: string } => {
    try {
      return JSON.parse(qrCodeData);
    } catch {
      throw new Error('Geçersiz QR kod');
    }
  },

  // Makine ID'den makine bilgisini getir
  getMachineById: async (machineId: string): Promise<Machine | null> => {
    for (const machines of machinesDB.values()) {
      const machine = machines.find(m => m.id === machineId);
      if (machine) return machine;
    }
    return null;
  },

  // Makineleri sil
  deleteMachine: async (machineId: string): Promise<void> => {
    for (const [, machines] of machinesDB.entries()) {
      const index = machines.findIndex(m => m.id === machineId);
      if (index !== -1) {
        machines.splice(index, 1);
        return;
      }
    }
  },
};

// Ticket service de makine entegrasyonuyla güncellendi
export const ticketService = {
  createTicket: async (data: {
    companyId: string;
    machineId?: string;
    machineName: string;
    position?: number;
    urgency: 'normal' | 'hat_durusu';
    description: string;
    createdBy: string;
    createdByName: string;
  }): Promise<Ticket> => {
    const ticket: Ticket = {
      id: 'ticket-' + Date.now(),
      companyId: data.companyId,
      machineId: data.machineId,
      machineName: data.machineName,
      position: data.position,
      urgency: data.urgency,
      description: data.description,
      status: 'acik',
      createdBy: data.createdBy,
      createdByName: data.createdByName,
      createdAt: Date.now(),
    };

    if (!ticketsDB.has(data.companyId)) {
      ticketsDB.set(data.companyId, []);
    }
    ticketsDB.get(data.companyId)!.push(ticket);
    return ticket;
  },

  getOpenTickets: async (companyId: string): Promise<Ticket[]> => {
    return (ticketsDB.get(companyId) || []).filter(t => t.status !== 'yapildi');
  },

  getTicketById: async (ticketId: string): Promise<Ticket | null> => {
    for (const tickets of ticketsDB.values()) {
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) return ticket;
    }
    return null;
  },

  startInvestigating: async (ticketId: string, bakimciId: string): Promise<void> => {
    for (const tickets of ticketsDB.values()) {
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        ticket.status = 'inceleniyor';
        ticket.assignedTo = bakimciId;
        return;
      }
    }
  },

  completeTicket: async (ticketId: string, resolutionNote: string): Promise<void> => {
    for (const tickets of ticketsDB.values()) {
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        ticket.status = 'yapildi';
        ticket.resolutionNote = resolutionNote;
        ticket.resolvedAt = Date.now();
        return;
      }
    }
  },
};

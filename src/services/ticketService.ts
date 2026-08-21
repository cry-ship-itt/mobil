import { Ticket, UrgencyLevel } from '../types';

// Bellek içi sahte veritabanı — uygulama kapanınca sıfırlanır.
// Firebase entegrasyonunda bu dosyanın içi Firestore çağrılarıyla
// değişecek, dışa açılan fonksiyon imzaları (signature) aynı kalacak.
let mockTickets: Ticket[] = [
  {
    id: '1',
    companyId: 'company-DEMO',
    machineName: 'POY-2 Sarım Makinesi',
    urgency: 'hat_durusu',
    description: 'Makine tamamen durdu, motor sesi geliyor.',
    status: 'acik',
    createdBy: 'user-1',
    createdByName: 'Ahmet Y.',
    createdAt: Date.now() - 1000 * 60 * 20,
  },
  {
    id: '2',
    companyId: 'company-DEMO',
    machineName: 'Boya Kazanı 3',
    urgency: 'normal',
    description: 'Sıcaklık göstergesi hatalı okuyor.',
    status: 'acik',
    createdBy: 'user-1',
    createdByName: 'Ahmet Y.',
    createdAt: Date.now() - 1000 * 60 * 60 * 3,
  },
];

const urgencyWeight: Record<UrgencyLevel, number> = {
  hat_durusu: 0,
  normal: 1,
};

export const ticketService = {
  async getOpenTickets(companyId: string): Promise<Ticket[]> {
    return mockTickets
      .filter((t) => t.companyId === companyId && t.status !== 'yapildi')
      .sort((a, b) => urgencyWeight[a.urgency] - urgencyWeight[b.urgency]);
  },

  async getTicketById(id: string): Promise<Ticket | undefined> {
    return mockTickets.find((t) => t.id === id);
  },

  async createTicket(
    data: Omit<Ticket, 'id' | 'status' | 'createdAt'>
  ): Promise<Ticket> {
    const newTicket: Ticket = {
      ...data,
      id: 'ticket-' + Date.now(),
      status: 'acik',
      createdAt: Date.now(),
    };
    mockTickets = [newTicket, ...mockTickets];
    return newTicket;
  },

  async startInvestigating(ticketId: string, bakimciId: string): Promise<void> {
    mockTickets = mockTickets.map((t) =>
      t.id === ticketId
        ? { ...t, status: 'inceleniyor', assignedTo: bakimciId }
        : t
    );
  },

  async completeTicket(
    ticketId: string,
    resolutionNote: string,
    resolutionPhotoUrl?: string
  ): Promise<void> {
    mockTickets = mockTickets.map((t) =>
      t.id === ticketId
        ? {
            ...t,
            status: 'yapildi',
            resolutionNote,
            resolutionPhotoUrl,
            resolvedAt: Date.now(),
          }
        : t
    );
  },
};
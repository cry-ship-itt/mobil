import { MaintenanceType, Ticket, TicketStatus, UrgencyLevel } from '../types';
import { supabase } from '../utils/supabase';

type TicketRow = {
  id: string;
  company_id: string;
  machine_id: string | null;
  machine_name: string;
  position: number | null;
  department_id: string | null;
  position_id: string | null;
  category_id: string | null;
  urgency: UrgencyLevel;
  maintenance_type: MaintenanceType;
  description: string;
  photo_url: string | null;
  status: TicketStatus;
  created_by: string;
  created_by_name: string;
  assigned_to: string | null;
  resolution_note: string | null;
  resolution_photo_url: string | null;
  created_at: string;
  resolved_at: string | null;
};

const mapTicket = (row: TicketRow): Ticket => ({
  id: row.id,
  companyId: row.company_id,
  machineId: row.machine_id ?? undefined,
  machineName: row.machine_name,
  position: row.position ?? undefined,
  departmentId: row.department_id ?? undefined,
  positionId: row.position_id ?? undefined,
  categoryId: row.category_id ?? undefined,
  urgency: row.urgency,
  maintenanceType: row.maintenance_type,
  description: row.description,
  photoUrl: row.photo_url ?? undefined,
  status: row.status,
  createdBy: row.created_by,
  createdByName: row.created_by_name,
  assignedTo: row.assigned_to ?? undefined,
  resolutionNote: row.resolution_note ?? undefined,
  resolutionPhotoUrl: row.resolution_photo_url ?? undefined,
  createdAt: new Date(row.created_at).getTime(),
  resolvedAt: row.resolved_at ? new Date(row.resolved_at).getTime() : undefined,
});

export const ticketService = {
  async getOpenTickets(companyId: string): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('company_id', companyId)
      .neq('status', 'yapildi')
      .order('urgency', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as TicketRow[]).map(mapTicket);
  },

  async getOpenTicketsByMachine(companyId: string, machineId: string): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('company_id', companyId)
      .eq('machine_id', machineId)
      .neq('status', 'yapildi')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as TicketRow[]).map(mapTicket);
  },

  async getCompanyTickets(companyId: string): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as TicketRow[]).map(mapTicket);
  },

  async getTicketById(id: string): Promise<Ticket | undefined> {
    const { data, error } = await supabase.from('tickets').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapTicket(data as TicketRow) : undefined;
  },

  async createTicket(data: {
    companyId: string;
    machineId: string;
    machineName: string;
    departmentId?: string;
    positionId?: string;
    positionNumber?: number;
    categoryId?: string;
    urgency: UrgencyLevel;
    maintenanceType: MaintenanceType;
    description: string;
    photoUrl?: string;
    createdBy: string;
    createdByName: string;
  }): Promise<Ticket> {
    const { data: row, error } = await supabase
      .from('tickets')
      .insert({
        company_id: data.companyId,
        machine_id: data.machineId,
        machine_name: data.machineName,
        department_id: data.departmentId,
        position_id: data.positionId,
        position: data.positionNumber,
        category_id: data.categoryId,
        maintenance_type: data.maintenanceType,
        urgency: data.urgency,
        description: data.description,
        photo_url: data.photoUrl,
        created_by: data.createdBy,
        created_by_name: data.createdByName,
      })
      .select()
      .single();
    if (error) throw error;
    const ticket = mapTicket(row as TicketRow);
    void supabase.functions.invoke('send-ticket-notification', {
      body: { ticketId: ticket.id },
    }).catch((notificationError) => {
      console.warn('Push bildirimi gönderilemedi:', notificationError);
    });
    return ticket;
  },

  async startInvestigating(ticketId: string, bakimciId: string): Promise<void> {
    const { error } = await supabase
      .from('tickets')
      .update({ status: 'inceleniyor', assigned_to: bakimciId })
      .eq('id', ticketId);
    if (error) throw error;
  },

  async completeTicket(ticketId: string, resolutionNote: string, resolutionPhotoUrl?: string): Promise<void> {
    const { error } = await supabase
      .from('tickets')
      .update({
        status: 'yapildi',
        resolution_note: resolutionNote,
        resolution_photo_url: resolutionPhotoUrl,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', ticketId);
    if (error) throw error;
  },

  subscribeToCompany(companyId: string, onChange: () => void) {
    return supabase
      .channel(`tickets:${companyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets', filter: `company_id=eq.${companyId}` }, onChange)
      .subscribe();
  },

  unsubscribe(channel: ReturnType<typeof supabase.channel>) {
    void supabase.removeChannel(channel);
  },
};
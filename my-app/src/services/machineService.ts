import { Machine } from '../types';
import { supabase } from '../utils/supabase';
import * as Crypto from 'expo-crypto';

type MachineRow = {
  id: string;
  company_id: string;
  name: string;
  positions: number;
  qr_code: string;
  created_by: string;
  created_at: string;
};

const mapMachine = (row: MachineRow): Machine => ({
  id: row.id,
  companyId: row.company_id,
  name: row.name,
  positions: row.positions,
  qrCode: row.qr_code,
  createdBy: row.created_by,
  createdAt: new Date(row.created_at).getTime(),
});

export const machineService = {
  createMachine: async (companyId: string, name: string, positions: number, createdBy: string): Promise<Machine> => {
    const id = Crypto.randomUUID();
    const qrCode = JSON.stringify({ id, name, positions, companyId });
    const { data, error } = await supabase
      .from('machines')
      .insert({ id, company_id: companyId, name, positions, qr_code: qrCode, created_by: createdBy })
      .select()
      .single();
    if (error) throw error;
    return mapMachine(data as MachineRow);
  },

  getMachinesByCompany: async (companyId: string): Promise<Machine[]> => {
    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as MachineRow[]).map(mapMachine);
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
    const { data, error } = await supabase.from('machines').select('*').eq('id', machineId).maybeSingle();
    if (error) throw error;
    return data ? mapMachine(data as MachineRow) : null;
  },

  // Makineleri sil
  deleteMachine: async (machineId: string): Promise<void> => {
    const { error } = await supabase.from('machines').delete().eq('id', machineId);
    if (error) throw error;
  },
};

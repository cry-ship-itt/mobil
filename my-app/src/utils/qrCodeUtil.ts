/**
 * QR Code Utility
 * expo-qrcode kütüphanesiyle entegre edilebilir
 */

export const qrCodeUtil = {
  /**
   * QR kod için data oluştur
   * Gerçek kütüphane: expo-qrcode
   */
  generateQRData: (machineId: string, machineName: string, positions: number, companyId: string): string => {
    return JSON.stringify({
      id: machineId,
      name: machineName,
      positions,
      companyId,
    });
  },

  /**
   * QR koddan veri parse et
   */
  parseQRData: (qrString: string) => {
    try {
      return JSON.parse(qrString);
    } catch (error) {
      throw new Error('Geçersiz QR kod');
    }
  },

  /**
   * QR kod olarak gösterilecek string
   */
  formatQRDisplay: (machineId: string, machineName: string) => {
    return `${machineName}_${machineId}`;
  },
};

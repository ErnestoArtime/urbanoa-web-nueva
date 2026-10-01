import { Injectable } from '@angular/core';

export interface ActiveTicketRecord {
  plate: string;
  ticketId: number;
  sectorId?: number;
  contractId?: number;
  savedAt: number;
}

@Injectable({ providedIn: 'root' })
export class ParkingTicketStoreService {
  private userScope = '';
  private records: Record<string, ActiveTicketRecord> = {};

  setUserScope(identity = ''): void {
    const scope = identity.trim().toLowerCase();
    if (scope !== this.userScope || !scope) this.records = {};
    this.userScope = scope;
  }

  private normalize(plate: string): string {
    return plate.replace(/\s+/g, '').toLocaleUpperCase('es');
  }

  save(input: { plate: string; ticketId: number; sectorId?: number; contractId?: number }): void {
    if (!this.userScope) return;
    this.records[this.normalize(input.plate)] = {
      plate: input.plate,
      ticketId: input.ticketId,
      sectorId: input.sectorId,
      contractId: input.contractId,
      savedAt: Date.now(),
    };
  }

  getByPlate(plate: string): ActiveTicketRecord | undefined {
    if (!this.userScope) return undefined;
    const record = this.records[this.normalize(plate)];
    return record ? { ...record } : undefined;
  }

  clearByPlate(plate: string): void {
    delete this.records[this.normalize(plate)];
  }
}

import { inject, Injectable } from '@angular/core';
import { readStorage, writeStorage } from '../storage/signal-storage';

export interface ActiveTicketRecord {
  plate: string;
  ticketId: number;
  sectorId?: number;
  contractId?: number;
  savedAt: number;
}

const STORAGE_KEY = 'urbanoa.parking.active-tickets';

@Injectable({ providedIn: 'root' })
export class ParkingTicketStoreService {
  private readonly records = readStorage<Record<string, ActiveTicketRecord>>(STORAGE_KEY, {});

  private persist(): void {
    writeStorage(STORAGE_KEY, this.records);
  }

  private normalize(plate: string): string {
    return plate.replace(/\s+/g, '').toLocaleUpperCase('es');
  }

  save(input: { plate: string; ticketId: number; sectorId?: number; contractId?: number }): void {
    this.records[this.normalize(input.plate)] = {
      plate: input.plate,
      ticketId: input.ticketId,
      sectorId: input.sectorId,
      contractId: input.contractId,
      savedAt: Date.now(),
    };
    this.persist();
  }

  getByPlate(plate: string): ActiveTicketRecord | undefined {
    return this.records[this.normalize(plate)];
  }

  clearByPlate(plate: string): void {
    delete this.records[this.normalize(plate)];
    this.persist();
  }
}

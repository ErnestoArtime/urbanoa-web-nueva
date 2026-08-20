import { computed, inject, Injectable, signal } from '@angular/core';
import { MOCK_VEHICLES, type Vehicle } from '../../shared/mock-data';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsApiError } from '../api/ops-api.types';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';
import { OpsSessionService } from '../api/ops-session.service';
import { generateUuid } from '../utils/generate-uuid';

interface PlateApiItem {
  plate: string;
  favorite: boolean;
}

interface PlatesApiValue {
  plates: PlateApiItem[];
}

export interface VehicleMutationResult {
  success: boolean;
  source: 'remote' | 'mock';
  error?: OpsApiError;
}

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly storageKey = 'urbanoa.vehicles';
  private readonly state = signal<Vehicle[]>(this.readVehicles());
  private readonly sourceState = signal<'remote' | 'mock'>('mock');
  private readonly errorState = signal<OpsApiError | null>(null);

  readonly vehicles = this.state.asReadonly();
  readonly source = this.sourceState.asReadonly();
  readonly lastError = this.errorState.asReadonly();
  readonly mainVehicle = computed(() => this.state().find((vehicle) => vehicle.isDefault) ?? this.state()[0] ?? null);

  private readonly api = inject(OpsApiClient);
  private readonly session = inject(OpsSessionService);

  async load(): Promise<void> {
    const token = this.session.token();
    if (!token) {
      this.sourceState.set('mock');
      return;
    }

    try {
      const value = await this.api.get<PlatesApiValue>(OPS_ENDPOINTS.user.plates, { token });
      if (!Array.isArray(value.plates)) throw new Error('QueryUserPlatesAPI no devolvió plates');
      this.state.set(value.plates.map((item) => this.fromApi(item)));
      this.sourceState.set('remote');
      this.errorState.set(null);
      this.persist();
    } catch (error) {
      this.useMock(error, OPS_ENDPOINTS.user.plates);
    }
  }

  getById(id: string): Vehicle | undefined {
    return this.state().find((vehicle) => vehicle.id === id);
  }

  async add(input: Omit<Vehicle, 'id'>): Promise<VehicleMutationResult> {
    const plate = this.normalizePlate(input.plate);
    const result = await this.remoteMutation(OPS_ENDPOINTS.user.addPlate, { plate });
    if (result.success && input.isDefault) await this.remoteMutation(OPS_ENDPOINTS.user.updatePlate, { plate });

    const vehicle = { ...input, plate, id: generateUuid() };
    this.state.update((vehicles) => [...vehicles.map((item) => (vehicle.isDefault ? { ...item, isDefault: false } : item)), vehicle]);
    this.persist();
    return result;
  }

  async update(id: string, changes: Partial<Omit<Vehicle, 'id'>>): Promise<VehicleMutationResult> {
    const current = this.getById(id);
    if (!current) return { success: false, source: this.sourceState() };

    const nextPlate = this.normalizePlate(changes.plate ?? current.plate);
    let result: VehicleMutationResult = { success: true, source: this.session.hasSession() ? 'remote' : 'mock' };

    if (nextPlate !== current.plate) {
      result = await this.remoteMutation(OPS_ENDPOINTS.user.removePlate, { plate: current.plate });
      if (result.success) result = await this.remoteMutation(OPS_ENDPOINTS.user.addPlate, { plate: nextPlate });
    }
    if (result.success && changes.isDefault) result = await this.remoteMutation(OPS_ENDPOINTS.user.updatePlate, { plate: nextPlate });

    this.state.update((vehicles) =>
      vehicles.map((vehicle) => {
        if (vehicle.id === id) return { ...vehicle, ...changes, plate: nextPlate };
        return changes.isDefault ? { ...vehicle, isDefault: false } : vehicle;
      }),
    );
    this.persist();
    return result;
  }

  async remove(id: string): Promise<VehicleMutationResult> {
    const current = this.getById(id);
    if (!current) return { success: false, source: this.sourceState() };
    const result = await this.remoteMutation(OPS_ENDPOINTS.user.removePlate, { plate: current.plate });

    this.state.update((vehicles) => {
      const remaining = vehicles.filter((vehicle) => vehicle.id !== id);
      if (remaining.length && !remaining.some((vehicle) => vehicle.isDefault)) remaining[0] = { ...remaining[0], isDefault: true };
      return remaining;
    });
    this.persist();
    return result;
  }

  private async remoteMutation(endpoint: string, body: { plate: string }): Promise<VehicleMutationResult> {
    const token = this.session.token();
    if (!token) {
      this.sourceState.set('mock');
      return { success: true, source: 'mock' };
    }

    try {
      await this.api.post<string>(endpoint, body, { token });
      this.sourceState.set('remote');
      this.errorState.set(null);
      return { success: true, source: 'remote' };
    } catch (error) {
      const apiError = this.toApiError(error, endpoint);
      this.sourceState.set('mock');
      this.errorState.set(apiError);
      console.warn('[OPS API] Mutación de matrícula aplicada solo localmente', apiError);
      return { success: true, source: 'mock', error: apiError };
    }
  }

  private fromApi(item: PlateApiItem): Vehicle {
    return { id: item.plate, plate: item.plate, isDefault: item.favorite };
  }

  private normalizePlate(plate: string): string {
    return plate.trim().toUpperCase();
  }

  private useMock(error: unknown, endpoint: string): void {
    const apiError = this.toApiError(error, endpoint);
    this.sourceState.set('mock');
    this.errorState.set(apiError);
    console.warn('[OPS API] Se conservan las matrículas locales', apiError);
  }

  private toApiError(error: unknown, endpoint: string): OpsApiError {
    return error instanceof OpsApiError
      ? error
      : new OpsApiError('invalid-response', endpoint, error instanceof Error ? error.message : 'Error desconocido');
  }

  private readVehicles(): Vehicle[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(this.storageKey) ?? 'null') as Vehicle[] | null;
      return Array.isArray(parsed) && parsed.length ? parsed : MOCK_VEHICLES.map((vehicle) => ({ ...vehicle }));
    } catch {
      return MOCK_VEHICLES.map((vehicle) => ({ ...vehicle }));
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state()));
    } catch {
      // Storage can be unavailable in private or restricted contexts.
    }
  }
}

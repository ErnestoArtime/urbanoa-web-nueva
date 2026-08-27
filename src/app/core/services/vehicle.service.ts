import { computed, inject, Injectable, signal } from '@angular/core';
import type { Vehicle } from '../../shared/models/vehicle';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsApiError } from '../api/ops-api.types';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';
import { OpsSessionService } from '../api/ops-session.service';
import { generateUuid } from '../utils/generate-uuid';

interface PlateApiItem {
  plate: string;
  favorite: number | boolean;
}

interface PlatesApiValue {
  plates: PlateApiItem[];
}

export interface VehicleMutationResult {
  success: boolean;
  source: 'remote' | 'error';
  error?: OpsApiError;
}

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly storageKey = 'urbanoa.vehicles';
  private readonly state = signal<Vehicle[]>([]);
  private readonly sourceState = signal<'idle' | 'remote' | 'error'>('idle');
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
      this.state.set([]);
      this.sourceState.set('error');
      return;
    }

    try {
      const value = await this.api.getOrNull<PlatesApiValue>(OPS_ENDPOINTS.user.plates, { token });
      if (value === null || !Array.isArray(value.plates)) {
        this.state.set([]);
      } else {
        this.state.set(value.plates.map((item) => this.fromApi(item)));
      }
      this.sourceState.set('remote');
      this.errorState.set(null);
      await this.ensureFavorite();
    } catch (error) {
      this.state.set([]);
      this.useError(error, OPS_ENDPOINTS.user.plates);
    }
  }

  private async ensureFavorite(): Promise<void> {
    const vehicles = this.state();
    if (vehicles.length === 0 || vehicles.some((vehicle) => vehicle.isDefault)) return;
    await this.setDefault(vehicles[0].id);
  }

  getById(id: string): Vehicle | undefined {
    return this.state().find((vehicle) => vehicle.id === id);
  }

  async add(input: Omit<Vehicle, 'id'>): Promise<VehicleMutationResult> {
    const plate = this.normalizePlate(input.plate);
    const result = await this.remoteMutation(OPS_ENDPOINTS.user.addPlate, { plate });
    if (!result.success) return result;

    const vehicle: Vehicle = { ...input, plate, isDefault: false, id: generateUuid() };
    this.state.update((vehicles) => [...vehicles, vehicle]);
    this.persist();

    if (input.isDefault) return this.setDefault(vehicle.id);
    return this.state().some((item) => item.isDefault) ? result : this.setDefault(vehicle.id);
  }

  async update(id: string, changes: Partial<Omit<Vehicle, 'id'>>): Promise<VehicleMutationResult> {
    const current = this.getById(id);
    if (!current) return { success: false, source: 'error' };

    const nextPlate = this.normalizePlate(changes.plate ?? current.plate);
    let result: VehicleMutationResult = { success: true, source: 'remote' };

    if (nextPlate !== current.plate) {
      result = await this.remoteMutation(OPS_ENDPOINTS.user.removePlate, { plate: current.plate });
      if (result.success) result = await this.remoteMutation(OPS_ENDPOINTS.user.addPlate, { plate: nextPlate });
      if (!result.success) return result;
    }

    this.state.update((vehicles) =>
      vehicles.map((vehicle) => (vehicle.id === id ? { ...vehicle, ...changes, plate: nextPlate } : vehicle)),
    );
    this.persist();

    if (result.success && changes.isDefault) result = await this.setDefault(id);
    return result;
  }

  async setDefault(id: string): Promise<VehicleMutationResult> {
    const current = this.getById(id);
    if (!current) return { success: false, source: 'error' };
    if (current.isDefault) return { success: true, source: 'remote' };

    const previousDefault = this.state().find((vehicle) => vehicle.isDefault && vehicle.id !== id);

    let result = await this.remoteMutation(OPS_ENDPOINTS.user.updatePlate, { plate: current.plate, favorite: 1 });
    if (result.success && previousDefault) {
      result = await this.remoteMutation(OPS_ENDPOINTS.user.updatePlate, { plate: previousDefault.plate, favorite: 0 });
    }
    if (!result.success) return result;

    this.state.update((vehicles) => vehicles.map((vehicle) => ({ ...vehicle, isDefault: vehicle.id === id })));
    this.persist();
    return result;
  }

  async remove(id: string): Promise<VehicleMutationResult> {
    const current = this.getById(id);
    if (!current) return { success: false, source: 'error' };
    const result = await this.remoteMutation(OPS_ENDPOINTS.user.removePlate, { plate: current.plate });
    if (!result.success) return result;

    const remaining = this.state().filter((vehicle) => vehicle.id !== id);
    this.state.set(remaining);
    this.persist();

    const needsPromotion = result.success && remaining.length > 0 && !remaining.some((vehicle) => vehicle.isDefault);
    return needsPromotion ? this.setDefault(remaining[0].id) : result;
  }

  private async remoteMutation(endpoint: string, body: { plate: string; favorite?: number }): Promise<VehicleMutationResult> {
    const token = this.session.token();
    if (!token) {
      this.sourceState.set('error');
      return { success: false, source: 'error' };
    }

    try {
      await this.api.post<string>(endpoint, body, { token });
      this.sourceState.set('remote');
      this.errorState.set(null);
      return { success: true, source: 'remote' };
    } catch (error) {
      const apiError = this.toApiError(error, endpoint);
      this.sourceState.set('error');
      this.errorState.set(apiError);
      return { success: false, source: 'error', error: apiError };
    }
  }

  private fromApi(item: PlateApiItem): Vehicle {
    return { id: item.plate, plate: item.plate, isDefault: item.favorite === true || item.favorite === 1 };
  }

  private normalizePlate(plate: string): string {
    return plate.trim().toUpperCase();
  }

  private useError(error: unknown, endpoint: string): void {
    const apiError = this.toApiError(error, endpoint);
    this.sourceState.set('error');
    this.errorState.set(apiError);
  }

  private toApiError(error: unknown, endpoint: string): OpsApiError {
    return error instanceof OpsApiError
      ? error
      : new OpsApiError('invalid-response', endpoint, error instanceof Error ? error.message : 'Error desconocido');
  }

  private persist(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state()));
    } catch {
      // Storage can be unavailable in private or restricted contexts.
    }
  }
}

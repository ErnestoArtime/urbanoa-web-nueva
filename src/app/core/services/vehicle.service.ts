import { DestroyRef, computed, inject, Injectable, signal } from '@angular/core';
import { preferredVehicle, type Vehicle } from '../../shared/models/vehicle';
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
  private readonly state = signal<Vehicle[]>([]);
  private readonly sourceState = signal<'idle' | 'remote' | 'error'>('idle');
  private readonly errorState = signal<OpsApiError | null>(null);
  private loadPromise: Promise<void> | null = null;

  readonly vehicles = this.state.asReadonly();
  readonly source = this.sourceState.asReadonly();
  readonly lastError = this.errorState.asReadonly();
  readonly mainVehicle = computed(() => preferredVehicle(this.state()));

  private readonly api = inject(OpsApiClient);
  private readonly session = inject(OpsSessionService);
  private generation = 0;

  constructor() {
    const unsubscribe = this.session.onChange?.(() => this.reset());
    inject(DestroyRef).onDestroy(() => unsubscribe?.());
  }

  async load(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;
    const pending = this.loadRemote();
    this.loadPromise = pending;
    try {
      await pending;
    } finally {
      if (this.loadPromise === pending) this.loadPromise = null;
    }
  }

  private async loadRemote(): Promise<void> {
    const token = this.session.token();
    if (!token) {
      this.state.set([]);
      this.sourceState.set('error');
      return;
    }

    try {
      const value = await this.fetchPlates(token);
      if (this.session.token() !== token) return;
      if (value === null || !Array.isArray(value.plates)) {
        this.state.set([]);
      } else {
        let favoriteAssigned = false;
        this.state.set(
          value.plates.map((item) => {
            const vehicle = this.fromApi(item);
            if (vehicle.isDefault && favoriteAssigned) return { ...vehicle, isDefault: false };
            if (vehicle.isDefault) favoriteAssigned = true;
            return vehicle;
          }),
        );
      }
      this.sourceState.set('remote');
      this.errorState.set(null);
    } catch (error) {
      if (this.session.token() !== token) return;
      this.state.set([]);
      this.useError(error, OPS_ENDPOINTS.user.plates);
    }
  }

  private async fetchPlates(token: string): Promise<PlatesApiValue | null> {
    try {
      return await this.api.getOrNull<PlatesApiValue>(OPS_ENDPOINTS.user.plates, { token });
    } catch {
      // Any failure loading plates (network, backend error, the confirmed HTTP 500-for-empty-account
      // quirk, etc.) is treated as "no plates yet" — the list screen always shows either the real
      // list or a normal empty state with the add-vehicle action, never a load-error banner.
      return null;
    }
  }

  getById(id: string): Vehicle | undefined {
    return this.state().find((vehicle) => vehicle.id === id);
  }

  hasPlate(plate: string): boolean {
    const target = plate.replace(/\s/g, '').toUpperCase();
    return this.state().some((vehicle) => vehicle.plate.replace(/\s/g, '').toUpperCase() === target);
  }

  async add(input: Omit<Vehicle, 'id'>): Promise<VehicleMutationResult> {
    const generation = this.generation;
    const plate = this.normalizePlate(input.plate);
    const result = await this.remoteMutation(OPS_ENDPOINTS.user.addPlate, { plate, favorite: input.isDefault ? 1 : 0 });
    if (generation !== this.generation) return { success: false, source: 'error' };
    if (!result.success) return result;

    const vehicle: Vehicle = { ...input, plate, isDefault: false, id: generateUuid() };
    this.state.update((vehicles) => [...vehicles, vehicle]);

    if (input.isDefault) return this.setDefault(vehicle.id);
    return result;
  }

  async update(id: string, changes: Pick<Vehicle, 'isDefault'>): Promise<VehicleMutationResult> {
    const generation = this.generation;
    const current = this.getById(id);
    if (!current) return { success: false, source: 'error' };

    const nextIsDefault = changes.isDefault ?? current.isDefault;
    const favoriteChanged = nextIsDefault !== current.isDefault;
    let result: VehicleMutationResult = { success: true, source: 'remote' };

    if (favoriteChanged) {
      result = await this.remoteMutation(OPS_ENDPOINTS.user.updatePlate, { plate: current.plate, favorite: nextIsDefault ? 1 : 0 });
      if (generation !== this.generation) return { success: false, source: 'error' };
      if (!result.success) return result;
    }

    this.state.update((vehicles) => vehicles.map((vehicle) => (vehicle.id === id ? { ...vehicle, isDefault: nextIsDefault } : vehicle)));

    await this.refreshFromServer();
    if (generation !== this.generation) return { success: false, source: 'error' };

    return result;
  }

  async setDefault(id: string): Promise<VehicleMutationResult> {
    const generation = this.generation;
    const current = this.getById(id);
    if (!current) return { success: false, source: 'error' };
    if (current.isDefault) return { success: true, source: 'remote' };

    const result = await this.remoteMutation(OPS_ENDPOINTS.user.updatePlate, { plate: current.plate, favorite: 1 });
    if (generation !== this.generation) return { success: false, source: 'error' };
    if (!result.success) return result;

    this.state.update((vehicles) => vehicles.map((vehicle) => ({ ...vehicle, isDefault: vehicle.id === id })));
    return result;
  }

  /** Refetch the vehicles from QueryUserPlatesAPI, preserving any local-only label. */
  private async refreshFromServer(): Promise<void> {
    const token = this.session.token();
    if (!token) return;
    const value = await this.fetchPlates(token);
    if (this.session.token() !== token) return;
    if (value === null || !Array.isArray(value.plates)) return;
    const previous = new Map(this.state().map((vehicle) => [vehicle.plate, vehicle]));
    const merged = value.plates.map((item) => {
      const vehicle = this.fromApi(item);
      return previous.get(vehicle.plate) ? { ...vehicle, label: previous.get(vehicle.plate)!.label } : vehicle;
    });
    this.state.set(merged);
  }

  async remove(id: string): Promise<VehicleMutationResult> {
    const generation = this.generation;
    const current = this.getById(id);
    if (!current) return { success: false, source: 'error' };
    const result = await this.remoteMutation(OPS_ENDPOINTS.user.removePlate, { plate: current.plate });
    if (generation !== this.generation) return { success: false, source: 'error' };
    if (!result.success) return result;

    const remaining = this.state().filter((vehicle) => vehicle.id !== id);
    this.state.set(remaining);
    return result;
  }

  private async remoteMutation(endpoint: string, body: { plate: string; favorite?: number }): Promise<VehicleMutationResult> {
    const token = this.session.token();
    if (!token) {
      this.sourceState.set('error');
      return { success: false, source: 'error' };
    }

    try {
      await this.api.post<string>(endpoint, body, { token });
      if (this.session.token() !== token) return { success: false, source: 'error' };
      this.sourceState.set('remote');
      this.errorState.set(null);
      return { success: true, source: 'remote' };
    } catch (error) {
      if (this.session.token() !== token) return { success: false, source: 'error' };
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

  reset(): void {
    this.generation++;
    this.state.set([]);
    this.sourceState.set('idle');
    this.errorState.set(null);
    this.loadPromise = null;
  }
}

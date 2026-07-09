import { computed, Injectable, signal } from '@angular/core';
import { MOCK_VEHICLES, type Vehicle } from '../../shared/mock-data';

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly storageKey = 'urbanoa.vehicles';
  private readonly state = signal<Vehicle[]>(this.readVehicles());

  readonly vehicles = this.state.asReadonly();
  readonly mainVehicle = computed(() => this.state().find((vehicle) => vehicle.isDefault) ?? this.state()[0] ?? null);

  getById(id: string): Vehicle | undefined {
    return this.state().find((vehicle) => vehicle.id === id);
  }

  add(input: Omit<Vehicle, 'id'>): Vehicle {
    const vehicle = { ...input, id: crypto.randomUUID() };
    this.state.update((vehicles) => [...vehicles.map((item) => (vehicle.isDefault ? { ...item, isDefault: false } : item)), vehicle]);
    this.persist();
    return vehicle;
  }

  update(id: string, changes: Partial<Omit<Vehicle, 'id'>>): boolean {
    if (!this.getById(id)) return false;
    this.state.update((vehicles) =>
      vehicles.map((vehicle) => {
        if (vehicle.id === id) return { ...vehicle, ...changes };
        return changes.isDefault ? { ...vehicle, isDefault: false } : vehicle;
      }),
    );
    this.persist();
    return true;
  }

  remove(id: string): void {
    this.state.update((vehicles) => {
      const remaining = vehicles.filter((vehicle) => vehicle.id !== id);
      if (remaining.length && !remaining.some((vehicle) => vehicle.isDefault)) {
        remaining[0] = { ...remaining[0], isDefault: true };
      }
      return remaining;
    });
    this.persist();
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

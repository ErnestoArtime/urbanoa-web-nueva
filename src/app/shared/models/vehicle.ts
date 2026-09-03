export interface Vehicle {
  id: string;
  plate: string;
  isDefault: boolean;
  isForeign?: boolean;
  label?: string;
}

export function preferredVehicle(vehicles: Vehicle[]): Vehicle | null {
  return vehicles.find((vehicle) => vehicle.isDefault) ?? vehicles[0] ?? null;
}

import { Injectable, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ParkingFlowQuery } from './parking-flow.model';
import type { ParkingTimeStep, ParkingPaymentSummary } from './models/parking-time-step.model';

export interface ExtensionParkingContext {
  plate: string;
  vehicleId: string;
  zone: string;
  contractId?: number;
  tariffId?: number;
  sectorId?: number;
  sectorColor?: string;
  street?: string;
  latitude?: number;
  longitude?: number;
}

export interface ParkingFlowState {
  city: string;
  cityId: string;
  cityName: string;
  plate: string;
  vehicleId: string;
  zoneId: string;
  zoneName: string;
  sectorId: string;
  sectorName: string;
  sectorColor: string;
  street: string;
  streetId: string;
  ticketId: string;
  ticketName: string;
  latitude: string;
  longitude: string;
  tariffId: string;
  tariffType: string;
  tariffName: string;
  tariffPrice: string;
  duration: string;
  minutes: string;
  amount: string;
  endTime: string;
  selectedStep: ParkingTimeStep | null;
  paymentSummary: ParkingPaymentSummary | null;
}

@Injectable({ providedIn: 'root' })
export class ParkingFlowStore {
  private readonly state = signal<Partial<ParkingFlowState>>({});
  readonly vm = this.state.asReadonly();

  update(partial: Partial<ParkingFlowState>): void {
    this.state.update((s) => ({ ...s, ...partial }));
  }

  selectVehicle(vehicleId: string, plate: string): boolean {
    const current = this.state();
    if (current.vehicleId === vehicleId && current.plate === plate) return false;

    this.state.set({
      ...current,
      vehicleId,
      plate,
      ticketId: undefined,
      ticketName: undefined,
      tariffId: undefined,
      tariffType: undefined,
      tariffName: undefined,
      tariffPrice: undefined,
      duration: undefined,
      minutes: undefined,
      amount: undefined,
      endTime: undefined,
      selectedStep: undefined,
      paymentSummary: undefined,
    });
    return true;
  }

  reset(): void {
    this.state.set({});
  }

  startExtension(parking: ExtensionParkingContext): boolean {
    if (!parking.plate || !parking.contractId || !parking.tariffId || !parking.sectorId) return false;

    this.state.set({
      cityId: String(parking.contractId),
      plate: parking.plate,
      vehicleId: parking.vehicleId,
      zoneId: String(parking.sectorId),
      zoneName: parking.zone,
      sectorId: String(parking.sectorId),
      sectorName: parking.zone,
      sectorColor: parking.sectorColor ?? '',
      street: parking.street ?? '',
      ticketId: String(parking.tariffId),
      tariffId: String(parking.tariffId),
      latitude: parking.latitude == null ? '' : String(parking.latitude),
      longitude: parking.longitude == null ? '' : String(parking.longitude),
    });
    return true;
  }

  hasLocationData(): boolean {
    const s = this.state();
    return !!s.cityId && !!s.zoneId && !!s.sectorId;
  }

  hasTicketData(): boolean {
    const s = this.state();
    return !!s.plate && !!s.tariffId;
  }

  hasTimeStepData(): boolean {
    const s = this.state();
    return !!s.minutes && !!s.amount;
  }

  canConfirm(): boolean {
    const s = this.state();
    return !!s.cityId && !!s.plate && !!s.zoneId && !!s.sectorId && !!s.tariffId && !!s.tariffType && !!s.minutes && !!s.amount;
  }

  hasMinimumParkingData(): boolean {
    return this.hasLocationData() || this.hasTicketData();
  }

  fromStore(): ParkingFlowQuery {
    const s = this.state();
    return {
      city: s.city ?? '',
      cityName: s.cityName ?? '',
      cityId: s.cityId ?? '',
      plate: s.plate ?? '',
      vehicleId: s.vehicleId ?? '',
      zoneId: s.zoneId ?? '',
      zone: s.zoneName ?? '',
      street: s.street ?? '',
      streetId: s.streetId ?? '',
      sector: s.sectorName ?? s.street ?? '',
      sectorColor: s.sectorColor ?? '',
      sectorId: s.sectorId ?? s.zoneId ?? '',
      ticketId: s.ticketId ?? '',
      latitude: s.latitude ?? '',
      longitude: s.longitude ?? '',
      tariffId: s.tariffId ?? '',
      tariffType: s.tariffType ?? '',
      tariff: s.tariffName ?? '',
      tariffPrice: s.tariffPrice ?? '',
      duration: s.duration ?? '',
      minutes: s.minutes ?? '',
      amount: s.amount ?? '',
      endTime: s.endTime ?? '',
    };
  }

  clear(): void {
    this.reset();
  }

  fromQueryParams(route: ActivatedRoute): void {
    const params = Object.fromEntries(
      route.snapshot.queryParamMap.keys.map((key) => [key, route.snapshot.queryParamMap.get(key) ?? '']),
    ) as Record<string, string>;
    this.update({
      city: params['city'] ?? '',
      cityId: params['cityId'] ?? '',
      cityName: params['cityName'] ?? '',
      plate: params['plate'] ?? '',
      vehicleId: params['vehicleId'] ?? '',
      zoneId: params['zoneId'] ?? '',
      zoneName: params['zone'] ?? '',
      sectorColor: params['sectorColor'] ?? '',
      street: params['street'] ?? '',
      streetId: params['streetId'] ?? '',
      sectorId: params['sectorId'] ?? '',
      sectorName: params['sector'] ?? '',
      ticketId: params['ticketId'] ?? '',
      ticketName: params['ticketName'] ?? '',
      latitude: params['latitude'] ?? '',
      longitude: params['longitude'] ?? '',
      tariffId: params['tariffId'] ?? '',
      tariffType: params['tariffType'] ?? '',
      tariffName: params['tariff'] ?? '',
      tariffPrice: params['tariffPrice'] ?? '',
      duration: params['duration'] ?? '',
      minutes: params['minutes'] ?? '',
      amount: params['amount'] ?? '',
      endTime: params['endTime'] ?? '',
    });
  }

  toQueryParams(): Record<string, string> {
    const s = this.state();
    const result: Record<string, string> = {};
    if (s.city) result['city'] = s.city;
    if (s.cityId) result['cityId'] = s.cityId;
    if (s.cityName) result['cityName'] = s.cityName;
    if (s.plate) result['plate'] = s.plate;
    if (s.vehicleId) result['vehicleId'] = s.vehicleId;
    if (s.zoneId) result['zoneId'] = s.zoneId;
    if (s.zoneName) result['zone'] = s.zoneName;
    if (s.sectorColor) result['sectorColor'] = s.sectorColor;
    if (s.street) result['street'] = s.street;
    if (s.streetId) result['streetId'] = s.streetId;
    if (s.sectorId) result['sectorId'] = s.sectorId;
    if (s.sectorName) result['sector'] = s.sectorName;
    if (s.ticketId) result['ticketId'] = s.ticketId;
    if (s.ticketName) result['ticketName'] = s.ticketName;
    if (s.latitude) result['latitude'] = s.latitude;
    if (s.longitude) result['longitude'] = s.longitude;
    if (s.tariffId) result['tariffId'] = s.tariffId;
    if (s.tariffType) result['tariffType'] = s.tariffType;
    if (s.tariffName) result['tariff'] = s.tariffName;
    if (s.tariffPrice) result['tariffPrice'] = s.tariffPrice;
    if (s.duration) result['duration'] = s.duration;
    if (s.minutes) result['minutes'] = s.minutes;
    if (s.amount) result['amount'] = s.amount;
    if (s.endTime) result['endTime'] = s.endTime;
    return result;
  }
}

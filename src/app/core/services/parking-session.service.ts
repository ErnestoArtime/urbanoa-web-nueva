import { apiErrorMessage } from '../http/api-error-key';
import { OpsSessionService } from '../api/ops-session.service';
import { PaymentChallengeService } from './payment-challenge.service';
import { TranslationService } from './translation.service';
import { isPaymentOutcomeUnknown } from '../utils/payment-error';
import { Injectable, inject, signal } from '@angular/core';
import { OperationsService, type ActiveParking } from './operations.service';
import { ParkingApiService, type UnparkingQuoteResult } from './parking-api.service';
import { ParkingTicketStoreService } from './parking-ticket-store.service';
import { WalletService } from './wallet.service';

@Injectable({ providedIn: 'root' })
export class ParkingSessionService {
  private readonly session = inject(OpsSessionService);
  private readonly paymentChallenge = inject(PaymentChallengeService);
  private readonly translations = inject(TranslationService);
  private readonly operationsService = inject(OperationsService);
  private readonly parkingApi = inject(ParkingApiService);
  private readonly ticketStore = inject(ParkingTicketStoreService);
  private readonly walletService = inject(WalletService);

  readonly activeParkings = this.operationsService.activeParkings;
  readonly activeParkingsCount = this.operationsService.activeParkingsCount;
  readonly hasActiveParkings = this.operationsService.hasActiveParkings;
  readonly activeSource = this.operationsService.activeSource;
  readonly unparkError = signal<string | null>(null);

  async quoteUnparking(parkingId: string): Promise<UnparkingQuoteResult> {
    const parking = this.operationsService.getActiveParking(parkingId);
    if (!parking?.contractId || parking.refundable !== 2) {
      return { success: false, source: 'remote', error: new Error('No se encontró el aparcamiento activo.') };
    }
    return this.parkingApi.queryUnparking({
      contractId: parking.contractId,
      plate: parking.plate,
      ...(parking.sectorId ? { groupId: parking.sectorId } : {}),
      ticketId: this.unparkingTicketId(parking),
    });
  }

  async leaveParking(parkingId: string, preparedQuote?: UnparkingQuoteResult): Promise<boolean> {
    if (this.paymentChallenge.hasPendingPayment()) {
      this.unparkError.set(this.translations.translate('payment.uncertain.message'));
      return false;
    }
    this.unparkError.set(null);
    const parking = this.operationsService.getActiveParking(parkingId);
    if (!parking?.contractId || parking.refundable !== 2) {
      this.unparkError.set('No se encontró el aparcamiento activo.');
      return false;
    }
    const input = {
      contractId: parking.contractId,
      plate: parking.plate,
      ...(parking.sectorId ? { groupId: parking.sectorId } : {}),
      ticketId: this.unparkingTicketId(parking),
      ...(parking.operationDate ? { datetime: parking.operationDate } : {}),
    };
    const token = this.session.token();
    this.paymentChallenge.begin({ kind: 'unparking', returnUrl: '/app/operations', status: 'uncertain' });
    let result;
    try {
      result = preparedQuote ? await this.parkingApi.unpark(input, preparedQuote) : await this.parkingApi.unpark(input);
    } catch {
      if (this.session.token() !== token) return false;
      this.unparkError.set(this.translations.translate('payment.uncertain.message'));
      return false;
    }
    if (this.session.token() !== token) return false;
    if (!result.success) {
      const error = result.error;
      if (isPaymentOutcomeUnknown(error)) {
        this.unparkError.set(this.translations.translate('payment.uncertain.message'));
      } else {
        this.paymentChallenge.clear();
        this.operationsService.restoreActiveParking(parking);
        this.unparkError.set(apiErrorMessage(error, this.translations));
      }
      return false;
    }
    this.paymentChallenge.clear();
    this.operationsService.markParkingEnded(parking.id);
    // Confirmation is final. Auxiliary reads must not keep the action modal blocked.
    const vehicles = this.activeParkings().map(({ vehicleId: id, plate }) => ({ id, plate }));
    void this.operationsService
      .load()
      .then(() => {
        if (this.session.token() === token) this.operationsService.syncActiveParkingsFromOperations(vehicles);
      })
      .catch(() => undefined);
    // Unparking changes credit, not payment methods. Each service exposes its refresh error.
    void this.walletService.load({ balanceOnly: true }).catch(() => undefined);
    const storedTicket = this.matchingStoredTicket(parking);
    if (storedTicket && storedTicket.ticketId === input.ticketId) this.ticketStore.clearByPlate(parking.plate);
    return true;
  }

  private matchingStoredTicket(parking: ActiveParking) {
    const stored = this.ticketStore.getByPlate(parking.plate);
    return stored?.contractId === parking.contractId && stored?.sectorId === parking.sectorId ? stored : undefined;
  }

  private unparkingTicketId(parking: ActiveParking): number | undefined {
    // Like the APK, use the selected operation, never another parking for this plate.
    const tariffId = parking.tariffId;
    if (typeof tariffId === 'number' && Number.isInteger(tariffId) && tariffId > 0) return tariffId;
    const fallback = this.matchingStoredTicket(parking)?.ticketId;
    return typeof fallback === 'number' && Number.isInteger(fallback) && fallback > 0 ? fallback : undefined;
  }

  isVehicleParked(vehicleIdOrPlate: string): boolean {
    return this.operationsService.isVehicleParked(vehicleIdOrPlate) || this.operationsService.isPlateParked(vehicleIdOrPlate);
  }

  getByVehicle(vehicleIdOrPlate: string): ActiveParking | undefined {
    return this.activeParkings().find((parking) => parking.vehicleId === vehicleIdOrPlate || parking.plate === vehicleIdOrPlate);
  }

  async loadParkingStatuses(vehicles: readonly { id: string; plate: string }[], contractId?: number): Promise<void> {
    await this.operationsService.loadParkingStatuses(vehicles, contractId);
  }
}

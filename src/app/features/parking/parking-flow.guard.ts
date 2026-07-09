import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { ParkingFlowStore } from './parking-flow.store';

type ParkingFlowStep = 'location' | 'ticket' | 'time' | 'confirm' | 'success';

function loadRouteQuery(route: ActivatedRouteSnapshot, store: ParkingFlowStore): void {
  if (!route.queryParamMap.keys.length) return;
  const params = Object.fromEntries(route.queryParamMap.keys.map((key) => [key, route.queryParamMap.get(key) ?? '']));
  store.update({
    city: params['city'] ?? '',
    cityId: params['cityId'] ?? '',
    cityName: params['cityName'] ?? '',
    plate: params['plate'] ?? '',
    vehicleId: params['vehicleId'] ?? '',
    zoneId: params['zoneId'] ?? '',
    zoneName: params['zone'] ?? '',
    sectorColor: params['sectorColor'] ?? '',
    street: params['street'] ?? '',
    sectorId: params['sectorId'] ?? '',
    sectorName: params['sector'] ?? '',
    ticketId: params['ticketId'] ?? '',
    ticketName: params['ticketName'] ?? '',
    latitude: params['latitude'] ?? '',
    longitude: params['longitude'] ?? '',
    tariffId: params['tariffId'] ?? '',
    tariffName: params['tariff'] ?? '',
    tariffPrice: params['tariffPrice'] ?? '',
    duration: params['duration'] ?? '',
    minutes: params['minutes'] ?? '',
    amount: params['amount'] ?? '',
    endTime: params['endTime'] ?? '',
  });
}

function isAllowed(step: ParkingFlowStep, store: ParkingFlowStore): boolean {
  switch (step) {
    case 'location':
      return true;
    case 'ticket':
      return store.hasLocationData();
    case 'time':
      return store.hasLocationData() && store.hasTicketData();
    case 'confirm':
      return store.canConfirm();
    case 'success':
      return store.canConfirm();
  }
}

function makeGuard(step: ParkingFlowStep): CanActivateFn {
  return (route) => {
    const store = inject(ParkingFlowStore);
    const router = inject(Router);
    loadRouteQuery(route, store);

    if (isAllowed(step, store)) return true;
    return router.createUrlTree(['/app/parking'], { queryParams: { flowError: 'missingData' } });
  };
}

export const canAccessParkingLocationStep = makeGuard('location');
export const canAccessParkingTicketStep = makeGuard('ticket');
export const canAccessParkingTimeStep = makeGuard('time');
export const canAccessParkingConfirmStep = makeGuard('confirm');
export const canAccessParkingSuccessStep = makeGuard('success');

export interface ParkingFlowQuery extends Record<string, string | undefined> {
  city: string;
  cityName: string;
  cityId: string;
  plate: string;
  vehicleId: string;
  zoneId: string;
  zone: string;
  street: string;
  streetId: string;
  sector: string;
  sectorColor: string;
  sectorId: string;
  ticketId: string;
  latitude: string;
  longitude: string;
  tariffId: string;
  tariffType: string;
  tariff: string;
  tariffPrice: string;
  duration: string;
  minutes: string;
  amount: string;
  endTime: string;
  paymentWalletAmount?: string;
  paymentCardAmount?: string;
  paymentCardId?: string;
  paymentCardLabel?: string;
}

export function readParkingFlowQuery(route: import('@angular/router').ActivatedRoute): ParkingFlowQuery {
  const queryParamMap = route.snapshot.queryParamMap;
  if (!queryParamMap) return {} as ParkingFlowQuery;
  const keys = queryParamMap.keys ?? [];
  return Object.fromEntries(keys.map((key) => [key, queryParamMap.get(key) ?? ''])) as ParkingFlowQuery;
}

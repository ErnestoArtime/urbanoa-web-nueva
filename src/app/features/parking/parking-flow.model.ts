export interface ParkingFlowQuery extends Record<string, string> {
  city: string;
  cityName: string;
  cityId: string;
  plate: string;
  zoneId: string;
  zone: string;
  street: string;
  sector: string;
  sectorColor: string;
  sectorId: string;
  ticketId: string;
  latitude: string;
  longitude: string;
  tariffId: string;
  tariff: string;
  tariffPrice: string;
  duration: string;
  minutes: string;
  amount: string;
  endTime: string;
}

export function readParkingFlowQuery(route: import('@angular/router').ActivatedRoute): ParkingFlowQuery {
  return Object.fromEntries(route.snapshot.queryParamMap.keys.map(key => [key, route.snapshot.queryParamMap.get(key) ?? ''])) as ParkingFlowQuery;
}

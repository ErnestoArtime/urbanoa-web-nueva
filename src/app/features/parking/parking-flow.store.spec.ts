import { ParkingFlowStore } from './parking-flow.store';

describe('ParkingFlowStore', () => {
  it('keeps the location and clears vehicle-dependent selections when the vehicle changes', () => {
    const store = new ParkingFlowStore();
    store.update({
      cityId: '3',
      cityName: 'Zarautz',
      zoneId: '10002',
      zoneName: 'Z2 Azul',
      street: 'Z_2_AZUL_03',
      streetId: '2401',
      sectorId: '22002',
      vehicleId: '1234567',
      plate: '1234567',
      ticketId: '4',
      tariffId: '4',
      tariffType: '6',
      tariffName: 'Rotación',
      tariffPrice: '0 € - 20,00 €',
      duration: '1 h',
      minutes: '60',
      amount: '1,50 €',
      endTime: '20:27',
    });

    store.selectVehicle('56789AB', '56789AB');

    expect(store.fromStore()).toEqual(
      jasmine.objectContaining({
        cityId: '3',
        zoneId: '10002',
        streetId: '2401',
        vehicleId: '56789AB',
        plate: '56789AB',
        ticketId: '',
        tariffId: '',
        tariffType: '',
        tariff: '',
        tariffPrice: '',
        duration: '',
        minutes: '',
        amount: '',
        endTime: '',
      }),
    );
  });

  it('only allows confirmation after the quoted tariff type has been stored', () => {
    const store = new ParkingFlowStore();
    store.update({
      cityId: '3',
      plate: '1234567',
      zoneId: '10002',
      sectorId: '22002',
      tariffId: '10',
      minutes: '85',
      amount: '2,03 €',
    });

    expect(store.canConfirm()).toBeFalse();

    store.update({ tariffType: '4' });

    expect(store.canConfirm()).toBeTrue();
  });
});

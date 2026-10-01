import { ParkingTicketStoreService } from './parking-ticket-store.service';

describe('ParkingTicketStoreService account isolation', () => {
  it('never restores legacy tickets or accepts tickets without an authenticated scope', () => {
    localStorage.setItem('urbanoa.parking.active-tickets', JSON.stringify({ ABC: { ticketId: 99 } }));
    try {
      const store = new ParkingTicketStoreService();
      store.save({ plate: 'ABC', ticketId: 10 });
      expect(store.getByPlate('ABC')).toBeUndefined();
      store.setUserScope('first@example.com');
      expect(store.getByPlate('ABC')).toBeUndefined();
    } finally {
      localStorage.removeItem('urbanoa.parking.active-tickets');
    }
  });

  it('drops tickets on logout and account changes, even for the same plate', () => {
    const store = new ParkingTicketStoreService();
    store.setUserScope('first@example.com');
    store.save({ plate: '1234 ABC', ticketId: 10 });
    expect(store.getByPlate('1234abc')?.ticketId).toBe(10);
    store.setUserScope('second@example.com');
    expect(store.getByPlate('1234 ABC')).toBeUndefined();
    store.save({ plate: '1234 ABC', ticketId: 20 });
    store.setUserScope();
    store.setUserScope('second@example.com');
    expect(store.getByPlate('1234 ABC')).toBeUndefined();
  });
});

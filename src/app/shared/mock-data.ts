export interface Vehicle {
  id: string;
  plate: string;
  isDefault: boolean;
  label?: string;
}

export interface Operation {
  id: string;
  type: 'parking' | 'extend' | 'unpark' | 'top-up' | 'refund' | 'fine';
  title: string;
  date: string;
  amount: string;
  status?: string;
}

export interface TicketActive {
  plate: string;
  zone: string;
  timeRemaining: string;
  endTime: string;
}

export const MOCK_USER = {
  name: 'Juan',
  surname: 'García',
  email: 'juan@ejemplo.com',
  nif: '12345678A',
  phone: '+34 600 000 000',
  balance: 12.5,
};

export const MOCK_VEHICLES: Vehicle[] = [
  { id: '1', plate: '1234 ABC', isDefault: true, label: 'Coche principal' },
  { id: '2', plate: '5678 XYZ', isDefault: false },
];

export const MOCK_OPERATIONS: Operation[] = [
  { id: '1', type: 'parking', title: 'Aparcamiento — Zona Azul', date: '16/06/2026 14:30', amount: '-1,20 €' },
  { id: '2', type: 'top-up', title: 'Recarga monedero', date: '15/06/2026 10:00', amount: '+20,00 €' },
  { id: '3', type: 'extend', title: 'Ampliación aparcamiento', date: '14/06/2026 18:45', amount: '-0,60 €' },
  { id: '4', type: 'unpark', title: 'Desaparcar — devolución', date: '13/06/2026 12:00', amount: '+0,40 €' },
  { id: '5', type: 'fine', title: 'Pago multa', date: '10/06/2026 09:15', amount: '-35,00 €' },
];

export const MOCK_TICKET_ACTIVE: TicketActive = {
  plate: '1234 ABC',
  zone: 'Zona Azul — Bilbao Centro',
  timeRemaining: '01:24:35',
  endTime: '16:55',
};

export const MOCK_STREETS = [
  'Gran Vía, 12',
  'Gran Vía, 45',
  'Alameda de Urquijo, 3',
  'Ercilla, 8',
];

export const MOCK_TARIFFS = [
  { id: '1', name: 'Rotación', desc: 'Estacionamiento regulado', price: '0,60 €/h' },
  { id: '2', name: 'Residentes Z. NO OTA', desc: 'Tarifa residentes', price: '0,30 €/h' },
];

export const MOCK_CITIES = ['Bilbao', 'Getxo', 'Barakaldo', 'Portugalete'];

export const MOCK_UNPAID_FINES = [
  { id: '1', plate: '1234 ABC', date: '05/06/2026', amount: '35,00 €', location: 'Gran Vía' },
  { id: '2', plate: '1234 ABC', date: '28/05/2026', amount: '20,00 €', location: 'Ercilla' },
];

export const NAV_ITEMS = [
  { path: '/app/home', label: 'Inicio', icon: 'home' },
  { path: '/app/parking', label: 'Aparcar', icon: 'parking' },
  { path: '/app/operations', label: 'Operaciones', icon: 'operations' },
  { path: '/app/account', label: 'Mi cuenta', icon: 'account' },
] as const;

export const ACCOUNT_MENU = [
  { path: '/app/account/profile', label: 'Mi perfil', icon: '👤' },
  { path: '/app/account/vehicles', label: 'Vehículos', icon: '🚗' },
  { path: '/app/account/payment-methods', label: 'Métodos de pago', icon: '💳' },
  { path: '/app/account/notifications', label: 'Notificaciones', icon: '🔔' },
  { path: '/app/account/settings', label: 'Ajustes', icon: '⚙️' },
  { path: '/app/account/tax-data', label: 'Datos fiscales', icon: '📋' },
  { path: '/app/account/support', label: 'Ayuda y soporte', icon: '❓' },
  { path: '/app/account/about', label: 'Sobre ArinPark', icon: 'ℹ️' },
];

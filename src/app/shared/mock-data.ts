import { OperationType } from './models/operation-type';
import type { Operation } from './models/operation';

export interface Vehicle {
  id: string;
  plate: string;
  isDefault: boolean;
  label?: string;
}

export interface TicketActive {
  operationId: string;
  plate: string;
  zone: string;
  startTime: string;
  durationLabel: string;
  timeRemaining: string;
  endTime: string;
  latitude?: number;
  longitude?: number;
  street?: string;
}

export interface Municipio {
  id: string;
  nombre: string;
  provincia: string;
  zonas: number;
  imagen: string;
}

export interface Street {
  nombre: string;
  zona: string;
  tarifa: string;
}

export interface Wallet {
  balance: number;
  mainCard: {
    brand: string;
    last4: string;
    expiryDate: string;
    cardholderName: string;
  };
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

export const MOCK_VEHICLE_PRINCIPAL = {
  id: '1',
  plate: '1234 ABC',
  isDefault: true,
  label: 'Coche principal',
};

export const MOCK_WALLET: Wallet = {
  balance: 12.5,
  mainCard: {
    brand: 'Visa',
    last4: '1234',
    expiryDate: '12/28',
    cardholderName: 'Juan García',
  },
};

export const MOCK_OPERATIONS: Operation[] = [
  { id: '1', type: OperationType.PARKING, plate: '1234 ABC', date: '16/06/2026', amount: -1.2, zone: 'Zona Azul — Centro' },
  { id: '2', type: OperationType.PARKING_EXTENSION, plate: '1234 ABC', date: '15/06/2026', amount: -0.6, zone: 'Zona Azul — Centro' },
  { id: '3', type: OperationType.REFUND, plate: '5678 DEF', date: '14/06/2026', amount: 3.5, zone: 'Zona Verde — Ensanche' },
  { id: '4', type: OperationType.FINE_PAYMENT, plate: '1234 ABC', date: '10/06/2026', amount: -35.0, zone: 'Gran Vía' },
  { id: '5', type: OperationType.TOP_UP, plate: null, date: '08/06/2026', amount: 20.0, zone: null },
  { id: '6', type: OperationType.PARKING_END, plate: '1234 ABC', date: '01/06/2026', amount: 0.4, zone: 'Zona Azul — Centro' },
];

export const MOCK_TICKET_ACTIVE: TicketActive = {
  operationId: '8430548',
  plate: '1234 ABC',
  zone: 'Zona Azul — Zarautz Centro',
  startTime: '18:36',
  durationLabel: '1h 4min',
  timeRemaining: '01:24:35',
  endTime: '16:55',
  latitude: 43.2854,
  longitude: -2.1746,
  street: 'Nagusia Kalea',
};

export const MOCK_MUNICIPIOS: Municipio[] = [
  { id: 'durango', nombre: 'Durango', provincia: 'Bizkaia', zonas: 3, imagen: 'durango.jpg' },
  { id: 'zarautz', nombre: 'Zarautz', provincia: 'Gipuzkoa', zonas: 3, imagen: 'zarautz.jpg' },
  { id: 'tolosa', nombre: 'Tolosa', provincia: 'Gipuzkoa', zonas: 2, imagen: 'tolosa.jpg' },
  { id: 'bergara', nombre: 'Bergara', provincia: 'Gipuzkoa', zonas: 3, imagen: 'bergara.jpg' },
  { id: 'arrasate', nombre: 'Arrasate', provincia: 'Gipuzkoa', zonas: 3, imagen: 'arrasate.jpg' },
  { id: 'soria', nombre: 'Soria', provincia: 'Soria', zonas: 5, imagen: 'soria.jpg' },
  { id: 'deba', nombre: 'Deba', provincia: 'Gipuzkoa', zonas: 1, imagen: 'deba.jpg' },
  { id: 'mutriku', nombre: 'Mutriku', provincia: 'Gipuzkoa', zonas: 2, imagen: 'mutriku.jpg' },
];

export const MOCK_STREETS_ZARAUTZ: Street[] = [
  { nombre: 'AITZA KALEA', zona: 'Z2 AZUL', tarifa: '' },
  { nombre: 'ARABA KALEA', zona: 'Z2 ALTA ROTACION', tarifa: '' },
  { nombre: 'ARPANTZADI KALEA', zona: 'Z2 RESIDENTES', tarifa: '' },
  { nombre: 'AROTZ KALEA', zona: 'Z2 AZUL', tarifa: '' },
  { nombre: 'ASTI BIDEA', zona: 'Z2 RESIDENTES', tarifa: '' },
  { nombre: 'AXULAR KALEA', zona: 'Z2 RESIDENTES', tarifa: '' },
  { nombre: 'AZKEN KALEA', zona: 'Z2 RESIDENTES', tarifa: '' },
  { nombre: 'BARANDIARAN KALEA', zona: 'Z2 RESIDENTES', tarifa: '' },
  { nombre: 'BARATZALDE KALEA', zona: 'Z1 RESIDENTES', tarifa: '' },
  { nombre: 'BIZKAIA KALEA', zona: 'Z1 ALTA ROTACION', tarifa: '' },
];

export const MOCK_STREETS = MOCK_STREETS_ZARAUTZ.map((s) => s.nombre);

export const MOCK_TARIFFS = [
  {
    id: '1',
    name: 'Rotación',
    desc: 'Estacionamiento regulado',
    price: '0,60 €/h',
    schedule: 'Lun-Sáb 09:00-20:00',
    maxTime: '120',
    minAmount: '0,60',
    ticketBehavior: 'NORMAL',
    showTakeTicketButton: true,
  },
  {
    id: '2',
    name: 'Residentes Z. NO OTA',
    desc: 'Tarifa residentes',
    price: '0,30 €/h',
    schedule: 'Lun-Dom 00:00-23:59',
    maxTime: '240',
    minAmount: '0,30',
    ticketBehavior: 'RESIDENT',
    showTakeTicketButton: false,
  },
];

export const MOCK_CITIES = MOCK_MUNICIPIOS.map((m) => m.nombre);

export const MOCK_UNPAID_FINES = [
  { id: '1', plate: '1234 ABC', date: '05/06/2026', amount: '35,00 €', location: 'Nagusia Kalea' },
  { id: '2', plate: '1234 ABC', date: '28/05/2026', amount: '20,00 €', location: 'Nafarroa Kalea' },
];

export const NAV_ITEMS = [
  { path: '/app/home', labelKey: 'nav.home', icon: 'home' },
  { path: '/app/parking', labelKey: 'nav.park', icon: 'directions_car' },
  { path: '/app/operations', labelKey: 'nav.operations', icon: 'operations' },
  { path: '/app/account', labelKey: 'nav.account', icon: 'account' },
] as const;

export const ACCOUNT_MENU = [
  {
    key: 'profile',
    path: '/app/account/profile',
    labelKey: 'account.menu.profile',
    icon: 'profile',
    groupKey: 'account.menu.group.myAccount',
  },
  {
    key: 'tax-data',
    path: '/app/account/tax-data',
    labelKey: 'account.menu.taxData',
    icon: 'tax',
    groupKey: 'account.menu.group.myAccount',
  },
  {
    key: 'change-password',
    path: '/app/account/change-password',
    labelKey: 'account.menu.changePassword',
    icon: 'lock',
    groupKey: 'account.menu.group.myAccount',
  },
  {
    key: 'payment-methods',
    path: '/app/account/payment-methods',
    labelKey: 'account.menu.paymentMethods',
    icon: 'payment',
    groupKey: 'account.menu.group.myAccount',
  },
  {
    key: 'vehicles',
    path: '/app/account/vehicles',
    labelKey: 'account.menu.vehicles',
    icon: 'vehicle',
    groupKey: 'account.menu.group.myAccount',
  },
  {
    key: 'notifications',
    path: '/app/account/notifications',
    labelKey: 'account.menu.notifications',
    icon: 'notifications',
    groupKey: 'account.menu.group.myAccount',
  },
  {
    key: 'settings',
    path: '/app/account/settings',
    labelKey: 'account.menu.settings',
    icon: 'settings',
    groupKey: 'account.menu.group.other',
  },
  { key: 'help', path: '/app/account/help', labelKey: 'account.menu.help', icon: 'help', groupKey: 'account.menu.group.other' },
  // { key: 'share', path: '/app/account/share', labelKey: 'account.menu.share', icon: 'share', groupKey: 'account.menu.group.other' },
  // { key: 'review', path: '/app/account/review', labelKey: 'account.menu.review', icon: 'review', groupKey: 'account.menu.group.other' },
  {
    key: 'terms-and-conditions',
    path: '/app/account/terms-and-conditions',
    labelKey: 'account.menu.terms',
    icon: 'terms',
    groupKey: 'account.menu.group.other',
  },
  {
    key: 'privacy-policy',
    path: '/app/account/privacy-policy',
    labelKey: 'account.menu.privacy',
    icon: 'privacy',
    groupKey: 'account.menu.group.other',
  },
  { key: 'about', path: '/app/account/about', labelKey: 'account.menu.about', icon: 'about', groupKey: 'account.menu.group.other' },
  { key: 'support', path: '/app/account/support', labelKey: 'account.menu.support', icon: 'support', groupKey: 'account.menu.group.other' },
];

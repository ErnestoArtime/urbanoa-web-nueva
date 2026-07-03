import { OperationType } from './models/operation-type';
import type { Operation } from './models/operation';

export interface Vehicle {
  id: string;
  plate: string;
  isDefault: boolean;
  label?: string;
}

export interface TicketActive {
  plate: string;
  zone: string;
  timeRemaining: string;
  endTime: string;
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
  balance: 12.50,
  mainCard: {
    brand: 'Visa',
    last4: '1234',
    expiryDate: '12/28',
    cardholderName: 'Juan García',
  },
};

export const MOCK_OPERATIONS: Operation[] = [
  { id: '1',  type: OperationType.PARKING,          plate: '1234 ABC', date: '16/06/2026', amount: -1.20,  zone: 'Zona Azul — Centro' },
  { id: '2',  type: OperationType.TOP_UP,           plate: null,       date: '15/06/2026', amount: 20.00,  zone: null },
  { id: '3',  type: OperationType.PARKING_EXTENSION, plate: '1234 ABC', date: '14/06/2026', amount: -0.60,  zone: 'Zona Azul — Centro' },
  { id: '4',  type: OperationType.FINE_PAYMENT,      plate: '1234 ABC', date: '10/06/2026', amount: -35.00, zone: 'Gran Vía' },
  { id: '5',  type: OperationType.REFUND,            plate: '5678 DEF', date: '08/06/2026', amount: 3.50,   zone: 'Zona Verde — Ensanche' },
  { id: '6',  type: OperationType.BALANCE_REFUND,    plate: null,       date: '01/06/2026', amount: 5.00,   zone: null },
  { id: '7',  type: OperationType.UNPAID_FINES,      plate: '1234 ABC', date: '28/05/2026', amount: -20.00, zone: 'Ercilla' },
];

export const MOCK_TICKET_ACTIVE: TicketActive = {
  plate: '1234 ABC',
  zone: 'Zona Azul — Zarautz Centro',
  timeRemaining: '01:24:35',
  endTime: '16:55',
};

export const MOCK_MUNICIPIOS: Municipio[] = [
  { id: 'durango',  nombre: 'Durango',  provincia: 'Bizkaia',    zonas: 3, imagen: 'durango.jpg' },
  { id: 'zarautz',  nombre: 'Zarautz',  provincia: 'Gipuzkoa',   zonas: 4, imagen: 'zarautz.jpg' },
  { id: 'tolosa',   nombre: 'Tolosa',   provincia: 'Gipuzkoa',   zonas: 2, imagen: 'tolosa.jpg' },
  { id: 'bergara',  nombre: 'Bergara',  provincia: 'Gipuzkoa',   zonas: 3, imagen: 'bergara.jpg' },
  { id: 'arrasate', nombre: 'Arrasate', provincia: 'Gipuzkoa',   zonas: 3, imagen: 'arrasate.jpg' },
  { id: 'soria',    nombre: 'Soria',    provincia: 'Soria',      zonas: 5, imagen: 'soria.jpg' },
  { id: 'deba',     nombre: 'Deba',     provincia: 'Gipuzkoa',   zonas: 1, imagen: 'deba.jpg' },
  { id: 'mutriku',  nombre: 'Mutriku',  provincia: 'Gipuzkoa',   zonas: 2, imagen: 'mutriku.jpg' },
];

export const MOCK_STREETS_ZARAUTZ: Street[] = [
  { nombre: 'Nagusia Kalea',       zona: 'Casco histórico', tarifa: '0,60 €/h' },
  { nombre: 'Nafarroa Kalea',      zona: 'Centro',          tarifa: '0,60 €/h' },
  { nombre: 'Zigordia Kalea',      zona: 'Casco histórico', tarifa: '0,60 €/h' },
  { nombre: 'Azara Kalea',         zona: 'Casco histórico', tarifa: '0,50 €/h' },
  { nombre: 'Mendilauta Kalea',    zona: 'Mendilauta',      tarifa: '0,40 €/h' },
  { nombre: 'Santa Marina Kalea',  zona: 'Centro',          tarifa: '0,60 €/h' },
  { nombre: 'Gipuzkoa Kalea',      zona: 'Centro',          tarifa: '0,60 €/h' },
  { nombre: 'Lapurdi Kalea',       zona: 'Centro',          tarifa: '0,60 €/h' },
  { nombre: 'Itsas Pasealekua',    zona: 'Playa',           tarifa: '0,70 €/h' },
  { nombre: 'Salbide Kalea',       zona: 'Salbide',         tarifa: '0,30 €/h' },
];

export const MOCK_STREETS = MOCK_STREETS_ZARAUTZ.map(s => s.nombre);

export const MOCK_TARIFFS = [
  { id: '1', name: 'Rotación', desc: 'Estacionamiento regulado', price: '0,60 €/h', schedule: 'Lun-Sáb 09:00-20:00', maxTime: '120', minAmount: '0,60', ticketBehavior: 'NORMAL', showTakeTicketButton: true },
  { id: '2', name: 'Residentes Z. NO OTA', desc: 'Tarifa residentes', price: '0,30 €/h', schedule: 'Lun-Dom 00:00-23:59', maxTime: '240', minAmount: '0,30', ticketBehavior: 'RESIDENT', showTakeTicketButton: false },
];

export const MOCK_CITIES = MOCK_MUNICIPIOS.map(m => m.nombre);

export const MOCK_UNPAID_FINES = [
  { id: '1', plate: '1234 ABC', date: '05/06/2026', amount: '35,00 €', location: 'Nagusia Kalea' },
  { id: '2', plate: '1234 ABC', date: '28/05/2026', amount: '20,00 €', location: 'Nafarroa Kalea' },
];

export const NAV_ITEMS = [
  { path: '/app/home', label: 'Inicio', icon: 'home' },
  { path: '/app/parking', label: 'Aparcar', icon: 'parking' },
  { path: '/app/operations', label: 'Operaciones', icon: 'operations' },
  { path: '/app/account', label: 'Mi cuenta', icon: 'account' },
] as const;

export const ACCOUNT_MENU = [
  { key: 'profile', path: '/app/account/profile', label: 'Mi perfil', icon: 'profile', group: 'Mi cuenta' },
  { key: 'tax-data', path: '/app/account/tax-data', label: 'Datos fiscales', icon: 'tax', group: 'Mi cuenta' },
  { key: 'change-password', path: '/app/account/change-password', label: 'Cambiar contraseña', icon: 'lock', group: 'Mi cuenta' },
  { key: 'payment-methods', path: '/app/account/payment-methods', label: 'Métodos de pago', icon: 'payment', group: 'Mi cuenta' },
  { key: 'vehicles', path: '/app/account/vehicles', label: 'Vehículos', icon: 'vehicle', group: 'Mi cuenta' },
  { key: 'notifications', path: '/app/account/notifications', label: 'Notificaciones', icon: 'notifications', group: 'Mi cuenta' },
  { key: 'settings', path: '/app/account/settings', label: 'Ajustes', icon: 'settings', group: 'Otros' },
  { key: 'help', path: '/app/account/help', label: 'Ayuda', icon: 'help', group: 'Otros' },
  { key: 'share', path: '/app/account/share', label: 'Compartir app', icon: 'share', group: 'Otros' },
  { key: 'review', path: '/app/account/review', label: 'Valorar app', icon: 'review', group: 'Otros' },
  { key: 'terms-and-conditions', path: '/app/account/terms-and-conditions', label: 'Términos y condiciones', icon: 'terms', group: 'Otros' },
  { key: 'privacy-policy', path: '/app/account/privacy-policy', label: 'Política de privacidad', icon: 'privacy', group: 'Otros' },
  { key: 'about', path: '/app/account/about', label: 'Sobre ArinPark', icon: 'about', group: 'Otros' },
  { key: 'support', path: '/app/account/support', label: 'Soporte', icon: 'support', group: 'Otros' },
];

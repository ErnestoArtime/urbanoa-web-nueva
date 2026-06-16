import { Routes } from '@angular/router';

export const PARKING_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./map/map.component').then(m => m.ParkingMapComponent) },
  { path: 'cities', loadComponent: () => import('./cities/cities.component').then(m => m.ParkingCitiesComponent) },
  { path: 'city-info', loadComponent: () => import('./city-info/city-info.component').then(m => m.ParkingCityInfoComponent) },
  { path: 'streets', loadComponent: () => import('./streets/streets.component').then(m => m.ParkingStreetsComponent) },
  { path: 'tickets', loadComponent: () => import('./tickets/tickets.component').then(m => m.ParkingTicketsComponent) },
  { path: 'ticket', loadComponent: () => import('./ticket-detail/ticket-detail.component').then(m => m.ParkingTicketDetailComponent) },
  { path: 'time-steps', loadComponent: () => import('./time-steps/time-steps.component').then(m => m.ParkingTimeStepsComponent) },
  { path: 'confirm', loadComponent: () => import('./confirm/confirm.component').then(m => m.ParkingConfirmComponent) },
  { path: 'success', loadComponent: () => import('./success/success.component').then(m => m.ParkingSuccessComponent) },
];

import { Routes } from '@angular/router';
import {
  canAccessParkingConfirmStep,
  canAccessParkingSuccessStep,
  canAccessParkingTicketStep,
  canAccessParkingTimeStep,
} from './parking-flow.guard';

export const PARKING_ROUTES: Routes = [
  {
    path: '',
    title: 'parking.title',
    loadComponent: () => import('./parking-wizard-layout/parking-wizard-layout.component').then((m) => m.ParkingWizardLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'parking.title',
        loadComponent: () => import('./map/map.component').then((m) => m.ParkingMapComponent),
      },
      {
        path: 'cities',
        title: 'parking.selectMunicipio',
        loadComponent: () => import('./cities/cities.component').then((m) => m.ParkingCitiesComponent),
      },
      {
        path: 'city-info',
        title: 'parking.map.municipioInfo',
        loadComponent: () => import('./city-info/city-info.component').then((m) => m.ParkingCityInfoComponent),
      },
      {
        path: 'streets',
        title: 'parking.cities.streetsTitle',
        loadComponent: () => import('./streets/streets.component').then((m) => m.ParkingStreetsComponent),
      },
      {
        path: 'tickets',
        title: 'parking.tickets.title',
        canActivate: [canAccessParkingTicketStep],
        loadComponent: () => import('./tickets/tickets.component').then((m) => m.ParkingTicketsComponent),
      },
      {
        path: 'ticket',
        title: 'parking.ticketDetail.title',
        canActivate: [canAccessParkingTicketStep],
        loadComponent: () => import('./ticket-detail/ticket-detail.component').then((m) => m.ParkingTicketDetailComponent),
      },
      {
        path: 'time-steps',
        title: 'parking.timeSteps.title',
        canActivate: [canAccessParkingTimeStep],
        loadComponent: () => import('./time-steps/time-steps.component').then((m) => m.ParkingTimeStepsComponent),
      },
      {
        path: 'confirm',
        title: 'parking.confirm.title',
        canActivate: [canAccessParkingConfirmStep],
        loadComponent: () => import('./confirm/confirm.component').then((m) => m.ParkingConfirmComponent),
      },
      {
        path: 'success',
        title: 'parking.success.title',
        canActivate: [canAccessParkingSuccessStep],
        loadComponent: () => import('./success/success.component').then((m) => m.ParkingSuccessComponent),
      },
    ],
  },
];

import { Injectable, signal } from '@angular/core';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private breadcrumbs = signal<BreadcrumbItem[]>([]);
  readonly breadcrumbs$ = this.breadcrumbs.asReadonly();

  set(breadcrumbs: BreadcrumbItem[]): void {
    this.breadcrumbs.set(breadcrumbs);
  }

  clear(): void {
    this.breadcrumbs.set([]);
  }

  setFromUrl(url: string): void {
    const cleanUrl = url.split(/[?#]/, 1)[0];
    const parts = cleanUrl.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [];
    let acc = '';

    for (const part of parts) {
      acc += '/' + part;
      const label = this.labelForSegment(part);
      items.push({ label, path: acc });
    }

    if (items.length > 0) {
      items[items.length - 1].path = undefined;
    }

    this.breadcrumbs.set(items);
  }

  private labelForSegment(segment: string): string {
    const map: Record<string, string> = {
      'app': 'ArinPark',
      'home': 'Inicio',
      'parking': 'Aparcar',
      'cities': 'Municipios',
      'city-info': 'Información',
      'streets': 'Calles',
      'tickets': 'Tarifas',
      'time-steps': 'Duración',
      'confirm': 'Confirmar',
      'success': 'Éxito',
      'operations': 'Operaciones',
      'detail': 'Detalle',
      'unpaid-fines': 'Denuncias',
      'unpaid-fine-detail': 'Detalle denuncia',
      'report': 'Informe',
      'report-success': 'Informe generado',
      'account': 'Mi cuenta',
      'profile': 'Perfil',
      'vehicles': 'Vehículos',
      'add': 'Añadir',
      'edit': 'Editar',
      'payment-methods': 'Métodos de pago',
      'recharge': 'Recargar',
      'refund': 'Retirar',
      'settings': 'Ajustes',
      'notifications': 'Notificaciones',
      'change-password': 'Cambiar contraseña',
      'tax-data': 'Datos fiscales',
      'support': 'Soporte',
      'support-success': 'Mensaje enviado',
      'about': 'Sobre ArinPark',
    };
    return map[segment] ?? segment;
  }
}

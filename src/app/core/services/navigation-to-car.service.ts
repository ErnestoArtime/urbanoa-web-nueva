import { Injectable } from '@angular/core';

export interface CarNavigationTarget {
  latitude?: number;
  longitude?: number;
  label?: string;
}

@Injectable({ providedIn: 'root' })
export class NavigationToCarService {
  open(target: CarNavigationTarget): boolean {
    if (!this.hasValidCoordinates(target)) {
      return false;
    }

    const lat = target.latitude!;
    const lng = target.longitude!;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;

    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }

  private hasValidCoordinates(target: CarNavigationTarget): boolean {
    return (
      typeof target.latitude === 'number' &&
      typeof target.longitude === 'number' &&
      Number.isFinite(target.latitude) &&
      Number.isFinite(target.longitude)
    );
  }
}

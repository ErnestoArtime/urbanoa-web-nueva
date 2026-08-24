import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, effect, input } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-location-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <div #mapContainer class="location-map" [attr.aria-label]="label()"></div> `,
  styles: `
    :host {
      display: block;
      overflow: hidden;
      border-radius: 22px;
      background: #dce7dc;
    }

    .location-map {
      width: 100%;
      height: 210px;
    }

    :host ::ng-deep .operation-location-pin {
      display: block;
      position: relative;
      width: 28px;
      height: 28px;
      border: 4px solid #fff;
      border-radius: 50% 50% 50% 0;
      background: #c84536;
      box-shadow: 0 2px 7px rgb(0 0 0 / 35%);
      transform: rotate(-45deg);
    }

    :host ::ng-deep .operation-location-pin::after {
      position: absolute;
      top: 7px;
      left: 7px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #fff;
      content: '';
    }

    @media (max-width: 600px) {
      .location-map {
        height: 180px;
      }
    }
  `,
})
export class LocationMap implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) private readonly mapContainer!: ElementRef<HTMLElement>;

  readonly latitude = input.required<number>();
  readonly longitude = input.required<number>();
  readonly label = input('Ubicación de la operación');

  private map?: L.Map;
  private marker?: L.Marker;
  private resizeObserver?: ResizeObserver;

  constructor() {
    effect(() => {
      const coordinates: L.LatLngTuple = [this.latitude(), this.longitude()];
      if (!this.map) return;
      this.map.setView(coordinates, 15);
      this.marker?.setLatLng(coordinates);
    });
  }

  ngAfterViewInit(): void {
    const coordinates: L.LatLngTuple = [this.latitude(), this.longitude()];
    this.map = L.map(this.mapContainer.nativeElement, {
      attributionControl: true,
      scrollWheelZoom: false,
      zoomControl: true,
    }).setView(coordinates, 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);
    this.marker = L.marker(coordinates, {
      icon: L.divIcon({ className: '', html: '<span class="operation-location-pin"></span>', iconSize: [36, 42], iconAnchor: [18, 39] }),
      keyboard: false,
      title: this.label(),
    }).addTo(this.map);
    this.resizeObserver = new ResizeObserver(() => this.map?.invalidateSize({ animate: false }));
    this.resizeObserver.observe(this.mapContainer.nativeElement);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.map?.remove();
  }
}

import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, effect, inject, input } from '@angular/core';
import * as L from 'leaflet';
import { GoogleMapsLoaderService } from '../../../core/services/google-maps-loader.service';
import { createGoogleMapStyle } from '../../maps/google-map-style';

@Component({
  selector: 'app-location-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <div #mapContainer class="location-map" [attr.aria-label]="label()"></div> `,
  styleUrl: './location-map.css',
})
export class LocationMap implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) private readonly mapContainer!: ElementRef<HTMLElement>;

  readonly latitude = input.required<number>();
  readonly longitude = input.required<number>();
  readonly label = input.required<string>();

  private readonly googleMapsLoader = inject(GoogleMapsLoaderService);
  private leafletMap?: L.Map;
  private leafletMarker?: L.Marker;
  private googleMap?: google.maps.Map;
  private googleMarker?: google.maps.Marker;
  private resizeObserver?: ResizeObserver;
  private destroyed = false;

  constructor() {
    effect(() => {
      const coordinates: L.LatLngTuple = [this.latitude(), this.longitude()];
      this.leafletMap?.setView(coordinates, 15);
      this.leafletMarker?.setLatLng(coordinates);
      const googleCoordinates = { lat: coordinates[0], lng: coordinates[1] };
      this.googleMap?.setCenter(googleCoordinates);
      this.googleMarker?.setPosition(googleCoordinates);
    });
  }

  async ngAfterViewInit(): Promise<void> {
    const googleMaps = await this.googleMapsLoader.load();
    if (this.destroyed) return;
    if (googleMaps) this.initializeGoogleMap(googleMaps);
    else this.initializeLeafletMap();
    this.resizeObserver = new ResizeObserver(() => this.resizeMap());
    this.resizeObserver.observe(this.mapContainer.nativeElement);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.resizeObserver?.disconnect();
    this.leafletMap?.remove();
    if (this.googleMap) google.maps.event.clearInstanceListeners(this.googleMap);
    this.googleMarker?.setMap(null);
  }

  private initializeLeafletMap(): void {
    const coordinates: L.LatLngTuple = [this.latitude(), this.longitude()];
    this.leafletMap = L.map(this.mapContainer.nativeElement, {
      attributionControl: true,
      scrollWheelZoom: false,
      zoomControl: true,
    }).setView(coordinates, 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.leafletMap);
    this.leafletMarker = L.marker(coordinates, {
      icon: L.divIcon({ className: '', html: '<span class="operation-location-pin"></span>', iconSize: [36, 42], iconAnchor: [18, 39] }),
      keyboard: false,
      title: this.label(),
    }).addTo(this.leafletMap);
  }

  private initializeGoogleMap(googleMaps: typeof google.maps): void {
    const coordinates = { lat: this.latitude(), lng: this.longitude() };
    this.googleMap = new googleMaps.Map(this.mapContainer.nativeElement, {
      center: coordinates,
      zoom: 15,
      styles: createGoogleMapStyle(),
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      scrollwheel: false,
    });
    this.googleMarker = new googleMaps.Marker({
      map: this.googleMap,
      position: coordinates,
      title: this.label(),
    });
  }

  private resizeMap(): void {
    this.leafletMap?.invalidateSize({ animate: false });
    if (this.googleMap) google.maps.event.trigger(this.googleMap, 'resize');
  }
}

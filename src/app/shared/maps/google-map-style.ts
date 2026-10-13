import { readDesignToken } from '../styles/design-token';

/** Equivalent to the map_style_silver.json bundled in the Android APK. */
const stylePath = (...segments: string[]): string => segments.join('.');

export function createGoogleMapStyle(): google.maps.MapTypeStyle[] {
  return [
    { elementType: 'geometry', stylers: [{ color: readDesignToken('--color-map-base') }] },
    { elementType: stylePath('labels', 'icon'), stylers: [{ visibility: 'off' }] },
    { elementType: stylePath('labels', 'text', 'fill'), stylers: [{ color: readDesignToken('--color-map-label') }] },
    { elementType: stylePath('labels', 'text', 'stroke'), stylers: [{ color: readDesignToken('--color-map-base') }] },
    {
      featureType: stylePath('administrative', 'land_parcel'),
      elementType: stylePath('labels', 'text', 'fill'),
      stylers: [{ color: readDesignToken('--color-map-boundary') }],
    },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: readDesignToken('--color-map-poi') }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: readDesignToken('--color-on-primary') }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: readDesignToken('--color-map-water') }] },
    {
      featureType: 'water',
      elementType: stylePath('labels', 'text', 'fill'),
      stylers: [{ color: readDesignToken('--color-map-water-label') }],
    },
  ];
}

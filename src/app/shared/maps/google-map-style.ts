/** Equivalent to the map_style_silver.json bundled in the Android APK. */
const stylePath = (...segments: string[]): string => segments.join('.');

export const URBANOA_GOOGLE_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: stylePath('labels', 'icon'), stylers: [{ visibility: 'off' }] },
  { elementType: stylePath('labels', 'text', 'fill'), stylers: [{ color: '#616161' }] },
  { elementType: stylePath('labels', 'text', 'stroke'), stylers: [{ color: '#f5f5f5' }] },
  {
    featureType: stylePath('administrative', 'land_parcel'),
    elementType: stylePath('labels', 'text', 'fill'),
    stylers: [{ color: '#bdbdbd' }],
  },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#e9e9e9' }] },
  {
    featureType: 'water',
    elementType: stylePath('labels', 'text', 'fill'),
    stylers: [{ color: '#9e9e9e' }],
  },
];

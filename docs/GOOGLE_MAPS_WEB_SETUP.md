# Configuración de Google Maps en Urbanoa Web

## Estado actual

La web utiliza Leaflet con las teselas de OpenStreetMap cuando no existe una
clave de Google Maps configurada. Este es el comportamiento predeterminado y
permite que los mapas sigan funcionando sin credenciales de Google.

La integración de Google Maps ya está implementada para:

- El mapa principal del flujo de aparcamiento.
- Los mapas de ubicación mostrados en los detalles de operaciones y multas.

Cuando se configura una clave válida, ambos mapas cargan Google Maps y aplican
el estilo `silver` equivalente al incluido en la APK. Si el script de Google no
puede descargarse, la aplicación vuelve automáticamente a Leaflet.

## Requisitos de Google Cloud

Antes de activar el proveedor se necesita:

1. Un proyecto de Google Cloud con facturación habilitada.
2. La API **Maps JavaScript API** habilitada.
3. Una API key creada específicamente para la aplicación web.
4. Una restricción de aplicación de tipo **Sitios web** con los referentes HTTP
   autorizados, por ejemplo:
   - `https://dominio-produccion.example/*`
   - `https://dominio-pruebas.example/*`
   - `http://localhost:10213/*` para desarrollo local, si se considera necesario.
5. Una restricción de API que permita únicamente **Maps JavaScript API**.

No debe utilizarse la clave extraída o configurada en la APK. Las claves de
Android se restringen mediante nombre de paquete y certificado, mientras que
la clave web debe restringirse mediante los dominios autorizados.

## Configuración en el proyecto

La propiedad está declarada inicialmente vacía para mantener activo Leaflet:

```ts
googleMapsApiKey: '',
```

Para desarrollo, se configura en:

```text
src/environments/environment.development.ts
```

Para una compilación de producción, se configura en:

```text
src/environments/environment.ts
```

El valor debe sustituirse por la clave web suministrada:

```ts
googleMapsApiKey: 'CLAVE_WEB_SUMINISTRADA',
```

En producción se recomienda que el pipeline de despliegue realice esta
sustitución y que la clave real no se almacene en el repositorio. Aunque una
clave utilizada por JavaScript será visible para el navegador, las
restricciones de dominio y API evitan que pueda utilizarse libremente desde
otros sitios.

## Verificación

Después de configurar la clave:

1. Ejecutar `npm run build` para verificar la compilación.
2. Iniciar el entorno correspondiente.
3. Comprobar el mapa principal de aparcamiento y confirmar que muestra la
   cartografía de Google con las zonas KML superpuestas.
4. Abrir una operación o multa con coordenadas y comprobar su mapa de detalle.
5. Revisar la consola del navegador para descartar errores de autorización,
   facturación o restricciones de referentes.

Para comprobar el fallback, se deja nuevamente `googleMapsApiKey: ''`. Al
recargar la aplicación deben mostrarse los mapas actuales de
Leaflet/OpenStreetMap.

## Criterio de activación

- Clave vacía: Leaflet y OpenStreetMap.
- Clave configurada y SDK cargado: Google Maps con el estilo de la APK.
- Error de descarga del SDK: fallback automático a Leaflet y OpenStreetMap.

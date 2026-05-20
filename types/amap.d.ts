declare global {
  interface AMapLocation {
    lng: number;
    lat: number;
  }

  interface AMapGeocodeResult {
    geocodes: Array<{ location: AMapLocation }>;
  }

  interface AMapMap {
    setCenter(center: [number, number]): void;
  }

  interface AMapMarker {
    getPosition(): unknown;
    on(event: "click", handler: () => void): void;
  }

  interface AMapInfoWindow {
    open(map: AMapMap, position: unknown): void;
  }

  interface AMapGeocoder {
    getLocation(
      cityName: string,
      callback: (status: string, result: AMapGeocodeResult) => void
    ): void;
  }

  interface AMapConstructor {
    Map: new (
      container: HTMLDivElement,
      options: { zoom: number; center: [number, number]; mapStyle: string }
    ) => AMapMap;
    Marker: new (options: {
      position: [number, number];
      title: string;
      map: AMapMap;
    }) => AMapMarker;
    Geocoder: new (options: { city: string }) => AMapGeocoder;
    InfoWindow: new (options: { content: string; offset: unknown }) => AMapInfoWindow;
    Pixel: new (x: number, y: number) => unknown;
  }

  interface Window {
    AMap: AMapConstructor;
  }
}

export {};

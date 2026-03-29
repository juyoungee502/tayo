export {};

declare global {
  interface Window {
    kakao?: KakaoGlobal;
  }
}

interface KakaoGlobal {
  maps: {
    load(callback: () => void): void;
    LatLng: new (lat: number, lng: number) => unknown;
    Map: new (container: HTMLElement, options: { center: unknown; level: number }) => unknown;
    Marker: new (options: { position: unknown }) => { setMap(map: unknown): void };
    services: {
      Status: {
        OK: string;
        ZERO_RESULT: string;
        ERROR: string;
      };
      Places: new () => {
        keywordSearch(
          keyword: string,
          callback: (data: KakaoPlaceResult[], status: string) => void,
        ): void;
      };
    };
  };
}

interface KakaoPlaceResult {
  id: string;
  address_name: string;
  place_name: string;
  place_url: string;
  road_address_name: string;
  x: string;
  y: string;
}

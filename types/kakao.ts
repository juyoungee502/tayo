export type KakaoSearchResult = {
  id: string;
  address_name: string;
  place_name: string;
  place_url: string;
  road_address_name: string;
  x: string;
  y: string;
};

export type KakaoSdkGlobal = {
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
          callback: (data: KakaoSearchResult[], status: string) => void,
        ): void;
      };
    };
  };
};

declare global {
  interface Window {
    kakao?: KakaoSdkGlobal;
  }
}

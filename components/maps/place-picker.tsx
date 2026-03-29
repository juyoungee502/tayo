"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Notice } from "@/components/ui/notice";
import { DEFAULT_DESTINATION } from "@/lib/constants";
import { useKakaoSdk } from "@/lib/kakao/use-kakao-sdk";
import { cn } from "@/lib/utils";

type PlaceSearchResult = {
  id: string;
  address_name: string;
  place_name: string;
  place_url: string;
  road_address_name: string;
  x: string;
  y: string;
};

type PlacePickerProps = {
  label: string;
  description: string;
  namePrefix: "departure" | "destination";
  defaultPlaceName?: string;
  defaultDetail?: string;
  defaultLat?: number | null;
  defaultLng?: number | null;
  searchPlaceholder: string;
  showDetailInput?: boolean;
  detailLabel?: string;
};

export function PlacePicker({
  label,
  description,
  namePrefix,
  defaultPlaceName = "",
  defaultDetail = "",
  defaultLat = null,
  defaultLng = null,
  searchPlaceholder,
  showDetailInput = false,
  detailLabel = "상세 위치",
}: PlacePickerProps) {
  const sdkState = useKakaoSdk();
  const [query, setQuery] = useState(defaultPlaceName);
  const [placeName, setPlaceName] = useState(defaultPlaceName);
  const [detail, setDetail] = useState(defaultDetail);
  const [lat, setLat] = useState(defaultLat ? String(defaultLat) : "");
  const [lng, setLng] = useState(defaultLng ? String(defaultLng) : "");
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [searchMessage, setSearchMessage] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);

  const selectedCoords = useMemo(() => {
    if (!lat || !lng) {
      return null;
    }

    const parsedLat = Number(lat);
    const parsedLng = Number(lng);

    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
      return null;
    }

    return {
      lat: parsedLat,
      lng: parsedLng,
    };
  }, [lat, lng]);

  const previewCoords = useMemo(() => {
    if (selectedCoords) {
      return selectedCoords;
    }

    if (Number.isFinite(defaultLat) && Number.isFinite(defaultLng)) {
      return {
        lat: Number(defaultLat),
        lng: Number(defaultLng),
      };
    }

    return {
      lat: DEFAULT_DESTINATION.lat,
      lng: DEFAULT_DESTINATION.lng,
    };
  }, [defaultLat, defaultLng, selectedCoords]);

  useEffect(() => {
    if (sdkState.status !== "ready" || !mapRef.current) {
      return;
    }

    const center = new sdkState.kakao.maps.LatLng(previewCoords.lat, previewCoords.lng);
    const map = new sdkState.kakao.maps.Map(mapRef.current, {
      center,
      level: 4,
    });
    const marker = new sdkState.kakao.maps.Marker({ position: center });
    marker.setMap(map);
  }, [previewCoords, sdkState]);

  const handleSearch = () => {
    if (sdkState.status !== "ready") {
      setSearchMessage("카카오 검색이 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    if (!query.trim()) {
      setSearchMessage("검색어를 입력해주세요.");
      setResults([]);
      return;
    }

    setIsSearching(true);
    setSearchMessage("");
    const places = new sdkState.kakao.maps.services.Places();
    places.keywordSearch(query.trim(), (data: PlaceSearchResult[], status: string) => {
      setIsSearching(false);

      if (status === sdkState.kakao.maps.services.Status.OK) {
        setResults(data);
        if (data.length === 0) {
          setSearchMessage("검색 결과가 없습니다. 아래 수동 입력을 이용해주세요.");
        }
        return;
      }

      if (status === sdkState.kakao.maps.services.Status.ZERO_RESULT) {
        setResults([]);
        setSearchMessage("검색 결과가 없습니다. 아래 수동 입력을 이용해주세요.");
        return;
      }

      setResults([]);
      setSearchMessage("카카오 검색에 실패했습니다. 수동 입력으로 계속 진행할 수 있습니다.");
    });
  };

  return (
    <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="space-y-1">
        <label className="block text-sm font-semibold text-slateBlue">{label}</label>
        <p className="text-xs leading-5 text-slate-500">{description}</p>
      </div>

      {sdkState.status === "ready" ? (
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSearch();
                }
              }}
              placeholder={searchPlaceholder}
              className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-200 transition focus:ring"
            />
            <button
              type="button"
              onClick={handleSearch}
              className="rounded-2xl bg-slateBlue px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0d2f4d]"
            >
              {isSearching ? "검색 중" : "검색"}
            </button>
          </div>

          {searchMessage ? <Notice variant="info">{searchMessage}</Notice> : null}

          {results.length > 0 ? (
            <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-2">
              {results.slice(0, 5).map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => {
                    setPlaceName(result.place_name);
                    setQuery(result.place_name);
                    setLat(result.y);
                    setLng(result.x);
                    setResults([]);
                    setSearchMessage("장소를 선택했습니다. 필요하면 아래에서 이름을 수정할 수 있습니다.");
                  }}
                  className="w-full rounded-2xl px-3 py-3 text-left transition hover:bg-slate-50"
                >
                  <p className="text-sm font-semibold text-slateBlue">{result.place_name}</p>
                  <p className="text-xs text-slate-500">{result.road_address_name || result.address_name}</p>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : sdkState.status === "error" ? (
        <Notice variant="warning">
          <div className="space-y-2">
            <p>{sdkState.message}</p>
            <p className="text-xs">
              현재 접속 주소와 Kakao Developers 플랫폼의 Web 도메인이 정확히 일치해야 합니다.
              {typeof window !== "undefined" ? ` 현재 주소: ${window.location.origin}` : ""}
            </p>
          </div>
        </Notice>
      ) : (
        <Notice variant="info">카카오 장소 검색을 준비 중입니다. 바로 아래 수동 입력으로도 진행할 수 있습니다.</Notice>
      )}

      <div className="space-y-3">
        <input
          name={`${namePrefix}PlaceName`}
          value={placeName}
          onChange={(event) => {
            setPlaceName(event.target.value);
            setLat("");
            setLng("");
            setResults([]);
          }}
          placeholder="장소명을 직접 입력할 수 있습니다"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-200 transition focus:ring"
        />
        <input type="hidden" name={`${namePrefix}Lat`} value={lat} />
        <input type="hidden" name={`${namePrefix}Lng`} value={lng} />

        {showDetailInput ? (
          <input
            name={`${namePrefix}Detail`}
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            placeholder={detailLabel}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-200 transition focus:ring"
          />
        ) : null}
      </div>

      {sdkState.status === "ready" ? (
        <div className="space-y-2">
          <div className="flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {selectedCoords
                ? "선택된 좌표가 저장됩니다."
                : "아직 좌표를 선택하지 않았습니다. 기본 위치를 미리 보여드리고 있어요."}
            </span>
            <span>
              {previewCoords.lat.toFixed(4)}, {previewCoords.lng.toFixed(4)}
            </span>
          </div>
          <div ref={mapRef} className={cn("h-44 w-full rounded-3xl border border-slate-200 bg-slate-100")} />
        </div>
      ) : null}
    </div>
  );
}

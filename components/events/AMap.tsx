"use client";

import { useEffect, useRef } from "react";
import AMapLoader from "@amap/amap-jsapi-loader";

interface AMapProps {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  city?: string;
  title?: string;
}

export function AMap({
  latitude,
  longitude,
  address,
  city,
  title,
}: AMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      try {
        const AMap = await AMapLoader.load({
          key: process.env.NEXT_PUBLIC_AMAP_KEY || "257501275a6867c79f1bb06e03f456a6",
          version: "2.0",
          plugins: ["AMap.Geocoder"],
        });

        if (!isMounted || !mapContainer.current) return;

        if (!map.current) {
          map.current = new AMap.Map(mapContainer.current, {
            zoom: 13,
            center: [116.397428, 39.90923], // Default Beijing
            mapStyle: "amap://styles/light",
          });
        } else {
          map.current.clearMap();
        }

        const addMarker = (lng: number, lat: number) => {
          const marker = new AMap.Marker({
            position: [lng, lat],
            title: title || address || "活动地点",
            map: map.current,
          });

          const escapeHtml = (str: string) =>
            str
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");

          const infoWindow = new AMap.InfoWindow({
            content: `<div style="padding: 8px;">
              <div style="font-weight: bold;">${escapeHtml(title || "活动地点")}</div>
              ${address ? `<div style="font-size: 12px; color: #666;">${escapeHtml(address)}</div>` : ""}
            </div>`,
            offset: new AMap.Pixel(0, -30),
          });

          marker.on("click", () => {
            if (map.current) {
              infoWindow.open(map.current, marker.getPosition());
            }
          });
        };

        const geocodeCity = (cityName: string) => {
          const geocoder = new AMap.Geocoder({ city: cityName });
          geocoder.getLocation(cityName, (status: string, result: any) => {
            if (status === "complete" && result.geocodes.length > 0) {
              const { location } = result.geocodes[0];
              map.current?.setCenter([location.lng, location.lat]);
              addMarker(location.lng, location.lat);
            }
          });
        };

        if (latitude && longitude) {
          map.current.setCenter([longitude, latitude]);
          addMarker(longitude, latitude);
        } else if (city) {
          geocodeCity(city);
        }

      } catch (err) {
        console.error("Failed to load AMap", err);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (map.current) {
        map.current.destroy();
        map.current = null;
      }
    };
  }, [address, city, latitude, longitude, title]);

  return (
    <div
      ref={mapContainer}
      style={{
        width: "100%",
        height: "400px",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    />
  );
}

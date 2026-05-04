"use client";

import { useEffect, useRef } from "react";

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
    // 如果没有坐标，使用城市名称定位
    if (!mapContainer.current) return;

    // 动态加载高德地图API
    const script = document.createElement("script");
    script.src =
      "https://webapi.amap.com/maps?v=2.0&key=257501275a6867c79f1bb06e03f456a6&plugin=AMap.Geocoder";
    script.async = true;
    script.onload = () => {
      initMap();
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const initMap = () => {
    if (!window.AMap || !mapContainer.current) return;

    // 创建地图实例
    map.current = new window.AMap.Map(mapContainer.current, {
      zoom: 13,
      center: [116.397428, 39.90923], // 默认北京
      mapStyle: "amap://styles/light",
    });

    // 如果有坐标，使用坐标定位
    if (latitude && longitude) {
      map.current.setCenter([longitude, latitude]);
      addMarker(longitude, latitude);
    } else if (city) {
      // 否则使用城市名称定位
      geocodeCity(city);
    }
  };

  const geocodeCity = (cityName: string) => {
    if (!window.AMap) return;

    const geocoder = new window.AMap.Geocoder({
      city: cityName,
    });

    geocoder.getLocation(cityName, (status: string, result: any) => {
      if (status === "complete" && result.geocodes.length > 0) {
        const { location } = result.geocodes[0];
        map.current.setCenter([location.lng, location.lat]);
        addMarker(location.lng, location.lat);
      }
    });
  };

  const addMarker = (lng: number, lat: number) => {
    if (!window.AMap || !map.current) return;

    const marker = new window.AMap.Marker({
      position: [lng, lat],
      title: title || address || "活动地点",
      map: map.current,
    });

    // 添加信息窗口
    const infoWindow = new window.AMap.InfoWindow({
      content: `<div style="padding: 8px;">
        <div style="font-weight: bold;">${title || "活动地点"}</div>
        ${address ? `<div style="font-size: 12px; color: #666;">${address}</div>` : ""}
      </div>`,
      offset: new window.AMap.Pixel(0, -30),
    });

    marker.on("click", () => {
      infoWindow.open(map.current, marker.getPosition());
    });
  };

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

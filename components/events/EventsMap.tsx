import { useEffect, useRef } from "react";
import AMapLoader from "@amap/amap-jsapi-loader";
import { EVENT_TYPE_COLORS } from "@/lib/constants";

interface MapEvent {
  id: string;
  title: string;
  type: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  date: Date | string;
  priceAmount: number;
  maxAttendees: number;
  _count: { attendances: number };
}

interface EventsMapProps {
  events: MapEvent[];
  defaultCity?: string;
}

export function EventsMap({ events, defaultCity = "Shanghai" }: EventsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;
    let markers: any[] = [];
    let infoWindow: any = null;

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
            zoom: 12,
            mapStyle: "amap://styles/light",
          });
        }

        // InfoWindow for clicking on markers
        if (!infoWindow) {
          infoWindow = new AMap.InfoWindow({
            offset: new AMap.Pixel(0, -35),
            isCustom: false,
            autoMove: true,
          });
        }

        // Clear existing markers
        map.current.clearMap();
        markers = [];

        const escapeHtml = (str: string) =>
          str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        let hasValidCoordinates = false;

        events.forEach((event) => {
          let lng = event.longitude;
          let lat = event.latitude;
          const isMystery = event.type === "POOL" || (!lng && !lat);

          const renderMarker = (mLat: number, mLng: number, isMyst: boolean) => {
            const colors = EVENT_TYPE_COLORS[event.type] || EVENT_TYPE_COLORS["其他"];
            
            // Custom marker HTML
            const markerContent = document.createElement("div");
            markerContent.className = `flex h-10 w-10 items-center justify-center rounded-full shadow-lg border-2 border-white ${isMyst ? "bg-[#FFF0F3] text-[#FF2442]" : colors.bg + " " + colors.text}`;
            markerContent.innerHTML = isMyst ? "❓" : colors.icon;
            
            markerContent.style.cursor = "pointer";
            markerContent.style.transition = "transform 0.2s";
            markerContent.onmouseover = () => { markerContent.style.transform = "scale(1.1)"; };
            markerContent.onmouseout = () => { markerContent.style.transform = "scale(1)"; };

            const marker = new AMap.Marker({
              position: [mLng, mLat],
              content: markerContent,
              extData: event,
            });

            marker.on("click", () => {
              const dateStr = new Intl.DateTimeFormat("zh-CN", {
                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
              }).format(new Date(event.date));
              
              const infoHtml = `
                <div style="padding: 12px; min-width: 220px; font-family: sans-serif;">
                  <div style="font-size: 12px; color: #ff2442; font-weight: bold; margin-bottom: 4px;">
                    ${event.type === "POOL" ? "盲盒聚餐" : event.type}
                  </div>
                  <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: #2D2420;">
                    ${escapeHtml(event.title)}
                  </div>
                  <div style="font-size: 13px; color: #666; margin-bottom: 4px;">📅 ${dateStr}</div>
                  <div style="font-size: 13px; color: #666; margin-bottom: 12px;">📍 ${isMyst ? "市中心 (地点活动前揭晓)" : escapeHtml(event.address || event.city)}</div>
                  <a href="/events/${event.id}" 
                     style="display: block; text-align: center; background: #FF2442; color: white; padding: 8px 0; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">
                    查看详情
                  </a>
                </div>
              `;
              infoWindow.setContent(infoHtml);
              infoWindow.open(map.current, marker.getPosition());
            });

            markers.push(marker);
            map.current.add(marker);
          };

          if (isMystery) {
            // Put mystery events near city center
            const geocoder = new AMap.Geocoder({ city: event.city });
            geocoder.getLocation(event.city, (status: string, result: any) => {
              if (status === "complete" && result.geocodes.length > 0) {
                const { location } = result.geocodes[0];
                // Add some slight random offset to prevent overlap
                const offsetLng = location.lng + (Math.random() - 0.5) * 0.05;
                const offsetLat = location.lat + (Math.random() - 0.5) * 0.05;
                renderMarker(offsetLat, offsetLng, true);
                if (!hasValidCoordinates) {
                  map.current.setCenter([location.lng, location.lat]);
                  hasValidCoordinates = true;
                }
              }
            });
          } else {
            renderMarker(lat as number, lng as number, false);
            hasValidCoordinates = true;
          }
        });

        if (events.length > 0) {
          // If all events are mystery, we wait for geocoder async callback to center map.
          // For events with coordinates, we can fitView if there are multiple.
          setTimeout(() => {
            if (markers.length > 1) {
              map.current.setFitView(markers, false, [50, 50, 50, 50]);
            } else if (markers.length === 1) {
              map.current.setCenter(markers[0].getPosition());
              map.current.setZoom(14);
            }
          }, 500); // Small delay to wait for geocoders
        } else {
          // Center to default city
          const geocoder = new AMap.Geocoder({ city: defaultCity });
          geocoder.getLocation(defaultCity, (status: string, result: any) => {
            if (status === "complete" && result.geocodes.length > 0) {
              const { location } = result.geocodes[0];
              map.current.setCenter([location.lng, location.lat]);
            }
          });
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
  }, [events, defaultCity]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-full min-h-[500px] rounded-2xl overflow-hidden border border-[#F0E4E0] shadow-sm bg-[#FFFFAF8]/20"
    />
  );
}

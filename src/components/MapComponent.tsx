import { useEffect, useRef } from "react";
import { Complaint } from "../firebase";

declare const L: any;

interface MapComponentProps {
  complaints: Complaint[];
  selectedComplaintId?: string;
  onSelectComplaint?: (complaint: Complaint) => void;
  center?: [number, number];
  zoom?: number;
  interactive?: boolean;
}

export default function MapComponent({
  complaints,
  selectedComplaintId,
  onSelectComplaint,
  center = [12.9716, 77.5946], // Default City center (e.g. Bangalore)
  zoom = 13,
  interactive = true
}: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});

  useEffect(() => {
    // If Leaflet is not loaded yet, retry shortly
    if (typeof L === "undefined" || !mapContainerRef.current) return;

    // Clean up existing map instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize map
    const map = L.map(mapContainerRef.current).setView(center, zoom);
    mapInstanceRef.current = map;

    // Add high-quality OpenStreetMap tiles
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20
    }).addTo(map);

    // Track markers to manage them easily
    markersRef.current = {};

    // Create markers for complaints
    complaints.forEach((c) => {
      const { lat, lng, address } = c.location;
      if (!lat || !lng) return;

      // Color based on Severity
      let markerColor = "#22c55e"; // Green for Low
      if (c.severity === "High") {
        markerColor = "#ef4444"; // Red
      } else if (c.severity === "Medium") {
        markerColor = "#f97316"; // Orange
      }

      // Leaflet custom div icon for a clean, professional modern Pin
      const customIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center w-8 h-8 rounded-full shadow-lg border-2 border-white transition-transform hover:scale-110" style="background-color: ${markerColor}">
            <span class="text-white text-xs font-bold font-mono">📍</span>
            <div class="absolute -bottom-1 w-2 h-2 rotate-45 border-r border-b border-white" style="background-color: ${markerColor}"></div>
          </div>
        `,
        className: "custom-leaflet-pin",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });

      // Create marker
      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
      markersRef.current[c.id] = marker;

      // Formatted Popup content
      const popupHtml = `
        <div class="p-2 font-sans min-w-[200px]">
          <div class="flex items-center gap-1.5 mb-1">
            <span class="inline-block w-2.5 h-2.5 rounded-full" style="background-color: ${markerColor}"></span>
            <span class="text-[10px] uppercase font-bold tracking-wider text-slate-500">${c.severity} Severity</span>
          </div>
          <h4 class="font-semibold text-xs text-slate-900 mb-1">${c.title}</h4>
          <p class="text-[11px] text-slate-500 line-clamp-2 mb-1.5">${c.description}</p>
          <div class="text-[10px] text-slate-400 flex items-center gap-1">
            <span>📁 ${c.category}</span>
            <span>•</span>
            <span class="font-mono text-[9px] px-1 py-0.5 rounded bg-slate-100">${c.status}</span>
          </div>
          ${interactive ? `<div class="mt-2 text-[10px] text-indigo-600 font-semibold cursor-pointer text-center border-t border-slate-100 pt-1.5 select-view-btn">Click to View Details →</div>` : ""}
        </div>
      `;

      marker.bindPopup(popupHtml);

      // Add click handler to marker
      marker.on("click", () => {
        if (onSelectComplaint) {
          onSelectComplaint(c);
        }
      });
    });

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [complaints]);

  // Handle zooming to selected complaint marker
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedComplaintId || !markersRef.current[selectedComplaintId]) return;

    const complaint = complaints.find(c => c.id === selectedComplaintId);
    if (complaint && complaint.location.lat && complaint.location.lng) {
      mapInstanceRef.current.setView([complaint.location.lat, complaint.location.lng], 16, {
        animate: true,
        duration: 1
      });
      markersRef.current[selectedComplaintId].openPopup();
    }
  }, [selectedComplaintId, complaints]);

  return (
    <div className="relative w-full h-full min-h-[300px] bg-slate-100 rounded-xl overflow-hidden shadow-sm border border-slate-200">
      <div ref={mapContainerRef} className="w-full h-full min-h-[300px]" id="leaflet-hotspots-map"></div>
      
      {/* Dynamic Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-2.5 rounded-lg shadow-md border border-slate-100 z-[1000] text-xs">
        <h5 className="font-semibold text-slate-800 mb-1.5 text-[11px] uppercase tracking-wider font-display">Hotspot Severity</h5>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
            <span className="text-slate-600 font-medium">High Severity (Red)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
            <span className="text-slate-600 font-medium">Medium Severity (Orange)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span>
            <span className="text-slate-600 font-medium">Low Severity (Green)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

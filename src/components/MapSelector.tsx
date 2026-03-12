import React, { useCallback, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

interface MapSelectorProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

const containerStyle = {
  width: '100%',
  height: '100%',
};

// Utilizar API Key desde variable de entorno
const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
const placesLibrary: "places"[] = ["places"];

export const MapSelector: React.FC<MapSelectorProps> = ({ lat, lng, onChange }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleMapsApiKey,
    libraries: placesLibrary,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [markerPosition, setMarkerPosition] = useState({ lat, lng });

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(function callback(map: google.maps.Map) {
    mapRef.current = null;
  }, []);

  // Sync external props changes to internal marker state
  React.useEffect(() => {
    setMarkerPosition({ lat, lng });
    if (mapRef.current) {
        mapRef.current.panTo({ lat, lng });
    }
  }, [lat, lng]);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      setMarkerPosition({ lat: newLat, lng: newLng });
      onChange(newLat, newLng);
    }
  };

  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
          const newLat = e.latLng.lat();
          const newLng = e.latLng.lng();
          setMarkerPosition({ lat: newLat, lng: newLng });
          onChange(newLat, newLng);
      }
  };

  if (!isLoaded) return <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Cargando Mapa...</div>;

  return (
    <div style={{ height: '300px', width: '100%', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={markerPosition}
        zoom={14}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
        options={{
          disableDefaultUI: false,
          streetViewControl: false,
          mapTypeControl: false,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            {
              featureType: "administrative.locality",
              elementType: "labels.text.fill",
              stylers: [{ color: "#d59563" }],
            },
            {
              featureType: "poi",
              elementType: "labels.text.fill",
              stylers: [{ color: "#d59563" }],
            },
            {
              featureType: "poi.park",
              elementType: "geometry",
              stylers: [{ color: "#263c3f" }],
            },
            {
              featureType: "poi.park",
              elementType: "labels.text.fill",
              stylers: [{ color: "#6b9a76" }],
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#38414e" }],
            },
            {
              featureType: "road",
              elementType: "geometry.stroke",
              stylers: [{ color: "#212a37" }],
            },
            {
              featureType: "road",
              elementType: "labels.text.fill",
              stylers: [{ color: "#9ca5b3" }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry",
              stylers: [{ color: "#746855" }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry.stroke",
              stylers: [{ color: "#1f2835" }],
            },
            {
              featureType: "road.highway",
              elementType: "labels.text.fill",
              stylers: [{ color: "#f3d19c" }],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#17263c" }],
            },
            {
              featureType: "water",
              elementType: "labels.text.fill",
              stylers: [{ color: "#515c6d" }],
            },
            {
              featureType: "water",
              elementType: "labels.text.stroke",
              stylers: [{ color: "#17263c" }],
            },
          ]
        }}
      >
        <Marker 
          position={markerPosition} 
          draggable={true} 
          onDragEnd={handleMarkerDragEnd}
        />
      </GoogleMap>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';

interface Location {
  lat: number;
  lng: number;
  name: string;
}

interface MapViewProps {
  pickup?: Location;
  destination?: Location;
  onDistanceCalculated?: (distance: string, duration: string) => void;
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyC8hnZJCkKTiA3gOu4GDZT2-kfOdsRvhSY'; // 🔒 You can move to .env if needed

const MapView: React.FC<MapViewProps> = ({ pickup, destination, onDistanceCalculated }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const pickupMarkerRef = useRef<google.maps.Marker | null>(null);
  const destinationMarkerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    const initializeMap = async () => {
      if (!window.google) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.onload = () => {
          createMap();
        };
        document.head.appendChild(script);
      } else {
        createMap();
      }
    };

    const createMap = () => {
      if (!mapRef.current) return;

      const map = new google.maps.Map(mapRef.current, {
        zoom: 13,
        center: { lat: 28.6139, lng: 77.209 }, // New Delhi
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      mapInstanceRef.current = map;
      directionsServiceRef.current = new google.maps.DirectionsService();
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#4F46E5',
          strokeWeight: 5,
        },
      });
      directionsRendererRef.current.setMap(map);
      setIsLoaded(true);
    };

    initializeMap();
  }, []);

  // Place markers
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return;

    const createMarker = (location: Location, iconColor: string) => {
      return new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: mapInstanceRef.current!,
        title: location.name,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="${iconColor}">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5
                c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5
                2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          `)}`,
          scaledSize: new google.maps.Size(32, 32),
        },
      });
    };

    // Clear existing markers
    pickupMarkerRef.current?.setMap(null);
    destinationMarkerRef.current?.setMap(null);

    if (pickup) {
      pickupMarkerRef.current = createMarker(pickup, '#10B981'); // green
    }

    if (destination) {
      destinationMarkerRef.current = createMarker(destination, '#EF4444'); // red
    }

    // Fit bounds if both present
    if (pickup && destination) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: pickup.lat, lng: pickup.lng });
      bounds.extend({ lat: destination.lat, lng: destination.lng });
      mapInstanceRef.current.fitBounds(bounds);
    } else if (pickup) {
      mapInstanceRef.current.panTo({ lat: pickup.lat, lng: pickup.lng });
      mapInstanceRef.current.setZoom(15);
    }

  }, [isLoaded, pickup, destination]);

  // Draw route
  useEffect(() => {
    if (!isLoaded || !pickup || !destination || !directionsServiceRef.current || !directionsRendererRef.current) {
      return;
    }

    const request: google.maps.DirectionsRequest = {
      origin: { lat: pickup.lat, lng: pickup.lng },
      destination: { lat: destination.lat, lng: destination.lng },
      travelMode: google.maps.TravelMode.DRIVING,
    };

    directionsServiceRef.current.route(request, (result, status) => {
      if (status === 'OK' && result) {
        directionsRendererRef.current?.setDirections(result);

        const leg = result.routes[0].legs[0];
        if (onDistanceCalculated && leg.distance && leg.duration) {
          onDistanceCalculated(leg.distance.text, leg.duration.text);
        }
      }
    });
  }, [isLoaded, pickup, destination, onDistanceCalculated]);

  return (
    <Card className="w-full h-64 overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />
    </Card>
  );
};

export default MapView;

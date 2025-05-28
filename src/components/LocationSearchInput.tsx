import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import RideBooking from './RideBooking';

type LocationType = 'origin' | 'destination';

interface LocationResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId: string;
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyC8hnZJCkKTiA3gOu4GDZT2-kfOdsRvhSY';

const LocationSearch: React.FC = () => {
  // Separate states for origin and destination
  const [origin, setOrigin] = useState<LocationResult | null>(null);
  const [destination, setDestination] = useState<LocationResult | null>(null);

  const [originInput, setOriginInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');

  // Track which input is active to show suggestions for that input only
  const [activeInput, setActiveInput] = useState<LocationType | null>(null);

  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [distanceInfo, setDistanceInfo] = useState('');

  const autocompleteRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);

  // Load Google Maps API & init map, services
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (!window.google) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.onload = () => initializeMap();
        document.head.appendChild(script);
      } else {
        initializeMap();
      }
    };

    const initializeMap = () => {
      if (mapRef.current) {
        mapInstance.current = new google.maps.Map(mapRef.current, {
          center: { lat: 28.6139, lng: 77.209 },
          zoom: 13,
          styles: [ /* You can add Uber-style dark theme map here if you want! */ ],
          disableDefaultUI: true,
        });

        autocompleteRef.current = new google.maps.places.AutocompleteService();
        placesServiceRef.current = new google.maps.places.PlacesService(mapInstance.current);
        directionsServiceRef.current = new google.maps.DirectionsService();
        directionsRendererRef.current = new google.maps.DirectionsRenderer({
          suppressMarkers: false,
          polylineOptions: { strokeColor: '#1E90FF', strokeWeight: 5 },
        });
        directionsRendererRef.current.setMap(mapInstance.current);
      }
    };

    loadGoogleMaps();
  }, []);

  // Handle typing in either input box
  const handleInputChange = (text: string, inputType: LocationType) => {
    if (inputType === 'origin') {
      setOriginInput(text);
    } else {
      setDestinationInput(text);
    }

    setActiveInput(inputType);

    if (!autocompleteRef.current || text.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    autocompleteRef.current.getPlacePredictions(
      { input: text },
      (predictions, status) => {
        setIsLoading(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          // Remove duplicate place_ids if any
          const uniqueIds = new Set<string>();
          const filteredPredictions = predictions.filter(p => {
            if (uniqueIds.has(p.place_id)) return false;
            uniqueIds.add(p.place_id);
            return true;
          });

          setSuggestions(
            filteredPredictions.map(pred => ({
              name: pred.structured_formatting.main_text,
              address: pred.description,
              lat: 0,
              lng: 0,
              placeId: pred.place_id,
            }))
          );
        } else {
          setSuggestions([]);
        }
      }
    );
  };

  // When user clicks a suggestion
  const handleSelectLocation = (location: LocationResult) => {
    if (!placesServiceRef.current) return;

    placesServiceRef.current.getDetails(
      { placeId: location.placeId, fields: ['geometry', 'name', 'formatted_address'] },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          const fullLocation: LocationResult = {
            ...location,
            name: place.name || location.name,
            address: place.formatted_address || location.address,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            placeId: location.placeId,
          };

          if (activeInput === 'origin') {
            setOrigin(fullLocation);
            setOriginInput(fullLocation.address);
            mapInstance.current?.panTo({ lat: fullLocation.lat, lng: fullLocation.lng });
          } else if (activeInput === 'destination') {
            setDestination(fullLocation);
            setDestinationInput(fullLocation.address);
            mapInstance.current?.panTo({ lat: fullLocation.lat, lng: fullLocation.lng });
          }

          setSuggestions([]);

          // Draw route if both are selected
          if (origin && destination) {
            drawRoute(origin, destination);
          } else if (activeInput === 'origin' && destination) {
            drawRoute(fullLocation, destination);
          } else if (activeInput === 'destination' && origin) {
            drawRoute(origin, fullLocation);
          }
        }
      }
    );
  };

  // Draw the route on map & show distance/time
  const drawRoute = (from: LocationResult, to: LocationResult) => {
    if (!directionsServiceRef.current || !directionsRendererRef.current) return;

    directionsServiceRef.current.route(
      {
        origin: { lat: from.lat, lng: from.lng },
        destination: { lat: to.lat, lng: to.lng },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRendererRef.current.setDirections(result);
          const leg = result.routes[0].legs[0];
          setDistanceInfo(`${leg.distance?.text} - ${leg.duration?.text}`);
        } else {
          setDistanceInfo('Route not found');
        }
      }
    );
  };

  return (
    <div className="w-full max-w-3xl space-y-4 p-4 bg-white rounded-xl shadow-lg">
      {/* Origin Input */}
      <div className="relative">
        <Input
          placeholder="📍 Current location"
          value={originInput}
          onFocus={() => setActiveInput('origin')}
          onChange={(e) => handleInputChange(e.target.value, 'origin')}
          className="pl-10 pr-10 py-3 text-sm rounded-xl"
          spellCheck={false}
          autoComplete="off"
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
          <MapPin className="w-5 h-5" />
        </div>
        {isLoading && activeInput === 'origin' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Destination Input */}
      <div className="relative">
        <Input
          placeholder="🎯 Destination"
          value={destinationInput}
          onFocus={() => setActiveInput('destination')}
          onChange={(e) => handleInputChange(e.target.value, 'destination')}
          className="pl-10 pr-10 py-3 text-sm rounded-xl"
          spellCheck={false}
          autoComplete="off"
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
          <MapPin className="w-5 h-5 rotate-45" />
        </div>
        {isLoading && activeInput === 'destination' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Suggestions dropdown (only for active input) */}
      {suggestions.length > 0 && activeInput && (
        <Card className="rounded-lg shadow-md divide-y max-h-60 overflow-y-auto">
          {suggestions.map((s, idx) => (
            <div
              key={idx}
              onClick={() => handleSelectLocation(s)}
              className="cursor-pointer px-4 py-2 hover:bg-gray-100 transition-all"
            >
              <p className="text-sm font-medium">{s.name}</p>
              <p className="text-xs text-gray-500">{s.address}</p>
            </div>
          ))}
        </Card>
      )}

      {/* Distance info */}
      {distanceInfo && (
        <div className="text-sm font-semibold text-primary flex items-center gap-2">
          🚗 {distanceInfo}
        </div>
      )}

      {/* Google Map */}
      <div
        ref={mapRef}
        className="w-full h-[400px] rounded-xl shadow border"
        style={{ minHeight: '400px' }}
      />
      <RideBooking />
    </div>
  );
};

export default LocationSearch;

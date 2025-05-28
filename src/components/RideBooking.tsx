import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import LocationSearchInput from './LocationSearchInput';
import MapView from './MapView';

interface RideType {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: string;
  icon: string;
  passengers: number;
  color: string;
}

interface LocationResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId: string;
}

interface RideBookingProps {
  onRideBooked: (rideData: any) => void;
}

const rideTypes: RideType[] = [
  {
    id: 'economy',
    name: 'Safar Go',
    description: 'Affordable rides for everyday trips',
    price: '$12.50',
    duration: '5 min',
    icon: '🚗',
    passengers: 4,
    color: 'from-blue-400 to-blue-600',
  },
  {
    id: 'premium',
    name: 'Safar Comfort',
    description: 'Premium cars with extra legroom',
    price: '$18.75',
    duration: '3 min',
    icon: '🚙',
    passengers: 4,
    color: 'from-purple-400 to-purple-600',
  },
  {
    id: 'luxury',
    name: 'Safar Luxury',
    description: 'High-end vehicles for special occasions',
    price: '$35.00',
    duration: '8 min',
    icon: '🚘',
    passengers: 4,
    color: 'from-yellow-400 to-orange-500',
  }
];

const RideBooking: React.FC<RideBookingProps> = ({ onRideBooked }) => {
  const [pickup, setPickup] = useState<LocationResult | null>(null);
  const [destination, setDestination] = useState<LocationResult | null>(null);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  const handlePickupSelect = (location: LocationResult) => setPickup(location);
  const handleDestinationSelect = (location: LocationResult) => setDestination(location);

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const location: LocationResult = {
          name: 'Current Location',
          address: `Current Location (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`,
          lat: coords.latitude,
          lng: coords.longitude,
          placeId: 'current',
        };
        setPickup(location);
        toast({ title: "Location access granted", description: "Your current location has been set as pickup point." });
      },
      () => {
        toast({
          title: "Location access denied",
          description: "Please enter your pickup location manually.",
          variant: "destructive",
        });
      }
    );
  };

  const handleBookRide = async (ride: RideType) => {
    if (!user) {
      toast({ title: "Authentication required", description: "Please sign in to book a ride.", variant: "destructive" });
      return;
    }

    if (!pickup || !destination) {
      toast({ title: "Missing information", description: "Please select pickup and destination.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rides')
        .insert({
          user_id: user.id,
          pickup_location: pickup.address,
          destination: destination.address,
          pickup_latitude: pickup.lat,
          pickup_longitude: pickup.lng,
          destination_latitude: destination.lat,
          destination_longitude: destination.lng,
          ride_type: ride.id,
          price: parseFloat(ride.price.replace('$', '')),
          status: 'searching'
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Ride booked!", description: "We're finding a driver for you." });
      onRideBooked({ ...data, rideType: ride, distance, duration });
    } catch (err: any) {
      toast({ title: "Error booking ride", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Location Inputs */}
      <Card className="p-6 space-y-4 backdrop-blur-sm bg-white/90">
        <h2 className="text-lg font-semibold">Where to?</h2>
        <div className="space-y-3">
          <LocationSearchInput
            placeholder="Pickup location"
            icon={<MapPin className="absolute left-3 top-3 w-5 h-5 text-green-500" />}
            value={pickup?.address || ''}
            onLocationSelect={handlePickupSelect}
            onCurrentLocation={handleCurrentLocation}
          />
          <LocationSearchInput
            placeholder="Destination"
            icon={<Navigation className="absolute left-3 top-3 w-5 h-5 text-blue-500" />}
            value={destination?.address || ''}
            onLocationSelect={handleDestinationSelect}
          />
        </div>
      </Card>

      {/* Map and Distance View */}
      {(pickup || destination) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <MapView
            pickup={pickup || undefined}
            destination={destination || undefined}
            onDistanceCalculated={(dist, dur) => {
              setDistance(dist);
              setDuration(dur);
            }}
          />
          {distance && duration && (
            <Card className="mt-2 p-3 bg-blue-50">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Distance: {distance}</span>
                <span className="font-medium">Duration: {duration}</span>
              </div>
            </Card>
          )}
        </motion.div>
      )}

      {/* Ride Options */}
      {pickup && destination && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          <h3 className="text-lg font-semibold">Choose your ride</h3>
          <div className="space-y-3">
            {rideTypes.map((ride) => (
              <motion.div key={ride.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card
                  className="p-4 cursor-pointer transition-all hover:shadow-lg border-2 hover:border-blue-200"
                  onClick={() => handleBookRide(ride)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{ride.icon}</div>
                      <div>
                        <h4 className="font-semibold">{ride.name}</h4>
                        <p className="text-sm text-gray-600">{ride.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{ride.duration} away</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{ride.price}</div>
                      <Badge variant="secondary">{ride.passengers} seats</Badge>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default RideBooking;

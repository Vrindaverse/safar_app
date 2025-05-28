
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Car, Phone, MessageCircle, Star, MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RideStatusProps {
  rideData: any;
  onRideComplete: () => void;
  onCancel: () => void;
}

const RideStatus: React.FC<RideStatusProps> = ({ rideData, onRideComplete, onCancel }) => {
  const [ride, setRide] = useState(rideData);
  const [driver] = useState({
    name: 'Ahmed Hassan',
    rating: 4.9,
    car: 'Toyota Corolla',
    licensePlate: 'ABC 123',
    photo: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=100&h=100&fit=crop&crop=face',
    eta: '3 min'
  });
  
  const { toast } = useToast();

  useEffect(() => {
    // Simulate ride status updates
    const timer = setTimeout(() => {
      if (ride.status === 'searching') {
        setRide(prev => ({ ...prev, status: 'matched' }));
        toast({
          title: "Driver found!",
          description: "Your driver is on the way.",
        });
      } else if (ride.status === 'matched') {
        setTimeout(() => {
          setRide(prev => ({ ...prev, status: 'in_progress' }));
          toast({
            title: "Driver arrived!",
            description: "Your ride is starting.",
          });
        }, 3000);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [ride.status, toast]);

  const handleCancelRide = async () => {
    try {
      const { error } = await supabase
        .from('rides')
        .update({ status: 'cancelled' })
        .eq('id', ride.id);

      if (error) throw error;

      toast({
        title: "Ride cancelled",
        description: "Your ride has been cancelled.",
      });
      
      onCancel();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to cancel ride.",
        variant: "destructive",
      });
    }
  };

  const renderStatusContent = () => {
    switch (ride.status) {
      case 'searching':
        return (
          <div className="text-center space-y-6 py-8">
            <motion.div 
              className="w-20 h-20 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity
              }}
            >
              <Car className="w-10 h-10 text-white" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Finding your ride...</h2>
              <p className="text-gray-600">We're matching you with a nearby driver</p>
            </div>
          </div>
        );

      case 'matched':
      case 'in_progress':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Badge className="bg-green-100 text-green-800 mb-4">
                {ride.status === 'matched' ? 'Driver found' : 'In progress'}
              </Badge>
              <h2 className="text-2xl font-bold mb-2">
                {ride.status === 'matched' ? 'Your driver is coming' : 'Enjoy your ride'}
              </h2>
              <p className="text-gray-600">
                {ride.status === 'matched' ? 'Track your driver in real-time' : 'You are on your way to destination'}
              </p>
            </div>

            {/* Driver Info */}
            <Card className="p-4">
              <div className="flex items-center space-x-4">
                <img
                  src={driver.photo}
                  alt={driver.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{driver.name}</h3>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{driver.rating}</span>
                  </div>
                  <p className="text-gray-600">{driver.car} • {driver.licensePlate}</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-green-600">{driver.eta}</div>
                  <p className="text-sm text-gray-600">ETA</p>
                </div>
              </div>
              
              <div className="flex space-x-2 mt-4">
                <Button size="sm" variant="outline" className="flex-1">
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </div>
            </Card>

            {/* Trip Details */}
            <Card className="p-4">
              <h4 className="font-semibold mb-3">Trip Details</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-sm text-gray-600">Pickup: {ride.pickup_location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span className="text-sm text-gray-600">Destination: {ride.destination}</span>
                </div>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {renderStatusContent()}
      
      <div className="flex space-x-3">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={handleCancelRide}
        >
          Cancel Ride
        </Button>
        {ride.status === 'in_progress' && (
          <Button 
            className="flex-1 bg-gradient-to-r from-blue-500 to-green-500"
            onClick={onRideComplete}
          >
            Complete Ride
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default RideStatus;

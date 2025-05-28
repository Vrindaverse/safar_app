
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { Car, Menu, LogOut, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import RideBooking from '@/components/RideBooking';
import RideStatus from '@/components/RideStatus';

const Index = () => {
  const [currentRide, setCurrentRide] = useState(null);
  const headerRef = useRef(null);
  
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(headerRef.current, 
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "back.out(1.7)" }
      );
    }
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
      navigate('/auth');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to sign out.",
        variant: "destructive",
      });
    }
  };

  const handleRideBooked = (rideData: any) => {
    setCurrentRide(rideData);
  };

  const handleRideComplete = () => {
    toast({
      title: "Trip completed!",
      description: "Thank you for riding with Safar.",
    });
    setCurrentRide(null);
  };

  const handleRideCancel = () => {
    setCurrentRide(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
      <div className="max-w-md mx-auto bg-white/80 backdrop-blur-sm min-h-screen shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <motion.div 
            ref={headerRef}
            className="flex items-center justify-between mb-6"
          >
            <motion.div 
              className="flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div 
                className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center"
                animate={{ 
                  boxShadow: [
                    "0 0 20px rgba(59, 130, 246, 0.5)",
                    "0 0 20px rgba(34, 197, 94, 0.5)",
                    "0 0 20px rgba(59, 130, 246, 0.5)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Car className="w-5 h-5 text-white" />
              </motion.div>
              <motion.h1 
                className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent"
              >
                Safar
              </motion.h1>
            </motion.div>
            
            <div className="flex items-center space-x-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" size="icon">
                  <UserIcon className="w-5 h-5" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                  <LogOut className="w-5 h-5" />
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Main Content */}
          <AnimatePresence mode="wait">
            {currentRide ? (
              <RideStatus
                key="ride-status"
                rideData={currentRide}
                onRideComplete={handleRideComplete}
                onCancel={handleRideCancel}
              />
            ) : (
              <RideBooking
                key="ride-booking"
                onRideBooked={handleRideBooked}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Index;

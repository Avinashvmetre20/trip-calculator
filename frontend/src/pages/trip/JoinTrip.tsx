import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { joinTrip } from '../../services/tripService';
import { useAuth } from '../../context/AuthContext';

const JoinTrip = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('Joining...');

  useEffect(() => {
    if (isLoading) return;

    if (!token) {
      setStatus('Invalid invite link');
      return;
    }

    if (!isAuthenticated) {
      // Redirect to login with return URL
      navigate(`/login?returnUrl=${encodeURIComponent(`/join?token=${token}`)}`);
      return;
    }

    const handleJoin = async () => {
      try {
        const { tripId } = await joinTrip(token);
        navigate(`/trips/${tripId}`);
      } catch (error: any) {
        setStatus(error.response?.data?.message || 'Failed to join trip');
      }
    };

    handleJoin();
  }, [token, isAuthenticated, isLoading, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Join Trip</h2>
        <p className="text-gray-600">{status}</p>
        {status.includes('Failed') && (
          <button 
            onClick={() => navigate('/dashboard')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        )}
      </div>
    </div>
  );
};

export default JoinTrip;

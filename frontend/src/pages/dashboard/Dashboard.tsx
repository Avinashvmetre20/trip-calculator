import { useEffect, useState } from 'react';
import { getTrips, createTrip } from '../../services/tripService';
import type { Trip, CreateTripData } from '../../types/trip';
import CreateTripModal from '../../components/trip/CreateTripModal';
import { Plus, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTrips = async () => {
    try {
      const data = await getTrips();
      setTrips(data);
    } catch (error) {
      console.error('Failed to fetch trips', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleCreateTrip = async (data: CreateTripData) => {
    await createTrip(data);
    fetchTrips();
  };

  if (loading) return <div className="p-8 text-center">Loading trips...</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Trips</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus size={20} />
          <span>New Trip</span>
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <h3 className="text-xl font-medium text-gray-600 mb-2">No trips yet</h3>
          <p className="text-gray-500 mb-4">Create your first trip to start planning!</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-blue-600 hover:underline"
          >
            Create a trip
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <Link
              key={trip.id}
              to={`/trips/${trip.id}`}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100"
            >
              <h3 className="text-xl font-bold mb-2">{trip.name}</h3>
              <p className="text-gray-600 mb-4 line-clamp-2">{trip.description || 'No description'}</p>
              <div className="flex items-center text-gray-500 text-sm">
                <Calendar size={16} className="mr-2" />
                <span>
                  {trip.start_date ? new Date(trip.start_date).toLocaleDateString() : 'TBD'} 
                  {' - '}
                  {trip.end_date ? new Date(trip.end_date).toLocaleDateString() : 'TBD'}
                </span>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded uppercase font-semibold">
                  {trip.role}
                </span>
                <span className="text-gray-400 text-sm">{trip.currency}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateTripModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTrip}
      />
    </div>
  );
};

export default Dashboard;

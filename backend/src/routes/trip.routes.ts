import { Router } from 'express';
import { 
  createTrip, 
  getTrips, 
  getTrip,
  updateTrip,
  deleteTrip,
  addMember,
  removeMember,
  getTripMembers,
  generateInviteLink,
  joinTrip
} from '../controllers/trip.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/trips/join', joinTrip);

router.post('/trips', createTrip);
router.get('/trips', getTrips);
router.get('/trips/:id', getTrip);
router.put('/trips/:id', updateTrip);
router.delete('/trips/:id', deleteTrip);

// Member Management
router.get('/trips/:id/members', getTripMembers);
router.post('/trips/:id/members', addMember);
router.delete('/trips/:id/members/:userId', removeMember);

// Invitation
router.get('/trips/:id/invite', generateInviteLink);

export default router;


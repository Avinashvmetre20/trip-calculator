import { Router } from 'express';
import { 
  createExpense, 
  getExpenses, 
  getExpense, 
  updateExpense, 
  deleteExpense,
  getUserSummary
} from '../controllers/expense.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/trips/:tripId/expenses', createExpense);
router.get('/trips/:tripId/expenses', getExpenses);
router.get('/trips/:tripId/expenses/:id', getExpense);
router.put('/trips/:tripId/expenses/:id', updateExpense);
router.delete('/trips/:tripId/expenses/:id', deleteExpense);
router.get('/trips/:tripId/user-summary/:userId', getUserSummary);

export default router;

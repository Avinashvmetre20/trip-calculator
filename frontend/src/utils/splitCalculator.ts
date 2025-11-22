import { SplitType } from '../types/expense';

interface Member {
  id: number;
  name: string;
}

interface SplitInput {
  user_id: number;
  amount?: number;
  percentage?: number;
  shares?: number;
}

export const calculateSplits = (
  totalAmount: number,
  splitType: SplitType,
  members: Member[],
  customSplits?: SplitInput[]
): SplitInput[] => {
  switch (splitType) {
    case SplitType.EQUAL:
      return calculateEqualSplit(totalAmount, members);
    
    case SplitType.PERCENTAGE:
      return calculatePercentageSplit(totalAmount, customSplits || []);
    
    case SplitType.CUSTOM:
      return customSplits || [];
    
    case SplitType.SHARES:
      return calculateSharesSplit(totalAmount, customSplits || []);
    
    default:
      return [];
  }
};

const calculateEqualSplit = (totalAmount: number, members: Member[]): SplitInput[] => {
  const amountPerPerson = totalAmount / members.length;
  return members.map(member => ({
    user_id: member.id,
    amount: parseFloat(amountPerPerson.toFixed(2))
  }));
};

const calculatePercentageSplit = (totalAmount: number, splits: SplitInput[]): SplitInput[] => {
  return splits.map(split => ({
    user_id: split.user_id,
    percentage: split.percentage,
    amount: parseFloat(((totalAmount * (split.percentage || 0)) / 100).toFixed(2))
  }));
};

const calculateSharesSplit = (totalAmount: number, splits: SplitInput[]): SplitInput[] => {
  const totalShares = splits.reduce((sum, split) => sum + (split.shares || 0), 0);
  
  return splits.map(split => ({
    user_id: split.user_id,
    shares: split.shares,
    amount: parseFloat(((totalAmount * (split.shares || 0)) / totalShares).toFixed(2))
  }));
};

export const validateSplits = (
  totalAmount: number,
  splitType: SplitType,
  splits: SplitInput[]
): { valid: boolean; error?: string } => {
  if (splits.length === 0) {
    return { valid: false, error: 'At least one person must be included in the split' };
  }

  switch (splitType) {
    case SplitType.PERCENTAGE: {
      const totalPercentage = splits.reduce((sum, split) => sum + (split.percentage || 0), 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return { valid: false, error: `Percentages must add up to 100% (currently ${totalPercentage.toFixed(1)}%)` };
      }
      break;
    }

    case SplitType.CUSTOM: {
      const totalSplit = splits.reduce((sum, split) => sum + (split.amount || 0), 0);
      if (Math.abs(totalSplit - totalAmount) > 0.01) {
        return { valid: false, error: `Split amounts must add up to total (${totalSplit.toFixed(2)} / ${totalAmount.toFixed(2)})` };
      }
      break;
    }

    case SplitType.SHARES: {
      const hasShares = splits.every(split => (split.shares || 0) > 0);
      if (!hasShares) {
        return { valid: false, error: 'All members must have at least 1 share' };
      }
      break;
    }
  }

  return { valid: true };
};

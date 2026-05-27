import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getUserProfile, getUserStats, updateProfile } from '../services/userService';
import { validateBody } from '../middleware/validation';
import { getLogger } from '../utils/logger';

const logger = getLogger('user-controller');

const updateProfileSchema = z.object({
  display_name: z
    .string()
    .min(1, 'Display name is required')
    .max(50, 'Display name must be 50 characters or less')
    .transform((val) => val.trim())
    .optional(),
  current_password: z.string().optional(),
  new_password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one digit')
    .optional(),
}).refine(
  (data) => {
    // If new_password is provided, current_password must also be provided
    if (data.new_password && !data.current_password) {
      return false;
    }
    return true;
  },
  {
    message: 'Current password is required when changing password',
    path: ['current_password'],
  }
);

export const validateUpdateProfile = validateBody(updateProfileSchema);

export async function getMeHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const [profile, stats] = await Promise.all([
      getUserProfile(userId),
      getUserStats(userId),
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...profile,
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMeHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const result = await updateProfile(userId, req.body);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
}

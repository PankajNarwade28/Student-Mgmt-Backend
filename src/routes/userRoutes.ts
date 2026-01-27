import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { ProfileController } from '../controllers/profileController';
import { authMiddleware } from '../middlewares/auth.middleware';
import router from './adminRoutes';

// src/routes/user.routes.ts
const profileController = container.get<ProfileController>(TYPES.ProfileController);

const saveProfileHandler = profileController.saveProfile.bind(profileController);
const getProfileHandler = profileController.getProfile.bind(profileController);

router.get("/profile", authMiddleware, getProfileHandler);
router.post("/profile", authMiddleware, saveProfileHandler); 



export default router;
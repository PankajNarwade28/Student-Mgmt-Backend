import { Router } from 'express';
import { container } from '../config/inversify.config';
import { CouponController } from '../controllers/couponController';

const couponRouter = Router();

// Define a helper to resolve the controller only when the route is hit
const getController = () => container.get<CouponController>(CouponController);

couponRouter.get('/', (req, res) => getController().getCoupons(req, res));
couponRouter.post('/', (req, res) => getController().addCoupon(req, res));
couponRouter.delete('/:id', (req, res) => getController().deleteCoupon(req, res));

export default couponRouter;
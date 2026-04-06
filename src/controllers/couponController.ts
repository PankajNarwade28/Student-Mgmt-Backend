import { Request, Response } from 'express';
import { CouponRepository } from '../repositories/coupon.repository';
import { inject, injectable } from 'inversify';


@injectable()
export class CouponController {
  constructor(@inject(CouponRepository) private readonly repo: CouponRepository) {}

  getCoupons = async (req: Request, res: Response) => {
    const data = await this.repo.getAll();
    res.json({ success: true, data });
  };

  addCoupon = async (req: Request, res: Response) => {
    const coupon = await this.repo.create(req.body);
    res.json({ success: true, coupon });
  };

  deleteCoupon = async (req: Request, res: Response) => {
    await this.repo.delete(Number.parseInt(req.params.id as string));
    res.json({ success: true, message: "Coupon deleted" });
  };

  updateStatus = async (req: Request, res: Response) => {
    await this.repo.toggleStatus(Number.parseInt(req.params.id as string), req.body.is_active);
    res.json({ success: true });
  };
}
import { MobileAccountController } from './mobile-account.controller';
import { AuthService } from '../auth/auth.service';
import { MembershipService } from '../membership/membership.service';

describe('mobile account membership consistency', () => {
  it('returns the reconciled plan when a payment activates during the overview request', async () => {
    const user = {
      id: 'owner',
      name: 'Learner',
      plan: 'free',
      premiumUntil: null,
    };
    const membership = {
      plan: 'pro',
      premiumUntil: new Date('2027-01-01'),
      limit: 30,
    };
    const auth = { me: jest.fn().mockResolvedValue({ user }) };
    const plans = { status: jest.fn().mockResolvedValue(membership) };
    const controller = new MobileAccountController(
      auth as unknown as AuthService,
      plans as unknown as MembershipService,
    );
    const result = await controller.overview('Bearer session');
    expect(auth.me).toHaveBeenCalledWith('session');
    expect(plans.status).toHaveBeenCalledWith('owner');
    expect(result.user.plan).toBe(result.membership.plan);
    expect(result.user.premiumUntil).toBe(result.membership.premiumUntil);
    expect(user.plan).toBe('free');
  });
});

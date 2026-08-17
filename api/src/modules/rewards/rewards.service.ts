import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PointTransactionType, ProductType } from '@prisma/client';

// Base points per product type
const DONATION_POINTS: Record<ProductType, number> = {
  WHOLE_BLOOD: 100,
  PLATELETS: 150,
  PLASMA: 120,
};

@Injectable()
export class RewardsService {
  constructor(private prisma: PrismaService) {}

  async awardDonationPoints(donorId: string, donationId: string, productType: ProductType) {
    const donor = await this.prisma.donor.findUnique({ where: { id: donorId } });
    if (!donor) throw new NotFoundException('Donante no encontrado');

    const basePoints = DONATION_POINTS[productType];

    // Check for milestone bonuses
    const donationsThisYear = await this.prisma.bloodUnit.count({
      where: {
        donorId,
        collectionDate: { gte: new Date(new Date().getFullYear(), 0, 1) },
      },
    });

    let bonusPoints = 0;
    let bonusDescription = '';
    if (donationsThisYear === 3) {
      bonusPoints = 200;
      bonusDescription = 'Bonus Donante Recurrente (3ra donación del año)';
    } else if (donationsThisYear >= 6 && donationsThisYear % 6 === 0) {
      bonusPoints = 500;
      bonusDescription = 'Bonus Donante VIP';
    }

    const totalPoints = basePoints + bonusPoints;
    const newBalance = donor.pointsBalance + totalPoints;

    await this.prisma.$transaction([
      this.prisma.pointTransaction.create({
        data: {
          donorId,
          type: PointTransactionType.DONATION,
          points: basePoints,
          balanceAfter: donor.pointsBalance + basePoints,
          referenceId: donationId,
          description: `Donación de ${productType.toLowerCase().replace('_', ' ')}`,
        },
      }),
      ...(bonusPoints > 0
        ? [
            this.prisma.pointTransaction.create({
              data: {
                donorId,
                type: PointTransactionType.FREQUENT_MILESTONE,
                points: bonusPoints,
                balanceAfter: newBalance,
                referenceId: donationId,
                description: bonusDescription,
              },
            }),
          ]
        : []),
      this.prisma.donor.update({
        where: { id: donorId },
        data: { pointsBalance: newBalance },
      }),
    ]);

    return { pointsAwarded: totalPoints, newBalance };
  }

  async awardReferralPoints(referrerId: string, newDonorId: string) {
    const referrer = await this.prisma.donor.findUnique({ where: { id: referrerId } });
    if (!referrer) return;

    const newBalance = referrer.pointsBalance + 50;
    await this.prisma.$transaction([
      this.prisma.pointTransaction.create({
        data: {
          donorId: referrerId,
          type: PointTransactionType.REFERRAL,
          points: 50,
          balanceAfter: newBalance,
          referenceId: newDonorId,
          description: 'Referido realizó su primera donación',
        },
      }),
      this.prisma.donor.update({
        where: { id: referrerId },
        data: { pointsBalance: newBalance },
      }),
    ]);
  }

  async redeem(donorId: string, partnerId: string, pointsToRedeem: number) {
    const [donor, partner] = await Promise.all([
      this.prisma.donor.findUnique({ where: { id: donorId } }),
      this.prisma.partnerEstablishment.findUnique({ where: { id: partnerId } }),
    ]);

    if (!donor) throw new NotFoundException('Donante no encontrado');
    if (!partner || !partner.isActive) throw new NotFoundException('Establecimiento no disponible');
    if (donor.pointsBalance < pointsToRedeem) {
      throw new BadRequestException('Puntos insuficientes');
    }

    // 1 point = 1 DOP
    const dopValue = pointsToRedeem;
    const newBalance = donor.pointsBalance - pointsToRedeem;

    const [redemption] = await this.prisma.$transaction([
      this.prisma.redemption.create({
        data: {
          donorId,
          partnerId,
          pointsUsed: pointsToRedeem,
          dopValue,
          taxEligible: true,
        },
      }),
      this.prisma.pointTransaction.create({
        data: {
          donorId,
          type: PointTransactionType.REDEMPTION,
          points: -pointsToRedeem,
          balanceAfter: newBalance,
          description: `Canje en ${partner.name}`,
        },
      }),
      this.prisma.donor.update({
        where: { id: donorId },
        data: { pointsBalance: newBalance },
      }),
    ]);

    return redemption;
  }

  async getPartners() {
    return this.prisma.partnerEstablishment.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getDonorTransactions(donorId: string) {
    return this.prisma.pointTransaction.findMany({
      where: { donorId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

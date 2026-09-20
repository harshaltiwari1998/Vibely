import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { levelFromXp } from "../levels/levels.service";

@Injectable()
export class FamiliesService {
  constructor(private readonly prisma: PrismaService) {}

  async listFamilies(search?: string) {
    const families = await this.prisma.family.findMany({
      where: search ? { name: { contains: search, mode: "insensitive" } } : undefined,
      include: { owner: { select: { username: true } }, members: { select: { id: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return families.map((f) => ({
      id: f.id,
      name: f.name,
      bio: f.bio,
      ownerUsername: f.owner.username,
      memberCount: f.members.length,
    }));
  }

  async getFamily(familyId: string) {
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
      include: {
        owner: { select: { id: true, username: true, avatarUrl: true } },
        members: { select: { id: true, username: true, avatarUrl: true, xp: true } },
      },
    });
    if (!family) {
      throw new NotFoundException("Family not found");
    }
    return {
      id: family.id,
      name: family.name,
      bio: family.bio,
      owner: family.owner,
      members: family.members.map((m) => ({ id: m.id, username: m.username, avatarUrl: m.avatarUrl, level: levelFromXp(m.xp) })),
    };
  }

  async getMyFamily(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { familyId: true } });
    if (!user?.familyId) {
      return null;
    }
    return this.getFamily(user.familyId);
  }

  async createFamily(userId: string, name: string, bio?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { familyId: true } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    if (user.familyId) {
      throw new BadRequestException("Leave your current family first");
    }
    if (!name || name.trim().length < 2) {
      throw new BadRequestException("Family name must be at least 2 characters");
    }

    const existing = await this.prisma.family.findUnique({ where: { name } });
    if (existing) {
      throw new ConflictException("Family name already taken");
    }

    const family = await this.prisma.family.create({ data: { name, bio, ownerId: userId } });
    await this.prisma.user.update({ where: { id: userId }, data: { familyId: family.id } });
    return this.getFamily(family.id);
  }

  async joinFamily(userId: string, familyId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { familyId: true } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    if (user.familyId) {
      throw new BadRequestException("Leave your current family first");
    }

    const family = await this.prisma.family.findUnique({ where: { id: familyId } });
    if (!family) {
      throw new NotFoundException("Family not found");
    }

    await this.prisma.user.update({ where: { id: userId }, data: { familyId } });
    return this.getFamily(familyId);
  }

  async leaveFamily(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { familyId: true } });
    if (!user?.familyId) {
      throw new BadRequestException("You are not in a family");
    }

    const family = await this.prisma.family.findUnique({ where: { id: user.familyId } });
    if (family?.ownerId === userId) {
      throw new BadRequestException("Owners must disband the family instead of leaving");
    }

    await this.prisma.user.update({ where: { id: userId }, data: { familyId: null } });
    return { success: true };
  }

  async disbandFamily(userId: string) {
    const family = await this.prisma.family.findUnique({ where: { ownerId: userId } });
    if (!family) {
      throw new NotFoundException("You don't own a family");
    }
    await this.prisma.family.delete({ where: { id: family.id } });
    return { success: true };
  }

  async getLeaderboard(familyId: string) {
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
      select: { members: { select: { id: true } } },
    });
    if (!family) {
      throw new NotFoundException("Family not found");
    }
    const memberIds = family.members.map((m) => m.id);
    if (memberIds.length === 0) {
      return [];
    }

    const grouped = await this.prisma.giftTransaction.groupBy({
      by: ["senderId"],
      where: { senderId: { in: memberIds } },
      _sum: { coinAmount: true },
    });
    const totals = new Map(grouped.map((g) => [g.senderId, g._sum.coinAmount ?? 0]));

    const users = await this.prisma.user.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, username: true, avatarUrl: true },
    });

    return users
      .map((u) => ({ ...u, totalGiftsSent: totals.get(u.id) ?? 0 }))
      .sort((a, b) => b.totalGiftsSent - a.totalGiftsSent);
  }
}

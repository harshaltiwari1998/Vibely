import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { WalletService } from "../wallet/wallet.service";
import { MallItemCategory } from "@prisma/client";

const DEFAULT_ITEMS: { name: string; category: MallItemCategory; iconUrl: string; price: number }[] = [
  { name: "Crimson Rose Wreath", category: "HEADWEAR", iconUrl: "🌹", price: 3000 },
  { name: "Icy Snowflake", category: "HEADWEAR", iconUrl: "❄️", price: 3000 },
  { name: "Rainbow Phoenix Wreath", category: "HEADWEAR", iconUrl: "🦚", price: 3000 },
  { name: "Blue Crystal Wreath", category: "HEADWEAR", iconUrl: "💠", price: 3000 },
  { name: "Golden Chariot", category: "RIDE", iconUrl: "🏎️", price: 5000 },
  { name: "Starlight Yacht", category: "RIDE", iconUrl: "🛥️", price: 8000 },
  { name: "Royal Carriage", category: "RIDE", iconUrl: "🎠", price: 6000 },
  { name: "Sparkle Frame", category: "PROFILE_DECORATION", iconUrl: "✨", price: 2000 },
  { name: "Royal Border", category: "PROFILE_DECORATION", iconUrl: "👑", price: 2500 },
];

@Injectable()
export class MallService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
  ) {}

  async getItems() {
    let items = await this.prisma.mallItem.findMany({ where: { active: true }, orderBy: { price: "asc" } });
    if (items.length === 0) {
      items = await Promise.all(DEFAULT_ITEMS.map((item) => this.prisma.mallItem.create({ data: item })));
    }
    return items;
  }

  async getInventory(userId: string) {
    return this.prisma.mallInventoryItem.findMany({
      where: { userId },
      include: { item: true },
      orderBy: { purchasedAt: "desc" },
    });
  }

  async purchase(userId: string, itemId: string) {
    const item = await this.prisma.mallItem.findUnique({ where: { id: itemId } });
    if (!item || !item.active) {
      throw new NotFoundException("Item not found");
    }

    const existing = await this.prisma.mallInventoryItem.findUnique({
      where: { userId_itemId: { userId, itemId } },
    });
    if (existing) {
      throw new BadRequestException("You already own this item");
    }

    await this.wallet.deductCoins(userId, item.price, "MALL_PURCHASE", `mall:${itemId}`);
    const owned = await this.prisma.mallInventoryItem.create({
      data: { userId, itemId },
      include: { item: true },
    });
    return owned;
  }

  async equip(userId: string, itemId: string) {
    const owned = await this.prisma.mallInventoryItem.findUnique({
      where: { userId_itemId: { userId, itemId } },
      include: { item: true },
    });
    if (!owned) {
      throw new NotFoundException("You don't own this item");
    }

    await this.prisma.$transaction([
      this.prisma.mallInventoryItem.updateMany({
        where: { userId, item: { category: owned.item.category }, equipped: true },
        data: { equipped: false },
      }),
      this.prisma.mallInventoryItem.update({
        where: { userId_itemId: { userId, itemId } },
        data: { equipped: true },
      }),
    ]);

    return { itemId, equipped: true };
  }

  async unequip(userId: string, itemId: string) {
    const owned = await this.prisma.mallInventoryItem.findUnique({
      where: { userId_itemId: { userId, itemId } },
    });
    if (!owned) {
      throw new NotFoundException("You don't own this item");
    }
    await this.prisma.mallInventoryItem.update({
      where: { userId_itemId: { userId, itemId } },
      data: { equipped: false },
    });
    return { itemId, equipped: false };
  }
}

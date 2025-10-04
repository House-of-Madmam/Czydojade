import { and, eq } from 'drizzle-orm';

import { UuidService } from '../../../../common/uuid/uuidService.ts';
import type { Database } from '../../../../infrastructure/database/database.ts';
import { areaSubscriptions, lineSubscriptions } from '../../../../infrastructure/database/schema.ts';
import type {
  CreateAreaSubscriptionData,
  CreateLineSubscriptionData,
  SubscriptionRepository,
} from '../../domain/repositories/subscriptionRepository.ts';
import type { AreaSubscription, LineSubscription } from '../../domain/types/subscription.ts';

export class SubscriptionRepositoryImpl implements SubscriptionRepository {
  public constructor(private readonly database: Database) {}

  public async createLineSubscription(data: CreateLineSubscriptionData): Promise<LineSubscription> {
    const [row] = await this.database.db
      .insert(lineSubscriptions)
      .values({
        id: UuidService.generateUuid(),
        userId: data.userId,
        lineId: data.lineId,
        minPriority: data.minPriority,
        isActive: data.isActive ?? true,
      })
      .returning();

    if (!row) {
      throw new Error('Failed to create line subscription');
    }

    return this.mapLineSubscription(row);
  }

  public async createAreaSubscription(data: CreateAreaSubscriptionData): Promise<AreaSubscription> {
    const [row] = await this.database.db
      .insert(areaSubscriptions)
      .values({
        id: UuidService.generateUuid(),
        userId: data.userId,
        latitude: data.latitude.toString(),
        longitude: data.longitude.toString(),
        radiusMeters: data.radiusMeters,
        minPriority: data.minPriority,
        isActive: data.isActive ?? true,
      })
      .returning();

    if (!row) {
      throw new Error('Failed to create area subscription');
    }

    return this.mapAreaSubscription(row);
  }

  public async listLineSubscriptions(userId: string): Promise<LineSubscription[]> {
    const result = await this.database.db.select().from(lineSubscriptions).where(eq(lineSubscriptions.userId, userId));

    return result.map((row) => this.mapLineSubscription(row));
  }

  public async listAreaSubscriptions(userId: string): Promise<AreaSubscription[]> {
    const result = await this.database.db.select().from(areaSubscriptions).where(eq(areaSubscriptions.userId, userId));

    return result.map((row) => this.mapAreaSubscription(row));
  }

  public async deleteSubscription(subscriptionId: string, userId: string): Promise<boolean> {
    const lineDelete = await this.database.db
      .delete(lineSubscriptions)
      .where(and(eq(lineSubscriptions.id, subscriptionId), eq(lineSubscriptions.userId, userId)))
      .returning({ id: lineSubscriptions.id });

    if (lineDelete.length > 0) {
      return true;
    }

    const areaDelete = await this.database.db
      .delete(areaSubscriptions)
      .where(and(eq(areaSubscriptions.id, subscriptionId), eq(areaSubscriptions.userId, userId)))
      .returning({ id: areaSubscriptions.id });

    return areaDelete.length > 0;
  }

  private mapLineSubscription(row: typeof lineSubscriptions.$inferSelect): LineSubscription {
    return {
      id: row.id,
      userId: row.userId,
      lineId: row.lineId,
      minPriority: row.minPriority,
      isActive: row.isActive,
      createdAt: row.createdAt,
    };
  }

  private mapAreaSubscription(row: typeof areaSubscriptions.$inferSelect): AreaSubscription {
    return {
      id: row.id,
      userId: row.userId,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      radiusMeters: row.radiusMeters,
      minPriority: row.minPriority,
      isActive: row.isActive,
      createdAt: row.createdAt,
    };
  }
}

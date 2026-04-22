import { db } from "../db";
import { assetTypes, assetStatuses } from "@shared/schema";
import { eq } from "drizzle-orm";

const DEFAULT_ASSET_TYPES = [
  { name: "Strategy", sortOrder: 1 },
  { name: "Copy", sortOrder: 2 },
  { name: "Creative", sortOrder: 3 },
  { name: "Reports", sortOrder: 4 },
  { name: "Client-Provided", sortOrder: 5 },
  { name: "Other", sortOrder: 6 },
];

const DEFAULT_ASSET_STATUSES = [
  { name: "Approved", color: "#10B981", sortOrder: 1 },
  { name: "Client Approval", color: "#F59E0B", sortOrder: 2 },
  { name: "In Progress", color: "#00C9C6", sortOrder: 3 },
  { name: "Needs Updates", color: "#EF4444", sortOrder: 4 },
  { name: "Archived", color: "#6B7280", sortOrder: 5 },
];

export async function seedAssetDefaultsForAgency(agencyId: number = 1): Promise<{
  agencyId: number;
  typesInserted: number;
  statusesInserted: number;
  skipped: boolean;
}> {
  const existingTypes = await db
    .select({ id: assetTypes.id })
    .from(assetTypes)
    .where(eq(assetTypes.agencyId, agencyId))
    .limit(1);

  const existingStatuses = await db
    .select({ id: assetStatuses.id })
    .from(assetStatuses)
    .where(eq(assetStatuses.agencyId, agencyId))
    .limit(1);

  if (existingTypes.length > 0 && existingStatuses.length > 0) {
    return { agencyId, typesInserted: 0, statusesInserted: 0, skipped: true };
  }

  let typesInserted = 0;
  let statusesInserted = 0;

  if (existingTypes.length === 0) {
    const rows = DEFAULT_ASSET_TYPES.map((t) => ({ agencyId, ...t }));
    const inserted = await db.insert(assetTypes).values(rows).returning({ id: assetTypes.id });
    typesInserted = inserted.length;
  }

  if (existingStatuses.length === 0) {
    const rows = DEFAULT_ASSET_STATUSES.map((s) => ({ agencyId, ...s }));
    const inserted = await db.insert(assetStatuses).values(rows).returning({ id: assetStatuses.id });
    statusesInserted = inserted.length;
  }

  return { agencyId, typesInserted, statusesInserted, skipped: false };
}

export async function backfillAssetDefaultsForAllAgencies(): Promise<{
  results: Array<{ agencyId: number; typesInserted: number; statusesInserted: number; skipped: boolean }>;
}> {
  // Single-tenant today: agency 1 = Media Optimizers, LLC.
  // When multi-tenancy lands, replace this with:
  //   const rows = await db.select({ id: agencies.id }).from(agencies);
  //   const agencyIds = rows.map(r => r.id);
  const agencyIds: number[] = [1];

  const results = [];
  for (const id of agencyIds) {
    results.push(await seedAssetDefaultsForAgency(id));
  }
  return { results };
}

export type EntityType = "business" | "rental";
export type CategoryKind = "income" | "expense";
export type Direction = "in" | "out";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: "admin" | "member";
  created_at: string;
}

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  subtype: string | null;
  slug: string;
  address: string | null;
  sort_order: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  applies_to: "any" | "business" | "rental";
  slug: string;
  sort_order: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  entity_id: string;
  occurred_on: string; // YYYY-MM-DD
  direction: Direction;
  amount: number; // always >= 0
  signed_amount: number; // generated: +amount for in, -amount for out
  category_id: string | null;
  description: string | null;
  counterparty: string | null;
  method: string | null;
  source: string; // 'manual' | 'csv' | connector slug
  external_id: string | null;
  import_batch_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** A transaction with its joined entity + category names (for list views). */
export type TransactionWithJoins = Transaction & {
  entities: { name: string; type: EntityType } | null;
  categories: { name: string; kind: CategoryKind } | null;
};

export interface ImportBatch {
  id: string;
  entity_id: string;
  source: string;
  filename: string | null;
  column_mapping: Record<string, string> | null;
  row_count: number;
  inserted_count: number;
  skipped_count: number;
  status: "preview" | "committed" | "reverted";
  created_at: string;
  created_by: string | null;
}

export interface HomeValuation {
  id: string;
  entity_id: string;
  value: number;
  value_low: number | null;
  value_high: number | null;
  source: string;
  details: Record<string, unknown> | null;
  fetched_at: string;
}

export interface Mortgage {
  id: string;
  entity_id: string;
  lender: string | null;
  balance: number;
  balance_as_of: string; // YYYY-MM-DD
  interest_rate: number | null; // annual %
  monthly_payment: number | null; // principal + interest
  payoff_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

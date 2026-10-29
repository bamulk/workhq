import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, LinkButton, EmptyState, Section } from "@/components/ui";
import EntityRanking from "@/components/EntityRanking";
import { summarizeByEntity, type FlowRow } from "@/lib/aggregate";
import type { Entity } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EntitiesPage() {
  const supabase = await createClient();
  const [{ data: entityRows }, { data: txnRows }] = await Promise.all([
    supabase.from("entities").select("*").order("sort_order"),
    supabase.from("transactions").select("entity_id, amount, direction, signed_amount"),
  ]);

  const entities = (entityRows ?? []) as Entity[];
  const byEntity = summarizeByEntity((txnRows ?? []) as FlowRow[]);

  const businesses = entities.filter((e) => e.type === "business" && !e.archived);
  const rentals = entities.filter((e) => e.type === "rental" && !e.archived);
  const homes = entities.filter((e) => e.type === "home" && !e.archived);
  const archived = entities.filter((e) => e.archived);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Entities"
        subtitle={`${businesses.length} businesses · ${rentals.length} rental houses · net for all time`}
        actions={
          <LinkButton href="/entities/new" variant="secondary">
            <Plus size={16} /> New entity
          </LinkButton>
        }
      />

      {entities.length === 0 ? (
        <EmptyState
          title="No businesses or rentals yet"
          description="Add one to start tracking its money in and out."
          action={
            <LinkButton href="/entities/new">
              <Plus size={16} /> New entity
            </LinkButton>
          }
        />
      ) : (
        <>
          {businesses.length > 0 && (
            <Section title="Businesses">
              <EntityRanking entities={businesses} byEntity={byEntity} />
            </Section>
          )}
          {rentals.length > 0 && (
            <Section title="Rental houses">
              <EntityRanking entities={rentals} byEntity={byEntity} />
            </Section>
          )}
          {homes.length > 0 && (
            <Section title="Primary home" aside="Equity only">
              <ul className="divide-y divide-rule border-b border-rule">
                {homes.map((e) => (
                  <li key={e.id}>
                    <Link href={`/entities/${e.id}`} className="block py-3 hover:bg-hover">
                      <span className="block truncate">{e.name}</span>
                      <span className="block text-[13px] text-ink-3 truncate">{e.address ?? "No address yet"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {archived.length > 0 && (
            <Section title="Archived">
              <ul className="divide-y divide-rule border-b border-rule">
                {archived.map((e) => (
                  <li key={e.id}>
                    <Link href={`/entities/${e.id}`} className="block py-3 -mx-2 px-2 rounded-[4px] text-ink-2 hover:bg-hover hover:text-ink">
                      {e.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </>
      )}
    </div>
  );
}

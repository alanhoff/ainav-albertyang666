/**
 * Migration script: import tools from JSON + locale files into the Supabase tools table.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/migrate-tools-to-db.ts
 *
 * Notes:
 *   - Only migrates tools from data/ai-services.json; skips duplicates
 *   - Translations are merged into the JSONB `translations` column
 *   - Uses upsert (ignore on conflict) so the script is safe to run multiple times
 */

import { createClient } from '@supabase/supabase-js';
import aiServicesBaseData from '../data/ai-services.json';
import zhServices from '../locales/services.zh';
import enServices from '../locales/services.en';
import jaServices from '../locales/services.ja';
import koServices from '../locales/services.ko';
import frServices from '../locales/services.fr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing env vars: SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const translationsMap = {
  zh: zhServices,
  en: enServices,
  ja: jaServices,
  ko: koServices,
  fr: frServices,
} as const;

type Locale = keyof typeof translationsMap;
const locales = Object.keys(translationsMap) as Locale[];

async function migrate() {
  console.log(`Migrating ${aiServicesBaseData.length} tools...`);

  const rows = aiServicesBaseData.map(base => {
    const translations: Record<string, { name: string; description: string; tags: string[] }> = {};

    for (const locale of locales) {
      const t = translationsMap[locale][base.id as keyof (typeof translationsMap)[typeof locale]];
      if (t) {
        translations[locale] = {
          name: t.name,
          description: t.description,
          tags: t.tags,
        };
      }
    }

    return {
      id: base.id,
      url: base.url,
      category: base.category,
      featured: base.featured ?? false,
      pricing: base.pricing ?? 'freemium',
      language: base.language ?? [],
      translations,
      status: 'active',
    };
  });

  // Insert in batches of 50; upsert to allow safe re-runs
  const batchSize = 50;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('tools')
      .upsert(batch, { onConflict: 'id', ignoreDuplicates: true })
      .select('id');

    if (error) {
      console.error(`Batch ${Math.floor(i / batchSize) + 1} failed:`, error.message);
      continue;
    }

    inserted += data?.length ?? 0;
    skipped += batch.length - (data?.length ?? 0);
    console.log(`Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(rows.length / batchSize)} done`);
  }

  console.log(`\nDone! Inserted: ${inserted}, skipped (duplicates): ${skipped}`);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

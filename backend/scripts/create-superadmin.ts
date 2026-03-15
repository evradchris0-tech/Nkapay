/**
 * Wrapper script to run the project's existing `seedSuperAdmin` script.
 * This delegates to `src/scripts/seed-superadmin.ts` which contains project-specific
 * logic to create or promote a superadmin using the configured data source.
 */

import 'dotenv/config';
import { seedSuperAdmin } from '../src/scripts/seed-superadmin';

(async () => {
  try {
    await seedSuperAdmin();
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed superadmin:', err);
    process.exit(1);
  }
})();

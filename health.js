import { getDataHealth } from './supabase-client.js';

const status = document.querySelector('#status');
const metrics = document.querySelector('#metrics');

try {
  const data = await getDataHealth();
  if (status) status.textContent = 'Database connection: OK';
  const entries = [
    ['Champions', data.total_champions],
    ['Abilities', data.total_abilities],
    ['Raid bosses', data.total_raid_bosses],
    ['Live factions', data.total_factions],
    ['Live faction memberships', data.total_faction_memberships],
    ['Announced updates', data.total_announced_updates],
    ['Data version', data.data_version || 'No import yet'],
    ['Imported at', data.imported_at || 'No import yet']
  ];
  if (metrics) {
    for (const [label, value] of entries) {
      const item = document.createElement('div');
      const heading = document.createElement('dt');
      const detail = document.createElement('dd');
      heading.textContent = String(label);
      detail.textContent = String(value);
      item.append(heading, detail);
      metrics.append(item);
    }
  }
} catch (error) {
  if (status) status.textContent = error instanceof Error ? error.message : 'Database connection failed.';
}

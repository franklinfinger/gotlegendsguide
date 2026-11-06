import { createClient } from '@supabase/supabase-js';
import { createOwnerStore } from './client.js';
import { mountOwnerControls } from './controls.js';

const root = document.querySelector('#app');
const state = document.querySelector('#status');
try {
  const store = createOwnerStore({ config: globalThis.GOT_PRIVATE_CONFIG || {}, createClient });
  await mountOwnerControls({root, state, store});
} catch (error) { root.replaceChildren(); state.textContent = error.message; }

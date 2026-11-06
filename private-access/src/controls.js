export async function mountOwnerControls({root, state, store, loadCollection = () => store.readCollection(), onClear = () => {}, onCollection = () => {}}) {
let generation = 0;
let refreshTimer;
let writing = false;
let pendingRefresh = false;
let pageHidden = false;
let evidenceDraft = null;
let passwordScreen = null;
let passwordMessage = '';
let initializingPassword = true;
const inactive = () => pageHidden || document.hidden === true;
const say = message => { state.textContent = message; };
const node = (tag, text) => { const result = document.createElement(tag); if (text) result.textContent = text; return result; };
function clear() { generation += 1; evidenceDraft = null; root.replaceChildren(); root.hidden = false; onClear(); }
function lockForRefresh() {
  generation += 1;
  // A native file chooser returns focus before change on some browsers. Keep
  // its input alive, but hide all private controls until access is reverified.
  root.hidden = true;
  onClear();
}
async function showFailure(error) {
  clearTimeout(refreshTimer); pendingRefresh = false; clear(); say(error.message);
  if (error.code === 'evidence_reconciliation_required') { await showEvidenceRecovery(error); return; }
  if (['signed_out','session_changed'].includes(error.code)) signInPanel();
  else { const retry = node('button', 'Try again'); retry.addEventListener('click', scheduleRefresh); root.append(retry); addSignOut(root); }
}
async function showEvidenceRecovery(problem) {
  const current = generation;
  say('Checking private access to the unchanged saved evidence…');
  try {
    const saved = await store.readEvidenceForRecovery();
    if (current !== generation) return;
    root.append(node('h2', 'Review saved evidence'), node('p', problem.message), node('p', problem.reason || 'Exact identities could not be safely restored.'));
    root.append(node('p', `Saved revision ${saved.revision} is untouched. No champion recommendation or automatic identity mapping is shown. Export it privately or review an exact catalog link while keeping the original source text and saved local IDs.`));
    const exportButton = node('button', 'Export unchanged saved evidence'); exportButton.type = 'button';
    exportButton.addEventListener('click', async () => {
      if (writing) return;
      writing = true; exportButton.disabled = true;
      try {
        // Reverify ownership immediately before a private download, rather than
        // exporting a stale copy after access has been revoked.
        const fresh = await store.readEvidenceForRecovery();
        if (current !== generation) return;
        if (fresh.revision !== saved.revision) throw Object.assign(new Error('Saved evidence changed. Refresh before exporting or reviewing.'), {code:'evidence_conflict'});
        const url = URL.createObjectURL(new Blob([JSON.stringify(fresh.payload, null, 2)], {type:'application/json'}));
        const download = node('a'); download.href = url; download.download = `got-evidence-revision-${fresh.revision}.private.json`;
        download.click(); setTimeout(() => URL.revokeObjectURL(url), 0);
        say('Exported a private copy of the unchanged saved evidence. The account record was not modified.');
      } catch (error) { if (current === generation) await showFailure(error); }
      finally { writing = false; exportButton.disabled = false; flushRefresh(); }
    });
    const review = node('button', 'Review exact identity links'); review.type = 'button';
    const proposed = node('section'); let proposalGeneration = 0;
    review.addEventListener('click', async () => {
      if (writing) return;
      const request = ++proposalGeneration;
      review.disabled = true; proposed.replaceChildren(); say('Preparing a review only. Saved evidence is unchanged.');
      try {
        const proposal = await store.proposeEvidenceReconciliation(saved.revision);
        if (current !== generation || request !== proposalGeneration) return;
        proposed.append(node('h3', 'Proposed links, not ID replacements'));
        for (const change of proposal.changes) proposed.append(node('p', `${change.name}: keep saved ID ${change.variantId}; recognize catalog ID ${change.canonicalVariantId} as the same exact identity. Ownership and original reviewed source text remain unchanged.`));
        const confirmation = node('label');
        const checked = node('input'); checked.type = 'checkbox';
        confirmation.append(checked, node('span', 'I reviewed these exact links and want to keep the saved IDs and source text.'));
        const save = node('button', 'Save reviewed identity links'); save.type = 'button'; save.disabled = true;
        checked.addEventListener('change', () => { save.disabled = !checked.checked; });
        const cancel = node('button', 'Cancel review'); cancel.type = 'button';
        cancel.addEventListener('click', () => { proposalGeneration += 1; proposed.replaceChildren(); say('Review cancelled. Saved evidence is unchanged.'); });
        save.addEventListener('click', async () => {
          if (!checked.checked || writing || current !== generation || request !== proposalGeneration) return;
          writing = true; evidenceDraft = null; onClear(); for (const control of root.querySelectorAll('button,input')) control.disabled = true;
          try {
            await store.saveEvidence(proposal.snapshot, proposal.expectedRevision);
            if (current !== generation) return;
            writing = false; await refresh();
          } catch (error) { if (current === generation) await showFailure(error); }
          finally { writing = false; flushRefresh(); }
        });
        proposed.append(confirmation, save, cancel);
        say('Nothing saved. Review each exact link before choosing Save.');
      } catch (error) {
        if (current !== generation) return;
        if (['signed_out','session_changed','not_owner','access_unavailable'].includes(error.code)) await showFailure(error);
        else { proposed.replaceChildren(node('p', error.message)); say('No mapping was applied. The unchanged evidence remains available to export.'); }
      } finally { review.disabled = false; }
    });
    const retry = node('button', 'Refresh recovery'); retry.type = 'button'; retry.addEventListener('click', scheduleRefresh);
    root.append(exportButton, review, proposed, retry); addSignOut(root);
    say('Identity review needed. Saved evidence is unchanged.');
  } catch (error) { if (current === generation) await showFailure(error); }
}
function signInPanel() {
  passwordScreen = null;
  clear();
  const form = node('form');
  const email = node('input'); email.type = 'email'; email.name = 'email'; email.autocomplete = 'username'; email.required = true; email.id = 'email';
  const password = node('input'); password.type = 'password'; password.name = 'password'; password.autocomplete = 'current-password'; password.required = true; password.id = 'password';
  const emailLabel = node('label', 'Email'); emailLabel.htmlFor = 'email';
  const passwordLabel = node('label', 'Password'); passwordLabel.htmlFor = 'password';
  const submit = node('button', 'Sign in'); submit.type = 'submit';
  form.append(emailLabel, email, passwordLabel, password, submit);
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (submit.disabled) return;
    submit.disabled = true; writing = true; say('Signing in…');
    try { await store.signIn(email.value, password.value); password.value = ''; writing = false; await refresh(); }
    catch (error) { password.value = ''; say(error.message); }
    finally { writing = false; submit.disabled = false; flushRefresh(); }
  });
  const setup = node('button', 'Set or reset password'); setup.type = 'button'; setup.className = 'secondary';
  setup.addEventListener('click', () => { if (!writing) passwordRequestPanel(); });
  root.append(node('h2', 'Your private collection'), node('p', 'Sign in with your app account. Your session stays saved on this device. No email or text code is used for ordinary sign-in.'), form, setup);
}
function passwordRequestPanel(message = '') {
  passwordScreen = 'request'; passwordMessage = message; clear();
  const form = node('form');
  const email = node('input'); email.type = 'email'; email.autocomplete = 'username'; email.name = 'email'; email.id = 'recovery-email'; email.required = true;
  const label = node('label', 'App account email'); label.htmlFor = email.id;
  const submit = node('button', 'Email password link'); submit.type = 'submit';
  const back = node('button', 'Back to sign in'); back.type = 'button';
  back.addEventListener('click', async () => {
    if (writing) return;
    writing = true;
    try { await store.cancelPasswordRecovery(); passwordScreen = null; passwordMessage = ''; signInPanel(); say('Sign in with your app account.'); }
    catch (error) { say(error.message); }
    finally { writing = false; flushRefresh(); }
  });
  form.append(label, email, submit);
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (writing || submit.disabled) return;
    const current = generation; writing = true; submit.disabled = true; back.disabled = true; say('Requesting a password email…');
    try {
      const result = await store.requestPasswordReset(email.value);
      if (current === generation) {passwordMessage = result; say(result);}
    } catch (error) { if (current === generation) {passwordMessage=error.message; say(error.message);} }
    finally { writing = false; submit.disabled = false; back.disabled = false; flushRefresh(); }
  });
  root.append(node('h2', 'Set or reset your password'), node('p', 'First time here, or forgot your password? Enter your existing app account email. A secure email link lets you choose a new password. This is separate from your Supabase dashboard login.'), node('p', 'Request the link in the browser you want to use, then open the email link in that same browser and device. No code is needed for ordinary sign-in.'), form, back);
  if (message) say(message);
}
function passwordUpdatePanel() {
  passwordScreen = 'update'; clear();
  const form = node('form');
  const password = node('input'); password.type = 'password'; password.autocomplete = 'new-password'; password.name = 'new-password'; password.id = 'new-password'; password.required = true; password.minLength = 12;
  const confirmation = node('input'); confirmation.type = 'password'; confirmation.autocomplete = 'new-password'; confirmation.name = 'confirm-password'; confirmation.id = 'confirm-password'; confirmation.required = true; confirmation.minLength = 12;
  const label = node('label', 'New password'); label.htmlFor = password.id;
  const confirmLabel = node('label', 'Confirm new password'); confirmLabel.htmlFor = confirmation.id;
  const submit = node('button', 'Save new password'); submit.type = 'submit';
  const cancel = node('button', 'Cancel password reset'); cancel.type = 'button';
  cancel.addEventListener('click', async () => {
    if (writing) return; writing = true;
    password.value = ''; confirmation.value = '';
    try { await store.cancelPasswordRecovery(); passwordScreen = null; signInPanel(); say('Password reset cancelled.'); }
    catch (error) {passwordRequestPanel(error.message);}
    finally {writing = false; flushRefresh();}
  });
  form.append(label,password,confirmLabel,confirmation,submit);
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (writing || submit.disabled) return;
    if (password.value.length < 12) {say('Use a unique password of at least 12 characters.'); return;}
    if (password.value !== confirmation.value) {say('The two passwords do not match.'); return;}
    const current = generation; writing = true; submit.disabled = true; cancel.disabled = true; say('Saving your new password…');
    try {
      const result = await store.finishPasswordRecovery(password.value, confirmation.value);
      password.value = ''; confirmation.value = '';
      if (current !== generation) return;
      passwordScreen = 'complete'; clear();
      const signIn = node('button', 'Continue to sign in'); signIn.type = 'button';
      signIn.addEventListener('click', async () => {
        if (writing) return; writing = true;
        try { await store.cancelPasswordRecovery(); signInPanel(); say('Sign in with your new password.'); }
        catch (error) {say(error.message);}
        finally {writing=false;}
      });
      root.append(node('h2', 'Password saved'), node('p', result.signedOut ? 'Your new password is ready. Sign in to open your private guide.' : 'Your password was saved, but sign-out could not be confirmed. Reconnect before continuing.'), signIn);
      say('Password saved.');
    } catch (error) {
      password.value = ''; confirmation.value = '';
      if (current !== generation) return;
      if (['weak_password','same_password'].includes(error.code)) say(error.message);
      else passwordRequestPanel(error.message);
    } finally {writing=false;submit.disabled=false;cancel.disabled=false;flushRefresh();}
  });
  root.append(node('h2','Choose your password'), node('p','Use a unique password of at least 12 characters. Your private guide stays locked until you finish. Your password is sent only to the app’s Supabase authentication service.'), form, cancel);
  say('Password link verified. Choose your new password.');
}
function flushRefresh() { if (pendingRefresh) { pendingRefresh = false; scheduleRefresh(); } }
function scheduleRefresh() {
  if (initializingPassword) { pendingRefresh = true; return; }
  if (inactive()) { pendingRefresh = true; return; }
  if (writing) { pendingRefresh = true; return; }
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => void refresh(), 0);
}
function addSignOut(target) {
  const button = node('button', 'Sign out on this device');
  button.type = 'button'; button.className = 'secondary';
  button.addEventListener('click', async () => {
    if (writing) return;
    writing = true; clear(); say('Signing out…');
    try { await store.signOut(); say('Signed out on this device.'); signInPanel(); }
    catch (error) { say(error.message); addSignOut(root); }
    finally { writing = false; }
  });
  target.append(button);
}
function evidencePanel(data) {
  // A draft is memory-only and bound to the verified owner. Focus refreshes
  // must not destroy its native file input or silently advance its CAS revision.
  if (evidenceDraft && evidenceDraft.ownerId !== data.ownerId) evidenceDraft = null;
  if (evidenceDraft) {
    evidenceDraft.revision = data.evidenceRevision;
    evidenceDraft.summary.textContent = data.evidenceRevision ? `Saved reviewed evidence · revision ${data.evidenceRevision}` : 'Save reviewed screenshot evidence';
    return evidenceDraft.panel;
  }
  const panel = node('details'); panel.className = 'evidence-panel';
  const summary = node('summary', data.evidenceRevision ? `Saved reviewed evidence · revision ${data.evidenceRevision}` : 'Save reviewed screenshot evidence');
  panel.append(summary);
  panel.append(node('p', 'Store the complete reviewed JSON privately so its exact variants, captured ranks, abilities, traits, items, tooltips, and source references can be restored on another device. Original screenshot images are not uploaded. Selecting a file only prepares a preview.'));
  if (data.audit) panel.append(node('p', `${data.audit.mappings.length} exact captured variants from ${data.audit.captureDate}. This is dated evidence, not live progression. No manual rank upkeep is required.`));
  const input = node('input'); input.type = 'file'; input.accept = '.json,application/json'; input.setAttribute('aria-label', 'Reviewed evidence JSON');
  const status = node('p'); status.setAttribute('role', 'status');
  const save = node('button', 'Save reviewed evidence to my account'); save.type = 'button'; save.disabled = true;
  const draft = {panel, summary, ownerId:data.ownerId, revision:data.evidenceRevision, selected:null, selectedRevision:null, selectedGeneration:0};
  evidenceDraft = draft;
  input.addEventListener('change', async () => {
    if (evidenceDraft !== draft || inactive()) return;
    draft.selected = null; save.disabled = true; status.textContent = '';
    const request = ++draft.selectedGeneration; const file = input.files?.[0];
    if (!file) return;
    const expectedRevision = draft.revision;
    status.textContent = 'Validating locally before saving…';
    try {
      if (file.size > 5 * 1024 * 1024) throw Error('The evidence exceeds the 5 MB limit.');
      const parsed = JSON.parse(await file.text());
      if (evidenceDraft !== draft || request !== draft.selectedGeneration || inactive()) return;
      const prepared = await store.prepareEvidence(parsed);
      if (evidenceDraft !== draft || request !== draft.selectedGeneration || inactive()) return;
      draft.selected = prepared.snapshot; draft.selectedRevision = expectedRevision;
      status.textContent = `${prepared.result.audit.mappings.length} exact variants validated. Save will send this reviewed JSON to your private Supabase account and replace the current saved evidence. Source images are not included. Nothing has been uploaded yet.`;
      save.disabled = false;
    } catch (error) {
      if (evidenceDraft !== draft || request !== draft.selectedGeneration) return;
      if (['signed_out','session_changed','not_owner','access_unavailable'].includes(error.code)) await showFailure(error);
      else status.textContent = error.message;
    }
  });
  save.addEventListener('click', async () => {
    if (evidenceDraft !== draft || !draft.selected || writing || root.hidden || inactive()) return;
    const current = generation;
    writing = true; onClear(); for (const control of root.querySelectorAll('button,input')) control.disabled = true;
    try {
      await store.saveEvidence(draft.selected, draft.selectedRevision);
      if (current !== generation) return;
      evidenceDraft = null; writing = false; await refresh();
    } catch (error) { if (current === generation) await showFailure(error); }
    finally { writing = false; flushRefresh(); }
  });
  panel.append(input, status, save); return panel;
}
async function refresh() {
  if (initializingPassword) {pendingRefresh = true; return;}
  if (inactive()) { pendingRefresh = true; clear(); say('Private screen locked.'); return; }
  pendingRefresh = false;
  if (writing) { pendingRefresh = true; return; }
  if (passwordScreen) {
    if (passwordScreen === 'update' && store.passwordRecoveryStatus?.() === 'ready') passwordUpdatePanel();
    else if (passwordScreen === 'complete') {passwordScreen=null; signInPanel(); say('Password saved. Sign in with your new password.');}
    else passwordRequestPanel(passwordMessage);
    return;
  }
  lockForRefresh(); const current = generation; say('Checking private access…');
  try {
    const data = await loadCollection();
    if (generation !== current) return;
    root.replaceChildren();
    const owned = new Set(data.variantIds);
    const header = node('div'); header.className = 'collection-header';
    header.append(node('h2', 'My champions')); addSignOut(header);
    const search = node('input'); search.type = 'search'; search.placeholder = 'Find an exact variant'; search.setAttribute('aria-label', 'Find a champion');
    const refreshButton = node('button', 'Refresh from saved collection'); refreshButton.type = 'button'; refreshButton.className = 'secondary'; refreshButton.addEventListener('click', scheduleRefresh);
    const list = node('div'); list.className = 'champions';
    for (const champion of data.champions) {
      const row = node('label'); row.className = 'champion';
      const checkbox = node('input'); checkbox.type = 'checkbox'; checkbox.checked = owned.has(champion.id);
      const label = [champion.name, champion.gemColor, champion.rarity].filter(Boolean).join(' · ');
      row.dataset.search = label.toLowerCase();
      const description = node('span', label);
      if (champion.evidenceUnavailable) {
        row.className += ' evidence-unavailable';
        description.append(node('strong', 'Reviewed evidence unavailable for this saved variant. Restore its source before using it for recommendations.'));
      }
      row.append(checkbox, description);
      checkbox.addEventListener('change', async () => {
        if (writing || current !== generation) return;
        const requested = checkbox.checked;
        writing = true; evidenceDraft = null; onClear(); for (const control of root.querySelectorAll('button,input')) control.disabled = true;
        say('Saving this champion…');
        try {
          await store.setOwned(champion.id, requested);
          if (current !== generation) return;
          writing = false; await refresh();
        } catch (error) {
          if (current !== generation) return;
          // Access may have been revoked during the write. Never leave private rows visible.
          await showFailure(error);
        } finally {
          writing = false;
          for (const control of root.querySelectorAll('button,input')) control.disabled = false;
          flushRefresh();
        }
      });
      list.append(row);
    }
    if (data.evidenceRevision && data.guideData?.verifiedCollection?.variantIds.length) {
      const addCaptured = node('button','Add captured variants to my collection'); addCaptured.type='button';
      addCaptured.addEventListener('click',async()=>{
        if (writing || current !== generation) return;
        writing=true; evidenceDraft = null; onClear(); for(const control of root.querySelectorAll('button,input')) control.disabled=true;
        say('Adding the captured variants. Existing collection entries are kept.');
        try { await store.addCapturedVariants(data.evidenceRevision); if(current!==generation)return;writing=false;await refresh(); }
        catch(error) {if(current===generation)await showFailure(error);}
        finally {writing=false;flushRefresh();}
      });
      root.append(node('p','The captured set can be added in one step. This keeps every existing owned variant; uncheck only exceptions. No rank, level, or gear tracking is needed.'),addCaptured);
    }
    search.addEventListener('input', () => { for (const row of list.children) row.hidden = !row.dataset.search.includes(search.value.toLowerCase()); });
    if (data.recommendationsBlocked) root.append(node('p', 'Recommendations are blocked: one or more owned variants have no reviewed evidence in the current saved snapshot. Ownership is retained; old catalog wording is not a replacement.'));
    root.append(header, node('p', 'Check the champions you own. Levels, stars, and gear do not need manual upkeep.'), evidencePanel(data), search, refreshButton, list);
    root.hidden = false;
    onCollection(data, {reviewingEvidence:evidenceDraft.panel.open === true});
    say('Loaded your saved collection.');
  } catch (error) {
    if (generation !== current) return;
    await showFailure(error);
  }
}
try {
  if (!store.enabled) {
    say('Private access preview is disabled.');
    root.append(node('p', 'No connection was made. The existing public guide is unchanged. This preview requires an authorized account and database setup before activation.'));
  } else {
    store.watch(event => {
      if (event === 'SIGNED_OUT' && !passwordScreen && !initializingPassword) { clear(); say('Signed out.'); }
      scheduleRefresh();
    });
    window.addEventListener('focus', scheduleRefresh);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduleRefresh(); else { clear(); say('Private screen locked.'); } });
    window.addEventListener('pageshow', () => { pageHidden=false; scheduleRefresh(); });
    window.addEventListener('pagehide', () => { pageHidden=true; clearTimeout(refreshTimer); clear(); say('Private screen locked.'); });
    try {
      const recovering = await store.consumePasswordRecovery?.();
      initializingPassword = false;
      if (recovering) passwordUpdatePanel(); else await refresh();
    } catch (error) {initializingPassword = false; passwordRequestPanel(error.message);}
  }
} catch (error) { clear(); say(error.message); }

return { refresh, clear };
}

// Passwords, Auth codes, and tokens are never logged or copied into app storage.
// The pinned Supabase SDK owns PKCE verifier and session storage.
export const RECOVERY_REDIRECT_URL = 'https://www.gotlegendsguide.com/?password=recovery';
export const PASSWORD_MIN_LENGTH = 12;
const problem = (code, message) => Object.assign(new Error(message), {code});
const invalidLink = () => problem('recovery_invalid', 'This password link is expired, already used, or was opened in a different browser. Request a new link here and open it in this same browser.');

export function createPasswordRecovery({auth, owner, sessionChanged, location = globalThis.location, history = globalThis.history, now = () => Date.now()}) {
  let status = 'none', verifiedOwner = null, consumePromise, submitting = false, requesting = false, nextRequest = 0;
  const currentUrl = () => location?.href ? new URL(location.href) : null;
  const callbackUrl = () => {
    const url = currentUrl();
    if (!url) throw problem('recovery_unavailable', 'Open the guide in your browser to set or reset your password.');
    if (['localhost','127.0.0.1','[::1]'].includes(url.hostname) && ['http:','https:'].includes(url.protocol)) return `${url.origin}/?password=recovery`;
    if (url.origin !== new URL(RECOVERY_REDIRECT_URL).origin) throw problem('recovery_unavailable', 'Open www.gotlegendsguide.com to set or reset your password.');
    return RECOVERY_REDIRECT_URL;
  };
  const cleanUrl = active => {
    const url = currentUrl();
    if (url) history?.replaceState(null, '', `${url.pathname}${active ? '?password=recovery' : ''}`);
  };
  async function requestPasswordReset(email) {
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw problem('email_required', 'Enter your app account email.');
    if (requesting || now() < nextRequest) throw problem('recovery_rate_limit', 'Wait at least one minute before requesting another password link.');
    const redirectTo = callbackUrl();
    requesting = true; nextRequest = now() + 60000;
    try {
      const {error} = await auth.resetPasswordForEmail(email.trim(), {redirectTo});
      if (error) throw problem('recovery_send_failed', 'Could not send a password link. Wait a minute and try again. If it still fails, email delivery needs to be checked.');
      // Do not reveal whether an email belongs to the private owner.
      return 'If this email has an account, a password link is on its way. Open the newest link in this same browser and device. Check spam too. This does not create a new account.';
    } catch (error) {
      if (error.code === 'recovery_send_failed') throw error;
      throw problem('recovery_send_failed', 'Could not confirm the password email. Wait a minute before requesting another link.');
    } finally { requesting = false; }
  }
  async function consume() {
    const url = currentUrl();
    if (url?.searchParams.get('password') !== 'recovery') return false;
    status = 'checking'; verifiedOwner = null;
    const code = url.searchParams.get('code');
    const flowId = url.searchParams.get('sb_flow_id');
    const errorPresent = url.searchParams.has('error') || new URLSearchParams(url.hash.slice(1)).has('error');
    // Scrub codes/errors before any private queries or UI rendering, but retain
    // the recovery marker so reload cannot turn a partial reset into guide access.
    cleanUrl(true);
    try {
      if (errorPresent || !code) throw invalidLink();
      const {data, error} = await auth.exchangeCodeForSession(code, flowId ? {flowId} : undefined);
      if (error || !data?.session || data.redirectType !== 'recovery') throw invalidLink();
      sessionChanged();
      const user = await owner();
      if (user.id !== data.user?.id) throw invalidLink();
      verifiedOwner = user.id; status = 'ready'; return true;
    } catch (error) {
      status = 'invalid'; verifiedOwner = null;
      // Never keep a partially established recovery session after a bad link or
      // a non-owner result. Do not affect the account's other devices.
      await auth.signOut({scope:'local'}).catch(() => {});
      throw error.code === 'not_owner' ? problem('not_owner', 'This account does not have access to the private guide.') : invalidLink();
    }
  }
  async function consumePasswordRecovery() {
    consumePromise ||= consume();
    return consumePromise;
  }
  async function finishPasswordRecovery(password, confirmation) {
    if (status !== 'ready' || !verifiedOwner) throw invalidLink();
    if (submitting) throw problem('recovery_busy', 'Password update is already in progress.');
    if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) throw problem('weak_password', `Use a unique password of at least ${PASSWORD_MIN_LENGTH} characters.`);
    if (password !== confirmation) throw problem('password_mismatch', 'The two passwords do not match.');
    submitting = true;
    try {
      const user = await owner();
      if (user.id !== verifiedOwner || status !== 'ready') throw invalidLink();
      const {data, error} = await auth.updateUser({password});
      if (error) {
        if (error.code === 'same_password') throw problem('same_password', 'Choose a password different from your current password.');
        if (error.code === 'weak_password') throw problem('weak_password', 'This password does not meet the account security requirements. Use a longer, unique password with upper- and lowercase letters, a number, and a symbol.');
        throw problem('password_update_failed', 'Could not confirm the password change. Try signing in with the new password; if it does not work, request a fresh password link.');
      }
      if (data?.user?.id !== verifiedOwner) throw invalidLink();
      status = 'complete'; verifiedOwner = null;
      const result = await auth.signOut({scope:'local'});
      cleanUrl(false);
      return {signedOut: !result.error};
    } catch (error) {
      if (!['weak_password','same_password','password_mismatch'].includes(error.code)) {status='invalid';verifiedOwner=null;}
      throw error.code ? error : problem('password_update_failed', 'Could not confirm the password change. Try signing in with the new password; if it does not work, request a fresh password link.');
    } finally { submitting = false; }
  }
  async function cancelPasswordRecovery() {
    verifiedOwner = null; status = 'cancelled';
    const {error} = await auth.signOut({scope:'local'});
    if (error) throw problem('sign_out_failed', 'The screen is locked, but sign-out could not be confirmed. Reconnect and try again.');
    cleanUrl(false); status = 'none';
  }
  return {requestPasswordReset, consumePasswordRecovery, finishPasswordRecovery, cancelPasswordRecovery, passwordRecoveryStatus: () => status};
}

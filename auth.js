(() => {
  const state = window.RESCATE_AUTH = window.RESCATE_AUTH || { user: null, client: null, ready: false };
  const $ = (selector) => document.querySelector(selector);
  const dialog = $('#authDialog');
  const message = $('#authMessage');
  const form = $('#authForm');
  const emailInput = $('#authEmail');
  const passwordInput = $('#authPassword');
  const loginButton = $('#loginBtn');
  const signupButton = $('#signupBtn');
  const authButton = $('#authAction');
  state.sync = state.sync || { ready: false, paused: false, dirty: false, busy: false, revision: 0, serverUpdatedAt: null, pendingPayload: null, timer: null, loading: null, loadingUserId: null };
  const sync = state.sync;

  function showMessage(text, isError = false) {
    if (!message) return;
    message.textContent = text;
    message.hidden = !text;
    message.classList.toggle('auth-error', isError);
    message.classList.toggle('ok', !isError);
  }

  function setBusy(busy) {
    if (loginButton) loginButton.disabled = busy;
    if (signupButton) signupButton.disabled = busy;
  }

  function setSyncStatus(text, level = 'info', actionLabel = '') {
    const bar = $('#syncStatus');
    const label = $('#syncText');
    const action = $('#syncAction');
    if (!bar || !label) return;
    label.textContent = text;
    bar.hidden = !text;
    bar.dataset.state = level;
    if (action) {
      action.hidden = !actionLabel;
      action.textContent = actionLabel || '';
    }
  }

  function refreshApp() {
    const stockView = $('#stockView'), settingsView = $('#settingsView');
    if (!state.user && ((stockView && !stockView.hidden) || (settingsView && !settingsView.hidden)) && typeof window.switchView === 'function') window.switchView('market');
    if (typeof window.renderOffers === 'function') window.renderOffers();
    if (typeof window.renderInventory === 'function') window.renderInventory();
    if (typeof window.renderSettings === 'function') window.renderSettings();
    if (typeof window.refreshCatalogStatuses === 'function') window.refreshCatalogStatuses();
  }

  function syncUI() {
    if (authButton) authButton.textContent = state.user ? 'Cerrar sesión' : 'Iniciar sesión';
    const stockTab = $('#stockTab');
    if (stockTab) stockTab.textContent = state.user ? 'Mis negocios' : 'Inventario del negocio';
    const account = $('#settingsAccount');
    if (account) account.textContent = state.user ? (state.user.email || 'Cuenta activa') : 'Inicia sesión';
  }

  function showDialog() {
    showMessage('');
    if (dialog && !dialog.open) dialog.showModal();
    if (emailInput) emailInput.focus();
  }

  function friendlyError(error) {
    const raw = String(error && error.message || '').toLowerCase();
    if (raw.includes('invalid login credentials')) return 'El correo o la contraseña no coinciden.';
    if (raw.includes('email not confirmed')) return 'Confirma tu correo desde el enlace que te enviamos y vuelve a iniciar sesión.';
    if (raw.includes('user already registered')) return 'Ese correo ya tiene una cuenta. Inicia sesión en lugar de crear otra.';
    if (raw.includes('password should be at least')) return 'La contraseña debe tener al menos 8 caracteres.';
    if (raw.includes('rate limit') || raw.includes('too many requests')) return 'Se hicieron muchos intentos. Espera un poco y vuelve a probar.';
    return 'No se pudo completar. Revisa los datos y tu conexión, e inténtalo de nuevo.';
  }

  function isServiceOnlyBusinessName(name) { return String(name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('autolavado'); }
  function localKey(userId) { return `rescate-state-v2-user-${userId}`; }
  function emptyState() { return { inventory: [], offers: [], reservations: [], movements: [], demoStock: {}, settings: { businessName: '', zone: 'Atlacomulco', defaultMarginPercent: 30, defaultTaxRate: 16 }, businesses: [], activeBusinessId: '' }; }
  function normalizePayload(value) {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const raw = source.settings && typeof source.settings === 'object' && !Array.isArray(source.settings) ? source.settings : {};
    const margin = Number(raw.defaultMarginPercent), tax = Number(raw.defaultTaxRate);
    const businesses = Array.isArray(source.businesses) ? source.businesses.filter(b => b && typeof b === 'object' && !Array.isArray(b)).map(b => { const m = Number(b.defaultMarginPercent), t = Number(b.defaultTaxRate); return { id: String(b.id || '').slice(0,80), name: String(b.name || 'Mi negocio').slice(0,45), zone: String(b.zone || 'Atlacomulco').slice(0,60), defaultMarginPercent: Number.isFinite(m) && m >= 0 && m <= 500 ? m : 30, defaultTaxRate: Number.isFinite(t) && t >= 0 && t <= 16 ? t : 16, whatsapp: String(b.whatsapp || '').slice(0,22), productSeller: b.productSeller === true && !isServiceOnlyBusinessName(b.name) && b.catalogRole !== 'service-only', catalogRole: isServiceOnlyBusinessName(b.name) || b.catalogRole === 'service-only' ? 'service-only' : 'general' }; }) : [];
    return {
      inventory: Array.isArray(source.inventory) ? source.inventory : [],
      offers: Array.isArray(source.offers) ? source.offers : [],
      reservations: Array.isArray(source.reservations) ? source.reservations : [],
      movements: Array.isArray(source.movements) ? source.movements : [],
      demoStock: source.demoStock && typeof source.demoStock === 'object' && !Array.isArray(source.demoStock) ? source.demoStock : {},
      settings: { businessName: String(raw.businessName || '').slice(0,45), zone: String(raw.zone || 'Atlacomulco').slice(0,60) || 'Atlacomulco', defaultMarginPercent: Number.isFinite(margin) && margin >= 0 && margin <= 500 ? margin : 30, defaultTaxRate: Number.isFinite(tax) && tax >= 0 && tax <= 16 ? tax : 16 },
      businesses,
      activeBusinessId: String(source.activeBusinessId || '').slice(0,80)
    };
  }
  function readLocal(key) {
    try { return normalizePayload(JSON.parse(localStorage.getItem(key) || '{}')); }
    catch (_error) { return emptyState(); }
  }
  function hasData(value) {
    const payload = normalizePayload(value);
    return payload.inventory.length > 0 || payload.offers.length > 0 || payload.reservations.length > 0 || payload.movements.length > 0 || Object.keys(payload.demoStock).length > 0 || payload.businesses.length > 0 || Boolean(payload.settings.businessName) || payload.settings.zone !== 'Atlacomulco' || payload.settings.defaultMarginPercent !== 30 || payload.settings.defaultTaxRate !== 16;
  }
  function samePayload(a, b) { return JSON.stringify(normalizePayload(a)) === JSON.stringify(normalizePayload(b)); }
  function writeLocal(key, value) {
    try { localStorage.setItem(key, JSON.stringify(normalizePayload(value))); return true; }
    catch (_error) { return false; }
  }

  function friendlySyncError(error) {
    const raw = String(error && error.message || '').toLowerCase();
    if (raw.includes('relation') && raw.includes('does not exist')) return 'La tabla de sincronización no está disponible todavía.';
    if (raw.includes('permission') || raw.includes('row-level security')) return 'El acceso seguro no respondió. Mantengo tus cambios en este dispositivo.';
    return 'No pude sincronizar ahora. Tus cambios siguen guardados en este dispositivo.';
  }

  function isCurrentUser(userId) { return Boolean(state.user && state.user.id === userId); }

  async function loadCloud() {
    const user = state.user;
    if (!user || !state.client) return false;
    if (sync.loading && sync.loadingUserId === user.id) return sync.loading;
    sync.ready = false;
    const task = (async () => {
      const key = localKey(user.id);
      setSyncStatus('Cargando los datos privados de tu cuenta…');
      let { data: remote, error } = await state.client.from('rescate_state').select('payload,updated_at').eq('user_id', user.id).maybeSingle();
      if (!isCurrentUser(user.id)) return false;
      if (error) {
        setSyncStatus(friendlySyncError(error), 'error', 'Reintentar');
        return false;
      }

      const useRemote = (row) => {
        if (!isCurrentUser(user.id)) return false;
        const local = readLocal(key);
        if (hasData(local) && !samePayload(local, row.payload)) {
          try { localStorage.setItem(`rescate-conflict-backup-${user.id}-${Date.now()}`, JSON.stringify(local)); } catch (_error) {}
          const useCloud = window.confirm('Hay datos distintos en este teléfono y en la nube. La copia de este teléfono se conservará localmente. Aceptar carga la nube; Cancelar mantiene aquí la copia local y pausa la sincronización.');
          if (!useCloud) {
            sync.serverUpdatedAt = row.updated_at;
            sync.paused = true;
            sync.dirty = true;
            sync.ready = false;
            setSyncStatus('Se conservaron los datos de este teléfono; la sincronización está pausada. Exporta un respaldo antes de resolver el conflicto.', 'error', 'Cargar nube');
            return false;
          }
        }
        if (!writeLocal(key, row.payload)) {
          sync.ready = false;
          setSyncStatus('No pude guardar la copia local por falta de espacio. La nube no se modificó; libera espacio y reintenta.', 'error', 'Reintentar');
          return false;
        }
        sync.serverUpdatedAt = row.updated_at;
        sync.paused = false;
        sync.dirty = false;
        sync.ready = true;
        setSyncStatus('Inventario sincronizado con tu cuenta.', 'ok');
        return true;
      };

      if (remote) return useRemote(remote);

      let initial = readLocal(key);
      if (!hasData(initial)) {
        const guest = readLocal('rescate-state-v2');
        if (hasData(guest)) {
          const copyGuest = window.confirm('Este teléfono tiene datos guardados sin cuenta. ¿Quieres copiarlos a tu cuenta para sincronizarlos? La copia local original no se borrará.');
          initial = copyGuest ? guest : emptyState();
        } else initial = emptyState();
      }
      const { data: inserted, error: insertError } = await state.client.from('rescate_state').insert({ user_id: user.id, payload: initial, updated_at: new Date().toISOString() }).select('updated_at').single();
      if (!isCurrentUser(user.id)) return false;
      if (insertError) {
        if (insertError.code === '23505') {
          const retry = await state.client.from('rescate_state').select('payload,updated_at').eq('user_id', user.id).maybeSingle();
          if (!isCurrentUser(user.id)) return false;
          if (!retry.error && retry.data) return useRemote(retry.data);
          setSyncStatus(friendlySyncError(retry.error || insertError), 'error', 'Reintentar');
          return false;
        }
        setSyncStatus(friendlySyncError(insertError), 'error', 'Reintentar');
        return false;
      }
      if (!writeLocal(key, initial)) {
        sync.ready = false;
        setSyncStatus('La cuenta quedó inicializada en la nube, pero no pude guardar la copia local por falta de espacio. Libera espacio y reintenta.', 'error', 'Reintentar');
        return false;
      }
      sync.serverUpdatedAt = inserted.updated_at;
      sync.paused = false;
      sync.dirty = false;
      sync.ready = true;
      setSyncStatus('Inventario de esta cuenta listo y sincronizado.', 'ok');
      return true;
    })();
    sync.loading = task;
    sync.loadingUserId = user.id;
    try { return await task; }
    catch (_error) {
      if (isCurrentUser(user.id)) setSyncStatus('No pude cargar la sincronización. Tus datos en este dispositivo se conservaron.', 'error', 'Reintentar');
      return false;
    } finally {
      if (sync.loading === task) { sync.loading = null; sync.loadingUserId = null; }
    }
  }

  async function pushNow() {
    if (!state.user || !state.client || !sync.ready || sync.paused || sync.busy || !sync.dirty) return false;
    const userId = state.user.id;
    const revision = sync.revision;
    const payload = normalizePayload(sync.pendingPayload || readLocal(localKey(userId)));
    const expectedVersion = sync.serverUpdatedAt;
    sync.busy = true;
    setSyncStatus('Guardando los cambios en la nube…');
    let data, error;
    try {
      if (expectedVersion) {
        ({ data, error } = await state.client.from('rescate_state').update({ payload, updated_at: new Date().toISOString() }).eq('user_id', userId).eq('updated_at', expectedVersion).select('updated_at').maybeSingle());
      } else {
        ({ data, error } = await state.client.from('rescate_state').insert({ user_id: userId, payload, updated_at: new Date().toISOString() }).select('updated_at').maybeSingle());
      }
    } catch (_error) { error = _error; }
    sync.busy = false;
    if (!isCurrentUser(userId)) return false;
    if (error) {
      setSyncStatus(friendlySyncError(error), 'error', 'Reintentar');
      return false;
    }
    if (!data) {
      sync.paused = true;
      sync.ready = false;
      setSyncStatus('Otro dispositivo cambió los datos. Tus cambios siguen guardados en este teléfono; exporta un respaldo antes de cargar la nube.', 'error', 'Cargar nube');
      return false;
    }
    sync.serverUpdatedAt = data.updated_at;
    if (sync.revision === revision) {
      sync.dirty = false;
      sync.pendingPayload = null;
      setSyncStatus('Sincronizado. Tus datos están disponibles al iniciar sesión en otro dispositivo.', 'ok');
    } else {
      sync.dirty = true;
      window.setTimeout(pushNow, 0);
    }
    return true;
  }

  function scheduleSync(payload) {
    if (!state.user || !state.client || !sync.ready || sync.paused) return;
    sync.pendingPayload = normalizePayload(payload);
    sync.revision += 1;
    sync.dirty = true;
    setSyncStatus('Sincronizando…');
    if (sync.timer) window.clearTimeout(sync.timer);
    sync.timer = window.setTimeout(pushNow, 450);
  }
  window.rescateSync = { schedule: scheduleSync, reload: loadCloud };

  async function pollCloud() {
    if (!state.user || !state.client || !sync.ready || sync.paused || sync.dirty || sync.busy) return;
    const userId = state.user.id;
    const revision = sync.revision;
    let result;
    try { result = await state.client.from('rescate_state').select('payload,updated_at').eq('user_id', userId).maybeSingle(); }
    catch (_error) { return; }
    const { data, error } = result;
    if (error || !data || !isCurrentUser(userId) || data.updated_at === sync.serverUpdatedAt) return;
    if (sync.dirty || sync.busy || sync.revision !== revision) {
      sync.paused = true;
      sync.ready = false;
      setSyncStatus('Otro dispositivo cambió los datos mientras editabas. Tus cambios locales se conservaron; exporta un respaldo antes de resolver el conflicto.', 'error', 'Cargar nube');
      return;
    }
    if (!writeLocal(localKey(userId), data.payload)) {
      setSyncStatus('No pude guardar los cambios recibidos por falta de espacio. La nube no se modificó; libera espacio y reintenta.', 'error', 'Reintentar');
      return;
    }
    sync.serverUpdatedAt = data.updated_at;
    setSyncStatus('Se recibieron cambios de otro dispositivo.', 'ok');
    refreshApp();
  }

  async function applySession(session) {
    const previousId = state.user && state.user.id;
    state.user = session && session.user ? session.user : null;
    state.ready = true;
    syncUI();
    const nextId = state.user && state.user.id;
    if (previousId !== nextId || (nextId && !sync.ready && !sync.loading && !sync.paused)) {
      if (previousId !== nextId && typeof window.switchView === 'function') window.switchView('market');
      if (sync.timer) window.clearTimeout(sync.timer);
      sync.ready = false;
      sync.paused = false;
      sync.dirty = false;
      sync.busy = false;
      sync.serverUpdatedAt = null;
      sync.pendingPayload = null;
      if (state.user) await loadCloud();
      else setSyncStatus('');
      if (isCurrentUser(nextId) || !nextId) refreshApp();
    }
  }

  const config = window.RESCATE_SUPABASE;
  if (window.supabase && typeof window.supabase.createClient === 'function' && config && config.url && config.anonKey) {
    state.client = window.supabase.createClient(config.url, config.anonKey, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
    });
  }

  if (authButton) authButton.addEventListener('click', async () => {
    if (!state.user) {
      showDialog();
      if (!state.client) showMessage('No se pudo cargar el acceso. Revisa tu conexión e inténtalo de nuevo.', true);
      return;
    }
    if (!state.client) return;
    if (sync.dirty && sync.ready) {
      await pushNow();
      if (sync.dirty) {
        showMessage('Hay cambios que todavía no se sincronizaron. Revisa el aviso del inventario antes de cerrar sesión.', true);
        return;
      }
    }
    authButton.disabled = true;
    const { error } = await state.client.auth.signOut();
    authButton.disabled = false;
    if (error) showMessage('No se pudo cerrar la sesión. Inténtalo de nuevo.', true);
  });

  if ($('#closeAuth')) $('#closeAuth').addEventListener('click', () => dialog && dialog.close());

  if (form) form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!state.client) return showMessage('No se pudo conectar con el servicio de acceso. Revisa tu conexión.', true);
    if (!form.reportValidity()) return;
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    setBusy(true);
    showMessage('Iniciando sesión…');
    const { data, error } = await state.client.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return showMessage(friendlyError(error), true);
    await applySession(data.session || { user: data.user });
    showMessage('');
    if (dialog && dialog.open) dialog.close();
    if (typeof window.switchView === 'function') window.switchView('stock');
  });

  if (signupButton) signupButton.addEventListener('click', async () => {
    if (!state.client) return showMessage('No se pudo conectar con el servicio de acceso. Revisa tu conexión.', true);
    if (!form.reportValidity()) return;
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    setBusy(true);
    showMessage('Creando la cuenta…');
    const redirectTo = window.location.origin + window.location.pathname;
    const { data, error } = await state.client.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
    setBusy(false);
    if (error) return showMessage(friendlyError(error), true);
    if (data.session && data.user) {
      await applySession(data.session);
      if (dialog && dialog.open) dialog.close();
      if (typeof window.switchView === 'function') window.switchView('stock');
      return;
    }
    showMessage('Si el registro fue aceptado, te llegará un correo para confirmar la cuenta. Confirma el correo y luego inicia sesión. Revisa también la carpeta de spam.');
  });

  if ($('#syncAction')) $('#syncAction').addEventListener('click', async () => {
    const button = $('#syncAction');
    if (!state.user || !state.client) return;
    button.disabled = true;
    if (sync.dirty && sync.ready && !sync.paused) await pushNow();
    else await loadCloud();
    button.disabled = false;
  });

  syncUI();
  if (!state.client) {
    state.ready = true;
  } else {
    state.client.auth.getSession().then(({ data, error }) => {
      if (!error) applySession(data && data.session);
      else { state.ready = true; syncUI(); }
    }).catch(() => { state.ready = true; syncUI(); });
    state.client.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => applySession(session), 0);
    });
  }
  window.setInterval(pollCloud, 15000);
  window.addEventListener('online', () => {
    if (sync.dirty && sync.ready && !sync.paused) pushNow();
    else if (state.user && !sync.ready && !sync.paused) loadCloud();
  });
})();

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

  function refreshApp() {
    if (typeof window.renderOffers === 'function') window.renderOffers();
    if (typeof window.renderInventory === 'function') window.renderInventory();
    const stockView = $('#stockView');
    if (!state.user && stockView && !stockView.hidden && typeof window.switchView === 'function') window.switchView('market');
  }

  function syncUI() {
    if (authButton) authButton.textContent = state.user ? 'Cerrar sesión' : 'Iniciar sesión';
    const stockTab = $('#stockTab');
    if (stockTab) stockTab.textContent = state.user ? 'Mi inventario' : 'Inventario del negocio';
  }

  function openDialog() {
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

  function applySession(session) {
    const previousId = state.user && state.user.id;
    state.user = session && session.user ? session.user : null;
    state.ready = true;
    syncUI();
    if (previousId !== (state.user && state.user.id)) refreshApp();
  }

  const config = window.RESCATE_SUPABASE;
  if (window.supabase && typeof window.supabase.createClient === 'function' && config && config.url && config.anonKey) {
    state.client = window.supabase.createClient(config.url, config.anonKey, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
    });
  }

  if (authButton) authButton.addEventListener('click', async () => {
    if (!state.user) {
      openDialog();
      if (!state.client) showMessage('No se pudo cargar el acceso. Revisa tu conexión e inténtalo de nuevo.', true);
      return;
    }
    if (!state.client) return;
    authButton.disabled = true;
    const { error } = await state.client.auth.signOut();
    authButton.disabled = false;
    if (error) showMessage('No se pudo cerrar la sesión. Inténtalo de nuevo.', true);
  });

  if ($('#closeAuth')) $('#closeAuth').addEventListener('click', () => dialog && dialog.close());

  if (form) form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!state.client) return showMessage('No se pudo conectar con el servicio de acceso. Revisa tu conexión.', true);
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!form.reportValidity()) return;
    setBusy(true);
    showMessage('Iniciando sesión…');
    const { data, error } = await state.client.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return showMessage(friendlyError(error), true);
    state.user = data.user || (data.session && data.session.user) || null;
    state.ready = true;
    syncUI();
    showMessage('');
    if (dialog && dialog.open) dialog.close();
    refreshApp();
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
    const { data, error } = await state.client.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo }
    });
    setBusy(false);
    if (error) return showMessage(friendlyError(error), true);
    if (data.session && data.user) {
      state.user = data.user;
      state.ready = true;
      syncUI();
      showMessage('Cuenta creada.');
      if (dialog && dialog.open) dialog.close();
      refreshApp();
      if (typeof window.switchView === 'function') window.switchView('stock');
      return;
    }
    showMessage('Si el registro fue aceptado, te llegará un correo para confirmar la cuenta. Confirma el correo y luego inicia sesión. Revisa también la carpeta de spam.');
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
})();

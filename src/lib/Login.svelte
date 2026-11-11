<script lang="ts">
  import { signIn, signUp, resetPassword, toFrenchMessage } from 'famille-core';

  type Mode = 'signin' | 'signup' | 'reset';
  let mode = $state<Mode>('signin');
  let email = $state('');
  let password = $state('');
  let displayName = $state('');
  let busy = $state(false);
  let error = $state('');
  let info = $state('');

  async function submit(e: Event) {
    e.preventDefault();
    error = '';
    info = '';
    busy = true;
    try {
      if (mode === 'signin') await signIn(email, password);
      else if (mode === 'signup') await signUp(email, password, displayName);
      else {
        await resetPassword(email);
        info = 'Si un compte existe pour cette adresse, un e-mail de réinitialisation vient d\'être envoyé.';
      }
    } catch (err) {
      error = toFrenchMessage(err);
    } finally {
      busy = false;
    }
  }

  function go(m: Mode) {
    mode = m;
    error = '';
    info = '';
  }
</script>

<div class="center-screen">
  <div class="brand">
    <div class="logo">🪺</div>
    <h1>Le Petit Perchoir</h1>
    <p class="fc-muted">Nos applications de famille, au même endroit.</p>
  </div>

  <form class="fc-card stack" onsubmit={submit}>
    <h2>
      {mode === 'signin' ? 'Connexion' : mode === 'signup' ? 'Créer un compte' : 'Mot de passe oublié'}
    </h2>

    {#if mode === 'signup'}
      <input class="fc-input" type="text" placeholder="Votre prénom" autocomplete="given-name" bind:value={displayName} required />
    {/if}

    <input class="fc-input" type="email" placeholder="Adresse e-mail" autocomplete="email" inputmode="email" bind:value={email} required />

    {#if mode !== 'reset'}
      <input
        class="fc-input"
        type="password"
        placeholder="Mot de passe"
        autocomplete={mode === 'signup' ? 'new-password' : 'current-password'}
        bind:value={password}
        required
        minlength="6"
      />
    {/if}

    {#if error}<p class="fc-error" role="alert">{error}</p>{/if}
    {#if info}<p class="fc-muted" role="status">{info}</p>{/if}

    <button class="fc-btn fc-btn-primary fc-btn-block" type="submit" disabled={busy}>
      {busy ? 'Un instant…' : mode === 'signin' ? 'Se connecter' : mode === 'signup' ? 'Créer mon compte' : 'Envoyer le lien'}
    </button>

    <div class="row spread">
      {#if mode === 'signin'}
        <button class="link-btn" type="button" onclick={() => go('signup')}>Créer un compte</button>
        <button class="link-btn" type="button" onclick={() => go('reset')}>Mot de passe oublié ?</button>
      {:else}
        <button class="link-btn" type="button" onclick={() => go('signin')}>← Retour à la connexion</button>
      {/if}
    </div>
  </form>
</div>

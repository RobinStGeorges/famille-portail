<script lang="ts">
  import { createFamily, joinFamily, signOutUser, toFrenchMessage } from 'famille-core';

  let { displayName }: { displayName: string } = $props();

  let familyName = $state('Notre famille');
  let code = $state('');
  let busy = $state(false);
  let error = $state('');

  async function create(e: Event) {
    e.preventDefault();
    error = '';
    busy = true;
    try {
      await createFamily(familyName);
    } catch (err) {
      error = toFrenchMessage(err);
    } finally {
      busy = false;
    }
  }

  async function join(e: Event) {
    e.preventDefault();
    error = '';
    busy = true;
    try {
      await joinFamily(code);
    } catch (err) {
      error = toFrenchMessage(err);
    } finally {
      busy = false;
    }
  }
</script>

<div class="stack" style="padding-top: 1rem">
  <div class="brand">
    <div class="logo">👋</div>
    <h1>Bienvenue {displayName} !</h1>
    <p class="fc-muted">Créez votre espace familial, ou rejoignez celui de votre famille.</p>
  </div>

  <form class="fc-card stack" onsubmit={create}>
    <h2>Créer notre espace familial</h2>
    <input class="fc-input" type="text" placeholder="Nom de la famille" maxlength="60" bind:value={familyName} required />
    <button class="fc-btn fc-btn-primary fc-btn-block" type="submit" disabled={busy}>Créer</button>
  </form>

  <form class="fc-card stack" onsubmit={join}>
    <h2>Rejoindre avec un code</h2>
    <p class="fc-muted" style="margin: 0">Demandez le code d'invitation à la personne qui a créé l'espace.</p>
    <input class="fc-input" type="text" placeholder="XXXXX-XXXXX" autocapitalize="characters" autocomplete="off" bind:value={code} required />
    <button class="fc-btn fc-btn-block" type="submit" disabled={busy}>Rejoindre</button>
  </form>

  {#if error}<p class="fc-error" role="alert">{error}</p>{/if}

  <button class="link-btn" type="button" onclick={() => signOutUser()}>Se déconnecter</button>
</div>

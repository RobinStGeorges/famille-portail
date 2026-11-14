<script lang="ts">
  import { session } from 'famille-core';
  import FamilyChooser from './lib/FamilyChooser.svelte';
  import Home from './lib/Home.svelte';
  import Login from './lib/Login.svelte';
  import Settings from './lib/Settings.svelte';
  import UpdateBanner from './lib/UpdateBanner.svelte';

  type View = 'home' | 'settings' | 'families';

  function viewFromHash(): View {
    if (location.hash === '#/reglages') return 'settings';
    if (location.hash === '#/familles') return 'families';
    return 'home';
  }

  let view = $state<View>(viewFromHash());

  $effect(() => {
    const onHash = () => (view = viewFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  });

  const backHome = () => {
    location.hash = '#/';
  };
</script>

<UpdateBanner />

{#if $session.status === 'loading'}
  <div class="center-screen brand">
    <div class="logo">🪺</div>
    <p class="fc-muted">Chargement…</p>
  </div>
{:else if $session.status === 'signedOut'}
  <Login />
{:else if $session.status === 'noFamily'}
  <!-- Aucune famille choisie : on propose celles de la personne (ou d'en créer / rejoindre une). -->
  <FamilyChooser displayName={$session.displayName} canClose={false} onDone={backHome} />
{:else if view === 'families'}
  <FamilyChooser displayName={$session.displayName} canClose={true} onDone={backHome} />
{:else if view === 'settings'}
  <Settings
    familyId={$session.familyId}
    familyName={$session.familyName}
    displayName={$session.displayName}
    email={$session.user.email ?? ''}
    isOwner={$session.isOwner}
  />
{:else}
  <Home displayName={$session.displayName} familyName={$session.familyName} />
{/if}

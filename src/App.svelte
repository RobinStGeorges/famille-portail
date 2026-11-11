<script lang="ts">
  import { session } from 'famille-core';
  import Login from './lib/Login.svelte';
  import Onboarding from './lib/Onboarding.svelte';
  import Home from './lib/Home.svelte';
  import Settings from './lib/Settings.svelte';
  import UpdateBanner from './lib/UpdateBanner.svelte';

  function viewFromHash(): 'home' | 'settings' {
    return location.hash === '#reglages' ? 'settings' : 'home';
  }

  let view = $state(viewFromHash());

  $effect(() => {
    const onHash = () => (view = viewFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  });
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
  <Onboarding displayName={$session.displayName} />
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

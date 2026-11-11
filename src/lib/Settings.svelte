<script lang="ts">
  import {
    createInvite,
    formatInviteCode,
    getThemeChoice,
    leaveFamily,
    setThemeChoice,
    signOutUser,
    toFrenchMessage,
    watchMembers,
    type Member,
    type ThemeChoice,
  } from 'famille-core';

  let {
    familyId,
    familyName,
    displayName,
    email,
    isOwner,
  }: { familyId: string; familyName: string; displayName: string; email: string; isOwner: boolean } = $props();

  let members = $state<Member[]>([]);
  let theme = $state<ThemeChoice>(getThemeChoice());
  let invite = $state<{ code: string; expiresAt: Date } | null>(null);
  let copied = $state(false);
  let busy = $state(false);
  let error = $state('');

  $effect(() => {
    return watchMembers(familyId, (list) => (members = list));
  });

  function chooseTheme(t: ThemeChoice) {
    theme = t;
    setThemeChoice(t);
  }

  async function newInvite() {
    error = '';
    busy = true;
    copied = false;
    try {
      invite = await createInvite(familyId);
    } catch (e) {
      error = toFrenchMessage(e);
    } finally {
      busy = false;
    }
  }

  async function copyCode() {
    if (!invite) return;
    try {
      await navigator.clipboard.writeText(formatInviteCode(invite.code));
      copied = true;
    } catch {
      copied = false;
    }
  }

  async function leave() {
    if (!confirm('Quitter cet espace familial ? Vous pourrez le rejoindre à nouveau avec un nouveau code.')) return;
    error = '';
    busy = true;
    try {
      await leaveFamily(familyId);
    } catch (e) {
      error = toFrenchMessage(e);
      busy = false;
    }
  }

  const themes: { id: ThemeChoice; label: string }[] = [
    { id: 'auto', label: 'Auto' },
    { id: 'light', label: 'Clair' },
    { id: 'dark', label: 'Sombre' },
  ];
</script>

<div class="stack">
  <header class="row spread">
    <h1>Réglages</h1>
    <a class="fc-btn" href="#accueil">← Accueil</a>
  </header>

  <section class="fc-card stack">
    <h2>Mon compte</h2>
    <div><strong>{displayName}</strong><br /><span class="fc-muted">{email}</span></div>
    <button class="fc-btn fc-btn-block" type="button" onclick={() => signOutUser()}>Se déconnecter</button>
  </section>

  <section class="fc-card stack">
    <h2>Espace familial : {familyName}</h2>
    <div>
      {#each members as m (m.uid)}
        <div class="member">
          <span>{m.displayName}</span>
          <span class="badge">{m.role === 'owner' ? 'Propriétaire' : 'Membre'}</span>
        </div>
      {/each}
    </div>

    {#if isOwner}
      {#if invite}
        <div class="code-box">{formatInviteCode(invite.code)}</div>
        <p class="fc-muted" style="margin: 0">
          Valable jusqu'au {invite.expiresAt.toLocaleDateString('fr-FR')}. Communiquez ce code à la personne à inviter.
        </p>
        <button class="fc-btn fc-btn-block" type="button" onclick={copyCode}>
          {copied ? 'Copié ✓' : 'Copier le code'}
        </button>
      {/if}
      <button class="fc-btn fc-btn-primary fc-btn-block" type="button" onclick={newInvite} disabled={busy}>
        {invite ? 'Générer un autre code' : 'Inviter un membre'}
      </button>
    {:else}
      <button class="fc-btn fc-btn-danger fc-btn-block" type="button" onclick={leave} disabled={busy}>
        Quitter l'espace familial
      </button>
    {/if}
    {#if error}<p class="fc-error" role="alert">{error}</p>{/if}
  </section>

  <section class="fc-card stack">
    <h2>Apparence</h2>
    <div class="segmented">
      {#each themes as t (t.id)}
        <button class="fc-btn" class:on={theme === t.id} type="button" onclick={() => chooseTheme(t.id)}>
          {t.label}
        </button>
      {/each}
    </div>
  </section>

  <p class="fc-muted" style="text-align: center">Le Petit Perchoir — version {__APP_VERSION__}</p>
</div>

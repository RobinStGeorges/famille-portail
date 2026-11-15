<script lang="ts">
  import { doc, onSnapshot } from 'firebase/firestore';
  import {
    createFamily,
    deleteFamily,
    getServices,
    joinFamily,
    leaveFamily,
    selectFamily,
    toFrenchMessage,
    watchMyFamilies,
    type MyFamily,
  } from 'famille-core';
  import ConfirmDialog from './ConfirmDialog.svelte';
  import { isFamilyTileColor, tileColor } from './colors';

  let { displayName, canClose, onDone }: { displayName: string; canClose: boolean; onDone: () => void } = $props();

  let families = $state.raw<MyFamily[]>([]);
  let familyColors = $state.raw<Record<string, string>>({});
  let ready = $state(false);
  let busy = $state(false);
  let error = $state('');
  let mode = $state<'none' | 'create' | 'join'>('none');
  let familyName = $state('');
  let code = $state('');
  let pending = $state.raw<MyFamily | null>(null);

  const familyIds = $derived(families.map((family) => family.id).sort().join('\u0000'));

  $effect(() =>
    watchMyFamilies(
      (list, isReady) => {
        families = list;
        ready = isReady;
      },
      () => (ready = true),
    ),
  );

  $effect(() => {
    if (!familyIds) return;
    try {
      const { db } = getServices();
      const stops = familyIds.split('\u0000').map((id) => onSnapshot(
        doc(db, 'families', id),
        (snap) => {
          const name = families.find((family) => family.id === id)?.name ?? '';
          const stored = snap.data()?.tileColor;
          familyColors = {
            ...familyColors,
            [id]: isFamilyTileColor(stored) ? stored : tileColor(name),
          };
        },
        () => {},
      ));
      return () => stops.forEach((stop) => stop());
    } catch {
      return;
    }
  });

  async function choose(f: MyFamily) {
    if (busy) return;
    error = '';
    if (f.active) {
      onDone(); // déjà la famille en cours : on retourne simplement aux applications
      return;
    }
    busy = true;
    try {
      await selectFamily(f.id);
      onDone();
    } catch (e) {
      error = toFrenchMessage(e);
    } finally {
      busy = false;
    }
  }

  async function create(e: Event) {
    e.preventDefault();
    error = '';
    busy = true;
    try {
      await createFamily(familyName);
      onDone();
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
      onDone();
    } catch (err) {
      error = toFrenchMessage(err);
    } finally {
      busy = false;
    }
  }

  // Le propriétaire supprime la famille pour tous ; un membre la quitte (il ne peut pas la supprimer pour les autres).
  async function confirmRemove() {
    const f = pending;
    if (!f) return;
    error = '';
    if (!navigator.onLine) {
      error = 'Une connexion Internet est nécessaire pour cette action.';
      pending = null;
      return;
    }
    busy = true;
    try {
      if (f.role === 'owner') await deleteFamily(f.id);
      else await leaveFamily(f.id);
    } catch (err) {
      error = toFrenchMessage(err);
    } finally {
      busy = false;
      pending = null;
    }
  }

  const removeLabel = (f: MyFamily) => (f.role === 'owner' ? `Supprimer la famille ${f.name}` : `Quitter la famille ${f.name}`);
</script>

<div class="stack">
  <header class="row">
    {#if canClose}
      <a class="fc-btn icon-btn" href="#/" aria-label="Retour aux applications">←</a>
    {/if}
    <div>
      <h1>Mes familles</h1>
      <div class="fc-muted">{displayName ? `Bonjour ${displayName}, ` : ''}choisissez la famille à utiliser.</div>
    </div>
  </header>

  {#if !ready}
    <p class="fc-muted">Chargement de vos familles…</p>
  {:else}
    {#if families.length === 0}
      <div class="fc-card"><p style="margin: 0">Vous ne faites encore partie d'aucune famille. Créez la vôtre, ou rejoignez-en une avec un code d'invitation.</p></div>
    {/if}

    <div class="ftiles">
      {#each families as f (f.id)}
        <div class="ftile" class:active={f.active} style:--tile-color={familyColors[f.id] ?? tileColor(f.name)}>
          <button class="ftile-main" type="button" disabled={busy} onclick={() => choose(f)}>
            <span class="ftile-icon" aria-hidden="true">🏠</span>
            <span class="ftile-name">{f.name}</span>
            <span class="ftile-role">{f.role === 'owner' ? 'Propriétaire' : 'Membre'}{f.active ? ' · en cours' : ''}</span>
          </button>
          <button class="ftile-del" type="button" aria-label={removeLabel(f)} title={removeLabel(f)} disabled={busy} onclick={() => (pending = f)}>✕</button>
        </div>
      {/each}

      <button class="ftile add" type="button" onclick={() => (mode = mode === 'create' ? 'none' : 'create')}>
        <span class="ftile-icon" aria-hidden="true">＋</span>
        <span class="ftile-name">Créer une famille</span>
      </button>
      <button class="ftile add" type="button" onclick={() => (mode = mode === 'join' ? 'none' : 'join')}>
        <span class="ftile-icon" aria-hidden="true">🔑</span>
        <span class="ftile-name">Rejoindre avec un code</span>
      </button>
    </div>

    {#if mode === 'create'}
      <form class="fc-card stack" onsubmit={create}>
        <h2>Créer une famille</h2>
        <input class="fc-input" type="text" placeholder="Nom de la famille (ex. Famille A)" maxlength="60" bind:value={familyName} required />
        <button class="fc-btn fc-btn-primary fc-btn-block" type="submit" disabled={busy}>Créer</button>
      </form>
    {:else if mode === 'join'}
      <form class="fc-card stack" onsubmit={join}>
        <h2>Rejoindre avec un code</h2>
        <p class="fc-muted" style="margin: 0">Demandez le code d'invitation au propriétaire de la famille.</p>
        <input class="fc-input" type="text" placeholder="XXXXX-XXXXX" autocapitalize="characters" autocomplete="off" bind:value={code} required />
        <button class="fc-btn fc-btn-primary fc-btn-block" type="submit" disabled={busy}>Rejoindre</button>
      </form>
    {/if}
  {/if}

  {#if error}<p class="fc-error" role="alert">{error}</p>{/if}
</div>

{#if pending}
  {#if pending.role === 'owner'}
    <ConfirmDialog
      title={`Supprimer la famille « ${pending.name} » ?`}
      message="Tous les membres perdront l'accès à cette famille et à ses données (listes de courses, parties, événements…). Cette action est définitive."
      confirmLabel="Supprimer définitivement"
      {busy}
      onConfirm={confirmRemove}
      onCancel={() => (pending = null)}
    />
  {:else}
    <ConfirmDialog
      title={`Quitter la famille « ${pending.name} » ?`}
      message="Vous n'aurez plus accès à ses données. Elle reste intacte pour les autres membres, et vous pourrez la rejoindre à nouveau avec un nouveau code d'invitation."
      confirmLabel="Quitter la famille"
      {busy}
      onConfirm={confirmRemove}
      onCancel={() => (pending = null)}
    />
  {/if}
{/if}

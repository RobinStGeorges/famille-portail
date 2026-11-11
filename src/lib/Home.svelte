<script lang="ts">
  import { watchCatalog, type CatalogApp } from './catalog';

  let { displayName, familyName }: { displayName: string; familyName: string } = $props();

  let apps = $state<CatalogApp[]>([]);
  let loaded = $state(false);
  let failed = $state(false);

  $effect(() => {
    return watchCatalog(
      (list) => {
        apps = list;
        loaded = true;
        failed = false;
      },
      () => {
        failed = true;
        loaded = true;
      },
    );
  });
</script>

<div class="stack">
  <header class="row spread">
    <div>
      <h1>Bonjour {displayName} 👋</h1>
      <div class="fc-muted">{familyName}</div>
    </div>
    <a class="fc-btn" href="#reglages" aria-label="Réglages" style="min-width: 52px; padding: 0">⚙️</a>
  </header>

  {#if !loaded}
    <p class="fc-muted">Chargement des applications…</p>
  {:else if failed && apps.length === 0}
    <div class="fc-card">
      <p class="fc-error" style="margin: 0">Impossible de charger les applications. Vérifiez votre connexion.</p>
    </div>
  {:else if apps.length === 0}
    <div class="fc-card">
      <p style="margin: 0">Aucune application n'est disponible pour le moment.</p>
    </div>
  {:else}
    <div class="tiles">
      {#each apps as app (app.id)}
        {#if app.status === 'active'}
          <a class="tile" href={app.path} style:--tile-color={app.color}>
            <span class="tile-icon" aria-hidden="true">{app.icon}</span>
            <span>
              <span class="tile-name">{app.name}</span>
              {#if app.description}<span class="tile-desc"><br />{app.description}</span>{/if}
            </span>
          </a>
        {:else}
          <div class="tile disabled" style:--tile-color={app.color} aria-disabled="true">
            <span class="tile-badge">En maintenance</span>
            <span class="tile-icon" aria-hidden="true">{app.icon}</span>
            <span class="tile-name">{app.name}</span>
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</div>

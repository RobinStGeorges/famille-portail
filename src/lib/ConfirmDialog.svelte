<script lang="ts">
  let {
    title,
    message,
    confirmLabel,
    busy = false,
    onConfirm,
    onCancel,
  }: {
    title: string;
    message: string;
    confirmLabel: string;
    busy?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  } = $props();
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && !busy && onCancel()} />

<div class="backdrop" role="presentation" onclick={(e) => e.target === e.currentTarget && !busy && onCancel()}>
  <div class="dialog stack" role="alertdialog" aria-modal="true" aria-labelledby="dlg-title" aria-describedby="dlg-msg">
    <h2 id="dlg-title">{title}</h2>
    <p id="dlg-msg" style="margin: 0">{message}</p>
    <button class="fc-btn fc-btn-danger-solid fc-btn-block" type="button" disabled={busy} onclick={onConfirm}>
      {busy ? 'Un instant…' : confirmLabel}
    </button>
    <button class="fc-btn fc-btn-block" type="button" disabled={busy} onclick={onCancel}>Annuler</button>
  </div>
</div>

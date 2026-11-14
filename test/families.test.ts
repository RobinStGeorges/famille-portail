// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { flushSync, mount, tick, unmount } from 'svelte';

const h = vi.hoisted(() => ({
  createFamily: vi.fn(),
  deleteFamily: vi.fn(),
  joinFamily: vi.fn(),
  leaveFamily: vi.fn(),
  selectFamily: vi.fn(),
  push: (_list: unknown[], _ready: boolean) => {},
}));

vi.mock('famille-core', () => ({
  createFamily: (...a: unknown[]) => h.createFamily(...a),
  deleteFamily: (...a: unknown[]) => h.deleteFamily(...a),
  joinFamily: (...a: unknown[]) => h.joinFamily(...a),
  leaveFamily: (...a: unknown[]) => h.leaveFamily(...a),
  selectFamily: (...a: unknown[]) => h.selectFamily(...a),
  toFrenchMessage: (e: { message?: string }) => e?.message ?? 'Erreur',
  watchMyFamilies: (cb: (l: unknown[], r: boolean) => void) => {
    h.push = cb;
    return () => {};
  },
}));

import FamilyChooser from '../src/lib/FamilyChooser.svelte';
import { tileColor } from '../src/lib/colors';

type F = { id: string; name: string; role: 'owner' | 'member'; active: boolean };
const A: F = { id: 'a', name: 'Famille A', role: 'owner', active: true };
const B: F = { id: 'b', name: 'Famille B', role: 'member', active: false };

let comp: ReturnType<typeof mount> | null = null;
const onDone = vi.fn();
const text = () => (document.body.textContent ?? '').replace(/\s+/g, ' ');
const q = <T extends Element = HTMLElement>(s: string) => document.querySelector<T>(s);
const qa = <T extends Element = HTMLElement>(s: string) => Array.from(document.querySelectorAll<T>(s));
const btn = (label: string) =>
  qa('button, a').find((b) => (b.textContent ?? '').includes(label) || (b.getAttribute('aria-label') ?? '').includes(label));

async function click(el: Element | undefined | null, label: string) {
  if (!el) throw new Error(`Introuvable : ${label}\n${text()}`);
  (el as HTMLElement).click();
  flushSync();
  await tick();
  await Promise.resolve();
  await tick();
}
async function setValue(el: HTMLInputElement, value: string) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  await tick();
}
async function show(list: F[] = [A, B], ready = true) {
  h.push(list, ready);
  await tick();
}
function setOnline(v: boolean) {
  Object.defineProperty(navigator, 'onLine', { value: v, configurable: true });
}

beforeEach(async () => {
  document.body.innerHTML = '';
  Object.values(h).forEach((f) => typeof f === 'function' && 'mockReset' in f && (f as ReturnType<typeof vi.fn>).mockReset());
  h.createFamily.mockResolvedValue('new');
  h.deleteFamily.mockResolvedValue(undefined);
  h.joinFamily.mockResolvedValue(undefined);
  h.leaveFamily.mockResolvedValue(undefined);
  h.selectFamily.mockResolvedValue(undefined);
  onDone.mockReset();
  setOnline(true);
  comp = mount(FamilyChooser, { target: document.body, props: { displayName: 'Robin', canClose: true, onDone } });
  await tick();
});
afterEach(() => {
  if (comp) unmount(comp);
  comp = null;
});

describe('tuiles des familles', () => {
  test('chargement puis une tuile par famille, avec nom et rôle', async () => {
    h.push([], false);
    await tick();
    expect(text()).toContain('Chargement de vos familles');
    await show();
    expect(qa('.ftile:not(.add)')).toHaveLength(2);
    expect(text()).toContain('Famille A');
    expect(text()).toContain('Propriétaire · en cours');
    expect(text()).toContain('Famille B');
    expect(qa('.ftile:not(.add)')[1].textContent).toContain('Membre');
    expect(qa('.ftile.active')).toHaveLength(1);
  });
  test('chaque famille a un bouton « supprimer » rond, en haut à droite de sa tuile', async () => {
    await show();
    const tiles = qa('.ftile:not(.add)');
    for (const t of tiles) {
      const del = t.querySelector<HTMLButtonElement>('.ftile-del');
      expect(del).toBeTruthy();
      expect(del!.textContent).toBe('✕');
      expect(t.lastElementChild).toBe(del); // frère du bouton de sélection, pas imbriqué dedans
      expect(t.querySelector('.ftile-main')!.contains(del!)).toBe(false);
    }
    expect(tiles[0].querySelector('.ftile-del')?.getAttribute('aria-label')).toBe('Supprimer la famille Famille A');
    expect(tiles[1].querySelector('.ftile-del')?.getAttribute('aria-label')).toBe('Quitter la famille Famille B');
  });
  test('tuiles « Créer une famille » et « Rejoindre avec un code »', async () => {
    await show();
    expect(qa('.ftile.add')).toHaveLength(2);
    expect(text()).toContain('Créer une famille');
    expect(text()).toContain('Rejoindre avec un code');
  });
  test('aucune famille : message d\'accueil et possibilité d\'en créer une', async () => {
    await show([]);
    expect(text()).toContain("Vous ne faites encore partie d'aucune famille");
    expect(qa('.ftile:not(.add)')).toHaveLength(0);
    expect(qa('.ftile.add')).toHaveLength(2);
  });
  test('retour aux applications masqué quand aucune famille n\'est encore choisie', async () => {
    unmount(comp!);
    document.body.innerHTML = '';
    comp = mount(FamilyChooser, { target: document.body, props: { displayName: 'Robin', canClose: false, onDone } });
    await show();
    expect(q('a[aria-label="Retour aux applications"]')).toBeNull();
  });
});

describe('choisir une famille', () => {
  test('un clic sur une autre famille la sélectionne puis ouvre les applications', async () => {
    await show();
    await click(qa('.ftile-main')[1], 'famille B');
    expect(h.selectFamily).toHaveBeenCalledWith('b');
    expect(onDone).toHaveBeenCalledTimes(1);
  });
  test('un clic sur la famille déjà active ne change rien et ouvre les applications', async () => {
    await show();
    await click(qa('.ftile-main')[0], 'famille A');
    expect(h.selectFamily).not.toHaveBeenCalled();
    expect(onDone).toHaveBeenCalledTimes(1);
  });
  test('échec de sélection : message affiché, on reste sur l\'écran', async () => {
    h.selectFamily.mockRejectedValue(new Error('Vous ne faites plus partie de cette famille.'));
    await show();
    await click(qa('.ftile-main')[1], 'famille B');
    expect(text()).toContain('Vous ne faites plus partie de cette famille.');
    expect(onDone).not.toHaveBeenCalled();
  });
});

describe('suppression d\'une famille (confirmation)', () => {
  test('propriétaire : fenêtre de confirmation explicite, puis suppression pour tous', async () => {
    await show();
    await click(qa('.ftile-del')[0], 'supprimer A');
    const dialog = q('[role=alertdialog]')!;
    expect(dialog.textContent).toContain('Supprimer la famille « Famille A » ?');
    expect(dialog.textContent).toContain('Tous les membres perdront');
    expect(dialog.textContent).toContain('définitive');
    expect(h.deleteFamily).not.toHaveBeenCalled(); // rien tant que non confirmé
    await click(btn('Supprimer définitivement'), 'confirmer');
    expect(h.deleteFamily).toHaveBeenCalledWith('a');
    expect(h.leaveFamily).not.toHaveBeenCalled();
    expect(q('[role=alertdialog]')).toBeNull();
  });
  test('simple membre : le bouton quitte la famille (il ne peut pas la supprimer pour les autres)', async () => {
    await show();
    await click(qa('.ftile-del')[1], 'quitter B');
    expect(q('[role=alertdialog]')!.textContent).toContain('Quitter la famille « Famille B » ?');
    expect(q('[role=alertdialog]')!.textContent).toContain('intacte pour les autres membres');
    await click(q('[role=alertdialog] .fc-btn-danger-solid'), 'confirmer');
    expect(h.leaveFamily).toHaveBeenCalledWith('b');
    expect(h.deleteFamily).not.toHaveBeenCalled();
  });
  test('annuler ne supprime rien', async () => {
    await show();
    await click(qa('.ftile-del')[0], 'supprimer A');
    await click(btn('Annuler'), 'annuler');
    expect(q('[role=alertdialog]')).toBeNull();
    expect(h.deleteFamily).not.toHaveBeenCalled();
    expect(qa('.ftile:not(.add)')).toHaveLength(2);
  });
  test('touche Échap et clic sur le fond ferment la fenêtre sans rien supprimer', async () => {
    await show();
    await click(qa('.ftile-del')[0], 'supprimer A');
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await tick();
    expect(q('[role=alertdialog]')).toBeNull();
    await click(qa('.ftile-del')[0], 'supprimer A');
    await click(q('.backdrop'), 'fond');
    expect(q('[role=alertdialog]')).toBeNull();
    expect(h.deleteFamily).not.toHaveBeenCalled();
  });
  test('un clic sur la croix ne sélectionne pas la famille', async () => {
    await show();
    await click(qa('.ftile-del')[1], 'quitter B');
    expect(h.selectFamily).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });
  test('hors connexion : action refusée avec un message, rien n\'est envoyé', async () => {
    await show();
    setOnline(false);
    await click(qa('.ftile-del')[0], 'supprimer A');
    await click(btn('Supprimer définitivement'), 'confirmer');
    expect(text()).toContain('connexion Internet est nécessaire');
    expect(h.deleteFamily).not.toHaveBeenCalled();
  });
  test('échec côté serveur : message affiché', async () => {
    h.deleteFamily.mockRejectedValue(new Error("Vous n'avez pas l'autorisation d'effectuer cette action."));
    await show();
    await click(qa('.ftile-del')[0], 'supprimer A');
    await click(btn('Supprimer définitivement'), 'confirmer');
    expect(text()).toContain("pas l'autorisation");
    expect(q('[role=alertdialog]')).toBeNull();
  });
});

describe('créer ou rejoindre une famille', () => {
  test('créer : nom saisi, famille créée puis ouverte', async () => {
    await show();
    await click(qa('.ftile.add')[0], 'créer');
    await setValue(q<HTMLInputElement>('input[placeholder^="Nom de la famille"]')!, 'Famille C');
    await click(q('button[type=submit]'), 'valider');
    expect(h.createFamily).toHaveBeenCalledWith('Famille C');
    expect(onDone).toHaveBeenCalledTimes(1);
  });
  test('rejoindre : code saisi, famille rejointe puis ouverte', async () => {
    await show();
    await click(qa('.ftile.add')[1], 'rejoindre');
    await setValue(q<HTMLInputElement>('input[placeholder="XXXXX-XXXXX"]')!, 'ab3de-fgh2k');
    await click(q('button[type=submit]'), 'valider');
    expect(h.joinFamily).toHaveBeenCalledWith('ab3de-fgh2k');
    expect(onDone).toHaveBeenCalledTimes(1);
  });
  test('code invalide : message affiché, on reste sur l\'écran', async () => {
    h.joinFamily.mockRejectedValue(new Error("Ce code d'invitation n'est pas valide."));
    await show();
    await click(qa('.ftile.add')[1], 'rejoindre');
    await setValue(q<HTMLInputElement>('input[placeholder="XXXXX-XXXXX"]')!, 'MAUVAIS');
    await click(q('button[type=submit]'), 'valider');
    expect(text()).toContain("Ce code d'invitation n'est pas valide.");
    expect(onDone).not.toHaveBeenCalled();
  });
  test('on peut appartenir à plusieurs familles : créer n\'empêche pas d\'en rejoindre une autre', async () => {
    await show();
    await click(qa('.ftile.add')[0], 'créer');
    expect(q('input[placeholder^="Nom de la famille"]')).toBeTruthy();
    await click(qa('.ftile.add')[1], 'rejoindre');
    expect(q('input[placeholder^="Nom de la famille"]')).toBeNull();
    expect(q('input[placeholder="XXXXX-XXXXX"]')).toBeTruthy();
  });
});

describe('couleur des tuiles', () => {
  test('stable pour un même nom, insensible à la casse, toujours une couleur valide', () => {
    expect(tileColor('Famille A')).toBe(tileColor('  famille a '));
    expect(tileColor('Famille A')).toMatch(/^#[0-9a-f]{6}$/i);
    expect(tileColor('')).toMatch(/^#[0-9a-f]{6}$/i);
  });
  test('des noms différents donnent des couleurs variées', () => {
    const colors = new Set(['Famille A', 'Famille B', 'Maman', 'Les Dupont', 'Vacances', 'Amis', 'Bureau', 'Cousins'].map(tileColor));
    expect(colors.size).toBeGreaterThan(3);
  });
});

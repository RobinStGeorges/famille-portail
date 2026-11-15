// @vitest-environment jsdom
// Navigation de l'application entière : chaque lien de l'interface doit mener au bon écran.
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { flushSync, mount, tick, unmount } from 'svelte';

const h = vi.hoisted(() => {
  const subs = new Set<(s: unknown) => void>();
  let current: unknown = { status: 'loading' };
  return {
    set(s: unknown) {
      current = s;
      subs.forEach((f) => f(s));
    },
    session: {
      subscribe(fn: (s: unknown) => void) {
        fn(current);
        subs.add(fn);
        return () => subs.delete(fn);
      },
    },
    createInvite: vi.fn(),
  };
});

vi.mock('famille-core', () => ({
  session: h.session,
  createInvite: (...a: unknown[]) => h.createInvite(...a),
  formatInviteCode: (c: string) => `${c.slice(0, 5)}-${c.slice(5)}`,
  getThemeChoice: () => 'auto',
  setThemeChoice: vi.fn(),
  signOutUser: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  resetPassword: vi.fn(),
  createFamily: vi.fn(),
  joinFamily: vi.fn(),
  selectFamily: vi.fn(),
  deleteFamily: vi.fn(),
  leaveFamily: vi.fn(),
  toFrenchMessage: (e: { message?: string }) => e?.message ?? 'Erreur',
  watchMembers: (_f: string, cb: (m: unknown[]) => void) => {
    cb([
      { uid: 'u1', displayName: 'Robin', role: 'owner' },
      { uid: 'u2', displayName: 'Sophie', role: 'member' },
    ]);
    return () => {};
  },
  watchMyFamilies: (cb: (l: unknown[], r: boolean) => void) => {
    cb([{ id: 'fa', name: 'Famille A', role: 'owner', active: true }, { id: 'fb', name: 'Famille B', role: 'member', active: false }], true);
    return () => {};
  },
  getServices: () => ({ db: {} }),
}));
vi.mock('../src/lib/catalog', () => ({ watchCatalog: (cb: (a: unknown[]) => void) => (cb([]), () => {}) }));

import App from '../src/App.svelte';

const ready = (over: Record<string, unknown> = {}) => ({
  status: 'ready',
  user: { email: 'robin@example.com' },
  displayName: 'Robin',
  familyId: 'fa',
  familyName: 'Famille A',
  isOwner: true,
  ...over,
});

let comp: ReturnType<typeof mount> | null = null;
const text = () => (document.body.textContent ?? '').replace(/\s+/g, ' ');
const q = <T extends Element = HTMLElement>(s: string) => document.querySelector<T>(s);
const link = (label: string) =>
  Array.from(document.querySelectorAll<HTMLAnchorElement>('a')).find((a) => (a.getAttribute('aria-label') ?? a.textContent ?? '').includes(label));
const btn = (label: string) =>
  Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find((b) => (b.textContent ?? '').includes(label));

/** Clique un lien comme le ferait l'utilisateur, puis laisse le navigateur simulé traiter le changement d'adresse. */
async function follow(a: HTMLAnchorElement | undefined, label: string) {
  if (!a) throw new Error(`Lien introuvable : ${label}\n${text()}`);
  a.click();
  await new Promise((r) => setTimeout(r, 5));
  flushSync();
  await tick();
}

async function boot(session: unknown, hash = '') {
  location.hash = hash;
  h.set(session);
  comp = mount(App, { target: document.body });
  await tick();
}

beforeEach(() => {
  document.body.innerHTML = '';
  h.createInvite.mockReset();
  h.createInvite.mockResolvedValue({ code: 'ABCDE12345', expiresAt: new Date(2026, 10, 22) });
});
afterEach(() => {
  if (comp) unmount(comp);
  comp = null;
  location.hash = '';
});

describe('navigation entre les écrans', () => {
  test('accueil : nom de la famille, pastille « changer de famille » et roue dentée', async () => {
    await boot(ready());
    expect(text()).toContain('Bonjour Robin');
    expect(link('changer de famille')?.getAttribute('href')).toBe('#/familles');
    expect(link('Réglages')?.getAttribute('href')).toBe('#/reglages');
  });

  test('la roue dentée ouvre les réglages (régression : le lien et le routage doivent s\'accorder)', async () => {
    await boot(ready());
    await follow(link('Réglages'), 'roue dentée');
    expect(text()).toContain('Mon compte');
    expect(text()).toContain('Espace familial : Famille A');
    expect(text()).not.toContain('Bonjour Robin');
  });

  test('chaque lien de l\'accueil mène à un écran différent de l\'accueil', async () => {
    await boot(ready());
    const hrefs = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')).map((a) => a.getAttribute('href')!);
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      location.hash = '';
      await tick();
      document.body.innerHTML = '';
      unmount(comp!);
      comp = mount(App, { target: document.body });
      await tick();
      const a = Array.from(document.querySelectorAll<HTMLAnchorElement>('a')).find((x) => x.getAttribute('href') === href)!;
      const before = text();
      await follow(a, href);
      expect(text(), `le lien ${href} ne change rien`).not.toBe(before);
    }
  });

  test('un propriétaire peut générer un code d\'invitation depuis les réglages', async () => {
    await boot(ready());
    await follow(link('Réglages'), 'roue dentée');
    expect(text()).toContain('Sophie'); // liste des membres
    (btn('Inviter un membre') as HTMLButtonElement).click();
    await tick();
    await Promise.resolve();
    await tick();
    expect(h.createInvite).toHaveBeenCalledWith('fa');
    expect(text()).toContain('ABCDE-12345');
    expect(btn('Copier le code')).toBeTruthy();
  });

  test('un simple membre voit les réglages mais pas le bouton d\'invitation', async () => {
    await boot(ready({ isOwner: false }), '#/reglages');
    expect(text()).toContain('Mon compte');
    expect(btn('Inviter un membre')).toBeUndefined();
    expect(text()).toContain('Seul le propriétaire');
  });

  test('les réglages mènent à « Mes familles », qui mène aux tuiles', async () => {
    await boot(ready(), '#/reglages');
    await follow(link('Mes familles'), 'mes familles');
    expect(text()).toContain('Mes familles');
    expect(document.querySelectorAll('.ftile:not(.add)')).toHaveLength(2);
  });

  test('retour des réglages vers l\'accueil', async () => {
    await boot(ready(), '#/reglages');
    await follow(link('Accueil'), 'accueil');
    expect(text()).toContain('Bonjour Robin');
  });

  test('la pastille de famille ouvre « Mes familles »', async () => {
    await boot(ready());
    await follow(link('changer de famille'), 'pastille');
    expect(text()).toContain('Mes familles');
    expect(q('a[aria-label="Retour aux applications"]')).toBeTruthy();
  });

  test('ancien lien « #reglages » (favori) toujours accepté', async () => {
    await boot(ready(), '#reglages');
    expect(text()).toContain('Mon compte');
  });

  test('sans famille choisie : on arrive sur « Mes familles », sans bouton retour', async () => {
    await boot({ status: 'noFamily', user: {}, displayName: 'Robin' });
    expect(text()).toContain('Mes familles');
    expect(q('a[aria-label="Retour aux applications"]')).toBeNull();
  });

  test('non connecté : écran de connexion', async () => {
    await boot({ status: 'signedOut' });
    expect(text()).toContain('Connexion');
  });
});

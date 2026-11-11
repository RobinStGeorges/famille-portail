import { collection, onSnapshot } from 'firebase/firestore';
import { getServices } from 'famille-core';

export type AppStatus = 'active' | 'maintenance' | 'hidden';

export interface CatalogApp {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
  color: string; // couleur d'accent (#rrggbb)
  path: string; // ex. /courses/
  status: AppStatus;
  order: number;
}

/** Un chemin d'app doit rester interne au site : /quelquechose/ uniquement. */
export function isSafePath(path: string): boolean {
  return /^\/[a-z0-9\-_/]*$/i.test(path) && !path.includes('//');
}

function isColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
}

export function parseCatalogApp(id: string, data: Record<string, unknown>): CatalogApp | null {
  const status: AppStatus =
    data.status === 'maintenance' || data.status === 'hidden' ? data.status : 'active';
  const path = typeof data.path === 'string' ? data.path : `/${id}/`;
  if (!isSafePath(path)) return null;
  return {
    id,
    name: typeof data.name === 'string' && data.name ? data.name : id,
    description: typeof data.description === 'string' ? data.description : '',
    icon: typeof data.icon === 'string' && data.icon ? data.icon : '📦',
    color: isColor(data.color) ? data.color : '#1f7a63',
    path,
    status,
    order: typeof data.order === 'number' ? data.order : 100,
  };
}

/** Écoute le catalogue : les apps masquées sont filtrées, le reste est trié. */
export function watchCatalog(
  onData: (apps: CatalogApp[]) => void,
  onError: (e: unknown) => void,
): () => void {
  const { db } = getServices();
  return onSnapshot(
    collection(db, 'catalog'),
    (snap) => {
      const apps = snap.docs
        .map((d) => parseCatalogApp(d.id, d.data()))
        .filter((a): a is CatalogApp => a !== null && a.status !== 'hidden')
        .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
      onData(apps);
    },
    onError,
  );
}

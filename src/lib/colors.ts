/** Couleur d'une tuile de famille : stable (même nom = même couleur) et lisible avec du texte blanc. */
const PALETTE = ['#1f7a63', '#1e63c9', '#7b3fe4', '#b8530a', '#ad1457', '#00838f', '#5d4037', '#455a64'];

export function tileColor(name: string): string {
  let h = 0;
  for (const ch of name.trim().toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

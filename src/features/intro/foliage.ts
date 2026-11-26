/** Procedural plant shapes for the jungle welcome, so no image files are needed and every leaf is crisp at any size. */

export type Leaf = {
  kind: "frond" | "broad";
  /** Anchor (the leaf's base) as a fraction of the cluster's width/height. */
  x: number;
  y: number;
  /** Size in px of the leaf's length. */
  size: number;
  /** Resting rotation in degrees; 0 points straight up. */
  rotate: number;
  color: string;
  vein: string;
  layer: "back" | "front";
  /** How strongly this leaf sways, so the group never moves in unison. */
  sway: number;
  phase: number;
};

/** A feather-like frond (fern / palm): a central rib with tapering leaflets either side. Drawn pointing up from (0,0). */
export function frondPaths(length: number, pairs: number, leafletLength: number, leafletWidth: number) {
  let blades = "";
  for (let i = 1; i <= pairs; i++) {
    const t = i / (pairs + 1);
    const y = -length * t;
    const taper = 1 - t * 0.75;
    const len = leafletLength * taper;
    const w = leafletWidth * taper;
    for (const side of [-1, 1]) {
      const ex = side * len * 0.95;
      const ey = y - len * 0.45;
      const mx = side * len * 0.5;
      blades += `M0 ${y.toFixed(1)}Q${(mx).toFixed(1)} ${(y - w * 2).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}Q${(mx).toFixed(1)} ${(y + w * 0.4).toFixed(1)} 0 ${y.toFixed(1)}Z`;
    }
  }
  return { blades, rib: `M0 0L0 ${(-length).toFixed(1)}` };
}

/** A broad, pointed leaf with a midrib and side veins. Drawn pointing up from (0,0), `size` tall. */
export function broadPaths(size: number) {
  const w = size * 0.42;
  const body = `M0 0C${-w} ${-size * 0.18} ${-w * 1.05} ${-size * 0.72} 0 ${-size}C${w * 1.05} ${-size * 0.72} ${w} ${-size * 0.18} 0 0Z`;
  let veins = `M0 0L0 ${-size * 0.96}`;
  for (let i = 1; i <= 5; i++) {
    const y = -size * (0.14 + i * 0.14);
    const reach = w * (0.95 - i * 0.12);
    veins += `M0 ${y.toFixed(1)}Q${(-reach * 0.5).toFixed(1)} ${(y - size * 0.03).toFixed(1)} ${(-reach).toFixed(1)} ${(y - size * 0.1).toFixed(1)}`;
    veins += `M0 ${y.toFixed(1)}Q${(reach * 0.5).toFixed(1)} ${(y - size * 0.03).toFixed(1)} ${reach.toFixed(1)} ${(y - size * 0.1).toFixed(1)}`;
  }
  return { body, veins };
}

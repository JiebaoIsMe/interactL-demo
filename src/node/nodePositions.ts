
import type { ClientNode } from "../mock-data/client";

export type PositionedClientNode = ClientNode & {
  x: number;
  y: number;
};

export function generateClientPositions<T extends { id: number | string }>(
  nodes: T[],
  minDistance = 200,
  maxDistance = 500
): (T & { x: number; y: number })[] {
  return nodes.map((node, index) => {
    const angle =
      (index * 2 * Math.PI) / nodes.length +
      (Math.random() - 0.5) * 0.5;

    const distance =
      minDistance +
      Math.random() * (maxDistance - minDistance);

    return {
      ...node,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
    };
  });
}

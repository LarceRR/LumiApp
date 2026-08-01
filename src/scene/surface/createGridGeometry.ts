import { BufferAttribute, BufferGeometry } from 'three';

/** Line segments for a rectilinear grid aligned to cell boundaries. */
export function createGridGeometry(
  columns: number,
  rows: number,
  cellSize: number,
): BufferGeometry {
  const halfWidth = (columns * cellSize) / 2;
  const halfDepth = (rows * cellSize) / 2;
  const vertices: number[] = [];

  for (let column = 0; column <= columns; column += 1) {
    const x = -halfWidth + column * cellSize;
    vertices.push(x, 0, -halfDepth, x, 0, halfDepth);
  }

  for (let row = 0; row <= rows; row += 1) {
    const z = -halfDepth + row * cellSize;
    vertices.push(-halfWidth, 0, z, halfWidth, 0, z);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));

  return geometry;
}

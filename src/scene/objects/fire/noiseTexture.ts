import { DataTexture, RepeatWrapping, RGBAFormat } from 'three';

const NOISE_SIZE = 64;

/**
 * Cheap value noise baked once at startup. Breaks up the flat emission of the
 * voxel cubes without shipping a texture asset.
 */
export function createFireNoiseTexture(): DataTexture {
  const data = new Uint8Array(NOISE_SIZE * NOISE_SIZE * 4);

  for (let index = 0; index < data.length; index += 4) {
    const value = Math.floor(Math.random() * 256);
    data[index] = value;
    data[index + 1] = value;
    data[index + 2] = value;
    data[index + 3] = 255;
  }

  const texture = new DataTexture(data, NOISE_SIZE, NOISE_SIZE, RGBAFormat);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.needsUpdate = true;

  return texture;
}

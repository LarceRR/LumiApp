export type SurfaceBoundsDto = {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
};

export type SurfaceDto = {
  readonly id: string;
  readonly spaceId: string;
  readonly bounds: SurfaceBoundsDto | null;
  readonly version: number;
};

/** Occupancy is derived from the object list; the surface itself stores no cells. */
export type SurfaceSnapshotDto = {
  readonly surface: SurfaceDto;
  readonly objects: readonly import('./surface-object').SurfaceObjectDto[];
};

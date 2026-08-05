import { describe, expect, it } from 'vitest';

import {
  DEFAULT_SURFACE_BACKGROUND,
  gridColorFor,
  isLightSurface,
  surfaceLuminance,
} from './surfaceTheme';

describe('gridColorFor', () => {
  it('на белом фоне даёт прежний светло-серый грид', () => {
    expect(gridColorFor(DEFAULT_SURFACE_BACKGROUND)).toBe('#EBEBEB');
  });

  it('на тёмном фоне осветляет линии вместо затемнения', () => {
    const background = '#14100D';

    expect(surfaceLuminance(gridColorFor(background))).toBeGreaterThan(
      surfaceLuminance(background),
    );
  });

  it('понимает короткую запись цвета', () => {
    expect(gridColorFor('#fff')).toBe('#EBEBEB');
  });

  it('на мусоре не падает и возвращает валидный цвет', () => {
    expect(gridColorFor('не цвет')).toMatch(/^#[0-9A-F]{6}$/);
  });
});

describe('isLightSurface', () => {
  it('делит палитру на светлую и тёмную половину', () => {
    expect(isLightSurface('#FFFFFF')).toBe(true);
    expect(isLightSurface('#0B0B0C')).toBe(false);
  });
});

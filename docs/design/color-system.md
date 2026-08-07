# Lumi colour system

A colour system for an app whose main character is not the UI. The hero is the
flame on the surface; everything else is the room it burns in.

## The three rules

1. **Nothing else is allowed to be saturated.** The flame is the only object in
   the app with full chroma. Every neutral, every control, every card sits below
   it. If a screen feels flat, the fix is contrast in *lightness*, never more
   colour.
2. **No pure white, no pure black.** `#FFFFFF` reads as unfinished and fatigues
   at night; `#000000` smears on OLED and kills atmosphere. We ship a warm paper
   stock and a violet-tilted near-black instead.
3. **Dark mode is a different room, not an inversion.** Surfaces get *lighter*
   as they come forward, the accent shifts one step brighter, and dividers stop
   being ink and start being light.

## Why these hues

| Family | Role | Hue | Reasoning |
| --- | --- | --- | --- |
| `paper` | Light neutrals | ~85° | Warm off-white. Paper, wax, unbleached stock. Reads as an object you own rather than a screen you visit. |
| `basalt` | Dark neutrals | ~300° | Near-black tilted violet-brown. Cool blue-blacks feel clinical; a violet bias reads as dusk, which is when this app is actually opened. |
| `ember` | Primary | ~55° | Burnt saffron rather than a safety-cone orange. High arousal, positive valence — the colour of the thing the user came to create. |
| `damson` | Secondary | ~340° | Muted plum. Long-wavelength but low chroma: intimacy and memory without turning the product into a Valentine's card. |
| `verdigris` | Tertiary | ~180° | Patina teal. The cognitive counterweight to the flame — used for duration, streaks, and anything that should feel *settled*. |

Signals (`moss`, `madder`, `saffron`) are deliberately desaturated. A destructive
action should be legible, not louder than a lit match.

## Construction

Every ramp was laid out in **OKLCH** — even lightness steps, constant hue, chroma
tapering at the light and dark ends — then written down as sRGB hex because React
Native has no OKLCH parser. Working in OKLCH is what keeps `ember400` and
`verdigris400` reading as the *same weight* despite being 125° apart in hue;
HSL would not.

Ramp lightness targets (OKLCH L):

```
paper    099 → 072
basalt   008 → 078
ember    095 → 038
damson   088 → 032
verdigris 088 → 035
```

## Token layers

```
palette.ts    raw ramps        ember500, basalt850, paper050 …
themes.ts     semantic tokens  accent, surfaceRaised, textSecondary …
themeStore.ts active scheme    system | light | dark
```

Screens never name a hue. They name a job (`accent`, `surfaceSunken`,
`textTertiary`) and the active theme decides which hue does that job.

```tsx
const theme = useThemeColors();
<View style={[styles.card, { backgroundColor: theme.surfaceRaised }]} />;
```

`colors` (the old static export) is still there and still points at the light
theme. Dozens of `StyleSheet.create` calls capture colours at module scope and
cannot react to a theme switch anyway, so migrating them one at a time is safe.

## Scene colours

The 3D surface has its own token set (`lightScene` / `darkScene`). Two things
matter there:

- **The flame is theme-independent.** Its values are authored above 1.0 and feed
  the HDR bloom pass. A fire does not change colour because you turned the lights
  off.
- **The grid is felt, not read.** Grid lines sit within ~4% lightness of their
  own background. The user should sense the cells without ever counting them.

## Accessibility

- `textPrimary` on `surface` clears 4.5:1 in both schemes.
- `textSecondary` on `surface` clears 4.5:1 in both schemes.
- `textTertiary` is a non-essential tier — never the only carrier of meaning.
- `accentOn` is the paired foreground for anything filled with `accent`.
- `focusRing` is a separate token so focus never borrows the accent's opacity.

## Adding a colour

Don't, if a token already does the job. If you must:

1. Add it to a ramp in `palette.ts` with its OKLCH intent in the comment.
2. Give it a job in **both** `lightTheme` and `darkTheme`. Never one.
3. `colorSystem.spec.ts` will fail if the token sets drift apart.

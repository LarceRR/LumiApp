# ТЗ: паритет Blender «Angry Fire Emoji» → React Native (`src/scene/surface-objects`)

> Источник: `C:\Users\larce\Downloads\cartoon_Fire_angry_emoji_3d_model.blend`  
> Blender: **5.2.0 LTS**, движок превью: **EEVEE**, color management: **Filmic**  
> Дата разбора: 2026-08-01  
> Цель этапа: зафиксировать сцену 1:1 до реализации. Реализация — отдельным шагом.

---

## 1. Цель продукта

Воссоздать в LumiApp (R3F Native / Three.js) визуал cartoon-огонька из Blender:

1. Ядро-эмодзи (жёлто-оранжевая светящаяся сфера).
2. Оболочка пламени (вытянутый icosphere с displacement + emissive/transparent шейдер).
3. Точечный тёплый свет с мерцанием.
4. **Бесконечная** живая анимация (в Blender таймлайн конечный и в конце «гасит» огонь).

Текущий код (`Fire.glb` + `Flame_Core` / `Flame_Noise` + FBM-шейдер) — **другая авторская модель**. Паритет требует новой иерархии, материалов и параметров из этого `.blend`, а не тонкой подстройки существующих шейдеров «на глаз».

---

## 2. Иерархия сцены (что входит в продукт)

### 2.1. Продуктовые объекты (обязательны)

| Blender object | Тип | Материал | Роль |
|---|---|---|---|
| `Sphere.001` | Mesh (UV sphere, 482 v / 512 f) | `lambert1` | **Ядро / лицо эмодзи** |
| `fire` | Mesh (Icosphere subdiv≈4, 2562 v / 5120 f) | `Glow` | **Оболочка пламени** |
| `inside glow` | Mesh (UV sphere, 482 v / 512 f) | `Material` | Внутренний шар под ядром (сейчас почти нейтральный Principled) |
| `Point` | Point Light | — | Локальная тёплая подсветка огонька |

### 2.2. Модификаторы на `fire`

| Modifier | Strength | Mid | Direction | Space | Texture coords | Texture |
|---|---:|---:|---|---|---|---|
| `Displace` | **0.2** | 0.5 | NORMAL | LOCAL | OBJECT (object не назначен → фактически object/local fallback) | `Texture` = **MARBLE** |
| `Displace.001` | **0.1** | 0.5 | NORMAL | LOCAL | LOCAL | `Texture.001` = **CLOUDS** |

**Marble (`Texture`):**

- `noise_basis`: BLENDER_ORIGINAL  
- `noise_type`: SOFT_NOISE  
- `noise_scale`: **0.25**  
- `noise_depth`: **2**  
- `turbulence`: **5.0**  
- `marble_type`: SOFT  
- `noise_basis_2`: SIN  
- `nabla`: 0.025  

**Clouds (`Texture.001`):**

- `noise_basis`: BLENDER_ORIGINAL  
- `noise_type`: SOFT_NOISE  
- `noise_scale`: **0.25**  
- `noise_depth`: **2**  
- `nabla`: 0.025  

> Важно: оба displace **не анимированы**. Силуэт пламени в `.blend` статичен. Живое мерцание в файле даёт в основном свет + финальный dissolve шейдера.

### 2.3. Студия / не переносить в app

- `Plane`, `Plane.001`, `Plane.002` — чёрный металлический циклорама (`Material.001`: Base `#000`, Metallic 1, Roughness 0.5).
- `Camera.001`, `Light` (белый point energy 1000 — студийный ключ).
- `Empty.001`, `pSphere1`, `pSphere2`, `transform1`, `transform2` — наследие импорта (Maya-подобные empties), на финальный вид не влияют.
- `Sphere` (скрыт, `hide_render=true`, mat `Ember.002`) — шаблон инстанса для партиклов; **particle system сейчас ни к одному объекту не привязан**, но настройки `ParticleSettings.001` в файле есть (см. §7).

### 2.4. Коллекции

```
Scene Collection
├── fire, Plane*, Sphere (ember template), transform*
└── model/
    ├── Sphere.001 (core)
    ├── inside glow
    ├── Point (warm light)
    ├── Camera.001, Light, Empty.001, pSphere*
```

---

## 3. Трансформы и пропорции (нормализовать к ядру)

Мировая система Blender: Z-up. В Three.js / сцене Lumi — Y-up. При экспорте GLB через стандартный путь Blender→glTF ось конвертируется; в ТЗ ниже — **числа из Blender**, плюс целевые **относительные** метрики для RN.

### 3.1. Абсолютные (Blender world)

| Object | Location (X,Y,Z) | Scale | Dimensions (X,Y,Z) |
|---|---|---|---|
| `Sphere.001` | (0, 0.716, 4.618) | 3.834 | ≈ 7.668³ |
| `inside glow` | (0, 0.964, 4.696) | 3.478 | ≈ 6.955³ |
| `fire` | (0, 2.971, 5.474) | 4.745 | ≈ (10.46, 10.27, 20.22) |
| `Point` | (0, 0, 0.603) | 1 | — |

`fire` local bbox (до object-scale):  
`min ≈ (-1,-1,-1)`, `max ≈ (1,1, 3.239)` → вытянут вверх по +Z примерно в **2.12×** радиуса базы.

### 3.2. Относительные метрики (использовать в коде)

Нормализовать так, чтобы **диаметр ядра = 1.0**:

| Метрика | Значение |
|---|---:|
| Диаметр ядра | **1.000** |
| Диаметр `inside glow` | **0.907** |
| Высота оболочки `fire` | **≈ 2.638** (= 20.22 / 7.67) |
| Ширина оболочки | **≈ 1.364** |
| `fire.height / fire.width` | **≈ 1.934** |
| `core.diameter / fire.height` | **≈ 0.379** |

Смещение оболочки относительно центра ядра (Blender XYZ, до конвертации осей):

- `fire - core ≈ (0, +2.255, +0.856)`  
  → оболочка смещена вперёд/вверх относительно ядра (пламя «сидит» на эмодзи и тянется вверх).

Смещение внутреннего шара:

- `inside glow - core ≈ (0, +0.248, +0.078)` — почти соосно, чуть меньше ядра.

Точка света относительно ядра:

- `Point - core ≈ (0, -0.716, -4.015)` — в Blender свет почти у пола под моделью; для app-инстанса лучше **привязать Point к локальному центру ядра** (0,0,0) с небольшим подъёмом, сохранив цвет/энергию/flicker, иначе на белой поверхности Lumi свет будет бить «не туда». Зафиксировать в реализации как осознанный апп-адапт (см. §10).

### 3.3. Посадка на клетку поверхности

Существующий `fitFireToCell` (`FIRE_CELL_FILL = 0.85`) остаётся паттерном:

1. Собрать группу `FireRoot = { insideGlow, core, flameShell, pointLight }`.
2. `Box3` по всей группе (или только по `fire`+`core`, если light не должен влиять на fit).
3. Масштаб так, чтобы max(dim) = `SURFACE_CELL_WORLD_SIZE * 0.85`.
4. Offset: база на `y=0`, центр XZ на клетке.

Сохранить детерминированный yaw из `fireYawRadians(id)`.

---

## 4. Материал ядра `lambert1` (`Sphere.001`)

### 4.1. Principled BSDF (фактические значения в файле)

| Сокет | Значение |
|---|---|
| Base Color | linear RGB ≈ `(0.731, 0.435, 0.000)` |
| Metallic | ← `emoji_lambert1_Metallic.png` (**файл отсутствует**, `has_data=false`) |
| Roughness | ← `emoji_lambert1_Roughness.png` (**отсутствует**) |
| Normal | Normal Map strength **1.0** ← `emoji_lambert1_Normal.png` (**отсутствует**) |
| Emission Color | linear ≈ `(1.000, 0.401, 0.015)` |
| Emission Strength | **3.3** |
| Alpha | 1.0 |
| Specular IOR Level | 0.5 |

Без текстур ядро читается как **плоский оранжево-жёлтый emissive шар** (то, что видно в viewport).

### 4.2. Целевое поведение в RN

- `MeshStandardMaterial` / `MeshPhysicalMaterial`:
  - `color`: из Base Color (конвертация linear→sRGB при записи в Three Color).
  - `emissive`: Emission Color.
  - `emissiveIntensity`: **3.3** (подогнать под tone mapping сцены; в app сейчас Filmic/ACES может отличаться — калибровать визуально, старт с 3.3).
  - `metalness` / `roughness`: пока константы **0.0 / 0.45** (fallback без карт).
  - `toneMapped`: **true** для ядра (как у текущего `createFlameCoreMaterial`), bloom подхватит яркость.
- Если текстуры будут найдены по пути `D:\3D works\Emoji\emoji texture\*.png` — подключить как в Blender (Normal/Roughness/Metallic). До этого в ТЗ считать их **optional enhancement**.

### 4.3. `inside glow` (`Material`)

Сейчас: Base `(0.8,0.8,0.8)`, Roughness 0.4, Emission выключен, Normal Map strength **0**.  
Визуально почти не читается под ярким `lambert1`.

**Решение для паритета:**

- Вариант A (строго как файл): оставить тусклый внутренний шар.  
- Вариант B (рекомендуемый для app): сделать soft emissive duplicate ядра с intensity ~0.5–1.0 и чуть большим scale opacity, либо **не экспортировать**, если в превью не даёт вклада.

Зафиксировать в реализации после side-by-side: если вклад < порога — не тащить лишний draw call.

---

## 5. Материал пламени `Glow` (`fire`) — главный шейдер

`blend_method = BLEND`, `surface_render_method = BLENDED`, backface culling **off**.  
Два Material Output: Cycles и EEVEE (EEVEE-ветка отключает тень через Light Path).

### 5.1. Граф (логика)

```
Texture Coordinate.Object
        │
        ├─► Mapping(loc=0.7,0,0; rot=0,-π/2,0; scale=1,1,0.2)
        │         │
        │         ▼
        │   Gradient Texture (LINEAR) ──► ColorRamp ──► Emission.Color
        │                                              Emission.Strength = 5.0
        │                                                    │
        └─► Magic Texture (scale=1.5, distortion=1.0, depth=2)
                  │
                  ▼
            ColorRamp.001 (0.01→black, 1→white)
                  │
                  ▼
            Math LESS_THAN  ◄── Layer Weight.001.Facing   (Blend анимирован)
                  │
                  ▼
            Mix Shader.001
              Factor = Math
              A (0) = Emission
              B (1) = Transparent
                  │
                  ▼
            Mix Shader
              Factor = Layer Weight.Facing   (Blend = 0.2, static)
              A (0) = Mix Shader.001
              B (1) = Transparent
                  │
                  ▼
            [EEVEE] Mix Shader.002 «Disable Shadow»
              Factor = Light Path.Is Shadow Ray
              A = результат выше, B = Transparent
                  │
                  ▼
            Material Output
```

### 5.2. Семантика (как это выглядит)

1. **Вертикальный градиент цвета пламени** (Object coords → Mapping → Gradient → ColorRamp → Emission):
   - Mapping: Location X=`0.7`, Rotation Y=`-90°`, Scale Z=`0.2` (сжимает градиент, даёт «языки» по высоте).
   - Emission strength = **5.0**.

2. **Дырявая маска «магии»** (Magic Texture → BW ramp → сравнение с fresnel/facing):
   - `LESS_THAN(magicMask, layerWeight001.Facing)`:
     - `true (1)` → Transparent  
     - `false (0)` → Emission  
   - То есть эмиссия там, где magic ≥ facing-порога. Facing зависит от угла к камере → маска «живая» при орбите камеры даже без таймлайна.

3. **Внешний fresnel-шелл** (`Layer Weight` Blend=`0.2`, output Facing):
   - Factor=0 → огонь (Mix001)  
   - Factor=1 → Transparent  
   - При взгляде в лоб (высокий Facing) оболочка прозрачнее → просвечивает ядро.  
   - На силуэте больше огня. Классический cartoon fire shell вокруг сферы.

4. **Disable Shadow** (только EEVEE output): тень от пламени не рисуется.

### 5.3. ColorRamp пламени (`ColorRamp`) — linear RGB + approx sRGB hex

| Position | RGBA (linear) | ≈ sRGB hex |
|---:|---|---|
| 0.000 | (0, 0, 0, 0) | `#000000` α0 |
| 0.127273 | (1.000, 0.0367, 0.0190, 1) | `#FE3525` |
| 0.742754 | (1.000, 0.0785, 0.0000, 1) | `#FE4F00` |
| 1.000 | (1.000, 0.8300, 0.0299, 1) | `#FEEA30` |

Интерполяция: LINEAR.  
Направление в Blender: низ градиента ближе к чёрному/красному, верх — к жёлтому (зависит от Mapping). В шейдере RN воспроизвести **тот же Mapping** в object/local space.

### 5.4. ColorRamp.001 (маска)

| Position | Color |
|---:|---|
| 0.01 | чёрный |
| 1.00 | белый |

### 5.5. Magic Texture

- Vector: Object  
- Scale: **1.5**  
- Distortion: **1.0**  
- `turbulence_depth`: **2**

### 5.6. Layer Weight

| Node | Blend | Output used | Animated? |
|---|---:|---|---|
| `Layer Weight` | **0.2** | Facing → outer Mix | нет |
| `Layer Weight.001` | **0.3 → 1.0** | Facing → Math threshold | **да, конец клипа** |

---

## 6. Анимация в Blender (факт) vs анимация в Web (требование)

### 6.1. Таймлайн файла

| Параметр | Значение |
|---|---|
| Frame range | **24 → 144** |
| FPS | **24** |
| Длительность | **5.0 s** |
| `use_cyclic` на actions | **false** |

### 6.2. Что реально анимировано

#### A. `Shader NodetreeAction` → материал `Glow`

- Path: `nodes["Layer Weight.001"].inputs[0].default_value`  
- Keys:  
  - frame **96** → **0.3**  
  - frame **144** → **1.0**  
- Interpolation: Bezier, Auto Clamped  
- Extrapolation: Constant  

Эффект: во второй половине клипа порог маски растёт → пламя **растворяется / гаснет**. Это и есть «конечная анимация в конце».

#### B. `Point.001Action` → `Point` light `energy`

- Один ключ: frame **19** → energy **100**  
- F-Curve modifier **Noise** (не mute):
  - strength **200**  
  - scale **1.0**  
  - phase **1.0**  
  - depth **0**  
  - restricted range: frames **0…140**  
- F-Curve modifier **Limits**: `use_min_y = true`, `min_y = 0`  
- Наблюдаемый диапазон energy на span: **≈ 40.5 … 159.5**, среднее ≈ 100  

Эффект: мерцание освещённости.

#### C. Чего нет (критично для ожиданий)

- Нет keyframes на Mapping Location / Magic Scale.  
- Нет анимации Displace strength / texture offset.  
- Нет drivers / `#frame`.  
- Mesh bounds после modifiers **идентичны** на кадрах 24/96/144.  
- Партиклы в сцене **не эмитятся** (settings есть, modifier/system на объекте нет).

### 6.3. Требование: бесконечный loop в Web

**Не переносить** dissolve `Layer Weight.001: 0.3→1.0` как one-shot.

Вместо этого целевой infinite runtime:

| Слой | Поведение в RN | Старт-параметры |
|---|---|---|
| 1. Light flicker | `energy = 100 + noise(t)` , clamp ≥ 0, амплитуда как в Blender (~±60 от базы, peaking ~40…160) | `period ≈ 1.0s` (noise scale 1 @ 24fps), phase seed от `id` |
| 2. Flame mask scroll | Анимировать offset UV/object coords Magic Texture: `offset.y += speed * dt` (или domain warp time) | скорость подобрать 0.4…1.2 цикла/сек визуально |
| 3. Vertex displace | В vertex shader: 2 октавы noise (аналог Marble+Clouds), strength 0.2 и 0.1 в **локальных** единицах mesh; time scroll вверх | `uTime` общий с материалом |
| 4. Shell fresnel | Outer LayerWeight blend **0.2** константа | как в файле |
| 5. Mask threshold | `LayerWeight.001` blend держать около **0.3** (рабочее значение до dissolve), опционально лёгкий ping-pong **0.25…0.35** | без ухода в 1.0 |
| 6. Camera-facing mask | Сохранить зависимость маски от view (Facing) | паритет с Blender |

Loop должен быть **бесшовным** (шум/time, не клип 0…5s). Длительность Blender 5s — только референс темпа flicker, не длина цикла.

---

## 7. Партиклы / угли (optional backlog)

В файле есть `ParticleSettings.001`, но **не прикреплены** к объекту:

| Param | Value |
|---|---|
| type | EMITTER |
| count | 1000 |
| lifetime | 15 |
| frame_start/end | -15 … 150 |
| emit_from | FACE |
| normal_factor | 7.0 |
| factor_random | 0.3 |
| particle_size | 0.05 |
| size_random | 1.0 |
| render_type | OBJECT → instance `Sphere` |
| physics | NEWTON |
| brownian_factor | 50 |
| material | `Ember.002` (emission ramp, strength 5, shadow off) |

**Вне MVP паритета.** Если понадобятся искры — отдельная задача (GPU particles / sprites), не блокирует shell+core.

---

## 8. Свет и постэффект

### 8.1. Point (продуктовый)

| Param | Value |
|---|---|
| type | POINT |
| color linear | `(1.0, 0.5396, 0.0)` ≈ sRGB `#FEC200` |
| energy base | 100 (с noise) |
| shadow_soft_size | 0.25 |
| cutoff_distance | 40 |
| use_shadow | true (в Blender); в app — по quality flag |

В Lumi на светлой поверхности (`surfaceBase #DFD8C9`) energy 40…160 будет другим, чем на чёрном циклораме. Калибровка:

1. Старт: `intensity` Three.js ≈ remap `energy/100` * k, k подобрать (часто 1…3).  
2. Цвет оставить.  
3. Flicker — относительный: `intensity * (0.4 … 1.6)`.

### 8.2. Bloom

В Blender 5.2 EEVEE **нет** старых `use_bloom_*` на `scene.eevee` (bloom ушёл в compositor/glare). Визуальный glow в превью = emission + Filmic.

В app уже есть задел:

- `FIRE_BLOOM_DEFAULTS`: strength 0.6, radius 0.35, threshold 0.78  
- `FireBloom` / `fireBloom.ts`

Для паритета: оставить bloom, но **перекалибровать threshold** под новые emissive 3.3 / 5.0, чтобы shell не уходил в белую кашу на `#DFD8C9`.

### 8.3. World

Background ≈ linear grey `(0.051, 0.051, 0.051)` — студия. В app мир задаёт surface scene; не копировать чёрный фон.

---

## 9. Геометрия и экспорт

### 9.1. Рекомендуемый GLB

Одна сцена-шаблон:

```
FireEmoji (root)
├── Flame_Shell        ← mesh `fire` (Icosphere), без baked displace ИЛИ с applied
├── Flame_Core         ← mesh `Sphere.001`
├── Flame_InnerGlow    ← optional `inside glow`
└── (light создаётся кодом, не из GLB)
```

Имена согласовать с `fireFit.ts` (`Flame_Core`, `Flame_Noise`/`Flame_Shell`).

### 9.2. Displace: bake vs runtime

| Подход | Плюсы | Минусы |
|---|---|---|
| **A. Runtime vertex displace в шейдере** (рекомендуется) | Бесконечная анимация, дешёвый инстанс, паритет «живого» огня | Нужно подобрать 2 слоя noise ≈ Marble+Clouds |
| B. Apply modifiers → static GLB | Точный силуэт кадра 0 | Мёртвая форма, нет loop motion |
| C. Morph targets нескольких кадров | Средне | Тяжело, всё равно конечный клип |

**Выбор по ТЗ: A.** Базовая геометрия — icosphere subdiv 4 (или экспорт `fire` с applied=false). Силуэт из Marble(0.2)+Clouds(0.1) воспроизвести в VS.

### 9.3. Центрирование

Перед экспортом желательно:

1. Поставить `Sphere.001` в origin.  
2. Пересчитать origin оболочки так, чтобы база пламени совпадала с низом ядра.  
3. Применить scale (Ctrl+A) аккуратно, сохранив пропорции §3.2.

---

## 10. Маппинг на текущий код `src/scene/surface-objects`

| Файл сейчас | Что делает | Что менять по ТЗ |
|---|---|---|
| `FireInstance.tsx` | Клон GLB, tick materials, yaw, spawn opacity | Новый template group; point light per instance или shared pooled light |
| `fireFit.ts` | Ищет `Flame_Core` / `Flame_Noise`, готовит materials | Имена `Flame_Shell` + core; убрать привязку только к FBM noise mat |
| `fireFlameMaterial.ts` | Custom FBM flame shader | **Заменить** логикой Glow (§5): gradient ramp + magic mask + fresnel mix + time scroll |
| `fireCoreMaterial.ts` | Emissive yellow Standard | Параметры `lambert1` (§4): color/emissive/intensity 3.3 |
| `FireField.tsx` | Culling видимых огоньков | Без изменений контракта; следить за cost (shell transparent = дорого) |
| `kindPresentation.ts` | `emitsLight: true` | Оставить; реально включить Point flicker |
| `assets/models/Fire.glb` | Старая модель | Заменить экспортом из этого `.blend` |

### 10.1. Шейдер оболочки — контракт uniforms (черновик API)

```ts
type FireGlowUniforms = {
  uTime: number;
  uOpacity: number;          // spawn/focus dimming (уже есть паттерн)
  uEmissionStrength: number; // 5.0
  uFresnelBlend: number;     // 0.2 (outer Layer Weight)
  uMaskBlend: number;        // ~0.3 (Layer Weight.001, без dissolve)
  uMagicScale: number;       // 1.5
  uMagicDistortion: number;  // 1.0
  uGradientLoc: vec3;        // (0.7, 0, 0)
  uGradientRotY: number;     // -PI/2
  uGradientScale: vec3;      // (1, 1, 0.2)
  uColorStops: ...;          // 4 stops из §5.3
  uDisplace1: number;        // 0.2
  uDisplace2: number;        // 0.1
  uNoiseScroll: number;      // speed for infinite motion
};
```

Blending: `NormalBlending`, `transparent: true`, `depthWrite: false`, `side: DoubleSide` (как backface off + shell).  
Не использовать Additive на белой surface (уже зафиксировано в текущем коде).

### 10.2. Производительность

- На каждый видимый огонёк: 2–3 mesh + optional light.  
- `maxInstancesPerKind` в quality store — пересмотреть после профайла (transparent shell дороже текущего).  
- Шарить геометрию template; materials clone per instance (как сейчас).  
- Point lights: либо один light только у spawning/focused, либо capped N nearest.

---

## 11. Цветовой паритет vs design tokens

Текущие tokens:

```ts
fireCore: '#F8AE3A'
fireCoreEmissive: '#F4E64C'
fireShell: '#F37557'
```

Из Blender (ориентиры):

| Роль | Blender | Предлагаемый token update |
|---|---|---|
| Core base | ≈ orange-brown linear | пересчитать в sRGB и заменить `fireCore` |
| Core emissive | `(1, 0.401, 0.015)` × 3.3 | новый `fireCoreEmissive` |
| Shell gradient | `#FE3525 → #FE4F00 → #FEEA30` | `fireShell` / отдельные stops в шейдере |
| Point light | `#FEC200` | `fireLight` |

Токены обновить **после** визуальной калибровки на `surfaceBase`, не слепо копировать linear floats.

---

## 12. Критерии приёмки

### Визуал

- [ ] На клетке: жёлто-оранжевое ядро + красно-оранжево-жёлтая оболочка с «дырявой» структурой.  
- [ ] Оболочка сильнее на силуэте, ядро читается в центре (fresnel shell).  
- [ ] Пропорция высота пламени / диаметр ядра ≈ **2.64** (±10%).  
- [ ] Цветовой градиент оболочки совпадает с ramp §5.3 (side-by-side скрин с Blender frame 60).  

### Анимация

- [ ] Анимация **бесконечная**, без финального dissolve.  
- [ ] Мерцание света непрерывное, амплитуда ощутима, seed разный per id.  
- [ ] Маска/displace движутся (scroll), силуэт «живой».  
- [ ] Нет скачка при loop (нет перезапуска 5s клипа).  

### Интеграция

- [ ] Spawn focus opacity / dimming работают через `uOpacity`.  
- [ ] Fit в клетку `FIRE_CELL_FILL=0.85`, база на поверхности.  
- [ ] Culling `FireField` не регрессирует.  
- [ ] Bloom не выжигает поверхность до белого.  

### Не входит в MVP

- [ ] Embers/particles  
- [ ] PBR maps эмодзи (пока missing)  
- [ ] Студийный чёрный пол / камера Blender  

---

## 13. План реализации (после утверждения ТЗ)

1. Экспорт GLB: `Flame_Core` + `Flame_Shell` (+ optional inner), origin/нормализация осей.  
2. Заменить `createFlameCoreMaterial` параметрами `lambert1`.  
3. Написать `createFireGlowMaterial` по графу §5 + time scroll + VS displace.  
4. Подключить Point light flicker.  
5. Убрать one-shot dissolve; mask blend = 0.3.  
6. Калибровка на device (bloom, intensity, scroll speed).  
7. Регрессия: spawn tour, fog cull, multi-instance.  
8. (Backlog) textures + embers.

---

## 14. Приложение: шпаргалка чисел

```
Timeline: 24..144 @ 24fps (5s) — только референс; в web не использовать как клип
Glow Emission Strength: 5.0
Core Emission Strength: 3.3
Outer fresnel blend: 0.2
Mask blend (steady): 0.3
Magic: scale 1.5, distortion 1.0, depth 2
Gradient mapping: loc (0.7,0,0), rotY -90°, scale (1,1,0.2)
Displace: 0.2 marble + 0.1 clouds, noise_scale 0.25, depth 2
Point: color (1, 0.54, 0), energy 100 ± noise(strength 200, scale 1) → ~40..160
Shell/core height ratio: ~2.64 (core diam / fire height ~0.379)
```

---

## 15. Открытые решения (нужен ответ заказчика только если спорно)

1. **`inside glow`**: оставляем / выкидываем / делаем soft emissive? (рекомендация: выкинуть, если слепой A/B не отличим)  
2. **Текстуры эмодзи**: есть ли актуальные PNG, или ядро без maps OK?  
3. **Point light per instance** vs только near-camera lights?  
4. Подтвердить, что **runtime displace + magic scroll** (которого нет ключами в Blender) — желаемый способ сделать огонь бесконечно живым.

---

*Конец ТЗ. Реализацию не начинать, пока ТЗ не подтверждено.*

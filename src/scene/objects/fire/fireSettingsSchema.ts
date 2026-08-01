import {
  colorField,
  numberField,
  type SettingsSchema,
  settingsGroup,
} from '../core/settingsSchema';

function layerFields(prefix: 'ember' | 'flame'): SettingsSchema[number]['fields'] {
  return [
    numberField(`${prefix}.maxParticles`, 'Количество', 4, 200, 1),
    numberField(`${prefix}.lifeTime`, 'Время жизни', 0.3, 5, 0.1),
    numberField(`${prefix}.speedMin`, 'Скорость, мин', 0.1, 10, 0.1),
    numberField(`${prefix}.speedMax`, 'Скорость, макс', 0.1, 10, 0.1),
    numberField(`${prefix}.scaleFrom.min`, 'Начальный размер, мин', 0.001, 0.6, 0.001),
    numberField(`${prefix}.scaleFrom.max`, 'Начальный размер, макс', 0.001, 0.6, 0.001),
    numberField(`${prefix}.scaleTo.min`, 'Конечный размер, мин', 0.001, 0.6, 0.001),
    numberField(`${prefix}.scaleTo.max`, 'Конечный размер, макс', 0.001, 0.6, 0.001),
    numberField(`${prefix}.spread`, 'Разброс', 0, 2, 0.05),
    numberField(`${prefix}.multiply`, 'Яркость', 0.1, 15, 0.1),
    numberField(`${prefix}.rangeY`, 'Высота градиента', 0.2, 6, 0.1),
    colorField(`${prefix}.brightColor`, 'Цвет у основания'),
    colorField(`${prefix}.dimColor`, 'Цвет на вершине'),
  ];
}

/**
 * Ordered top to bottom exactly as the settings sheet renders it.
 * Adding a knob here is the only step needed to expose it in the app.
 */
export const fireSettingsSchema: SettingsSchema = [
  settingsGroup('general', 'Общее', [
    numberField('globalSpeed', 'Скорость', 0, 2, 0.01),
    numberField('worldScale', 'Размер', 0.1, 0.8, 0.01),
    numberField('bottomRound', 'Смягчение основания', 0, 1, 0.01),
    numberField('idleParticleFactor', 'Детализация вдали', 0.1, 1, 0.05),
  ]),
  settingsGroup('flame', 'Пламя', layerFields('flame')),
  settingsGroup('ember', 'Угли', layerFields('ember')),
  settingsGroup('wind', 'Ветер', [
    numberField('wind.strength', 'Сила', 0, 3, 0.01),
    numberField('wind.direction', 'Направление', 0, 360, 1),
    numberField('wind.minHeight', 'Нижняя граница', -1, 3, 0.1),
    numberField('wind.maxHeight', 'Верхняя граница', 0, 5, 0.1),
  ]),
  settingsGroup('bloom', 'Свечение', [
    numberField('bloom.strength', 'Сила', 0, 2, 0.01),
    numberField('bloom.radius', 'Радиус', 0, 1, 0.01),
    numberField('bloom.threshold', 'Порог', 0, 1, 0.01),
  ]),
];

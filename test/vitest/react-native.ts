export const Appearance = {
  getColorScheme: (): 'light' => 'light',
  addChangeListener: (): { remove: () => void } => ({ remove: () => undefined }),
};

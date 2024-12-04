import { onCleanup } from 'solid-js';
import { createSignal } from 'solid-js';

export function windowWidthSignal() {
  const [width, setWidth] = createSignal(window.innerWidth);
  const updateWidth = () => setWidth(window.innerWidth);
  window.addEventListener('resize', updateWidth);

  onCleanup(() => window.removeEventListener('resize', updateWidth));

  return width;
}

export function windowHeightSignal() {
  const [height, setHeight] = createSignal(window.innerHeight);
  const updateHeight = () => setHeight(window.innerHeight);
  window.addEventListener('resize', updateHeight);

  onCleanup(() => window.removeEventListener('resize', updateHeight));

  return height;
}

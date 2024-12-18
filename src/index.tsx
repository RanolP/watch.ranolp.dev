/* @refresh reload */
import { render } from 'solid-js/web';
import 'virtual:uno.css';
import 'virtual:unocss-devtools';
import '@unocss/reset/tailwind.css';

import App from './App.tsx';

const root = document.getElementById('root');

render(() => <App showStreaming={false} />, root!);

import type { AppProps } from 'next/app';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';

const theme = createTheme({ palette: { primary: { main: '#2563eb' }, secondary: { main: '#0f766e' } }, shape: { borderRadius: 12 }, typography: { fontFamily: 'Arial, "Noto Sans TC", sans-serif' } });
export default function App({ Component, pageProps }: AppProps) {
  return <ThemeProvider theme={theme}><CssBaseline /><Component {...pageProps} /></ThemeProvider>;
}

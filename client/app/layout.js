import './globals.css';
import AuthProvider from '../components/AuthProvider';

export const metadata = { title: 'Counter POS' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Fraunces:opsz,wght@9..144,600&display=swap" rel="stylesheet" />
      </head>
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}

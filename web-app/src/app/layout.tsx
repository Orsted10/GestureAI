import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'GestureAI – Real-time Sign Language Recognition',
  description:
    'Detect ASL words in real time, build sentences, and hear them spoken — 100% on-device.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* TensorFlow.js core */}
        <Script src="/tfjs/tf.min.js" strategy="beforeInteractive" />
        {/* TFLite runtime */}
        <Script src="/tflite/tf-tflite.min.js" strategy="beforeInteractive" />
        {/* MediaPipe */}
        <Script src="/mediapipe/camera_utils/camera_utils.js" strategy="beforeInteractive" />
        <Script src="/mediapipe/drawing_utils/drawing_utils.js" strategy="beforeInteractive" />
        <Script src="/mediapipe/holistic/holistic.js" strategy="beforeInteractive" />
        {/* Pyodide for Python IDE */}
        <Script src="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js" strategy="beforeInteractive" />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

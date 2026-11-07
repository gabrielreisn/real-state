import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// Nest relies on emitDecoratorMetadata, which Vitest's default transform does not support.
export default defineConfig({
  test: { include: ['test/**/*.test.ts'] },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
      jsc: {
        target: 'es2023',
        parser: { syntax: 'typescript', decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
      },
    }),
  ],
});

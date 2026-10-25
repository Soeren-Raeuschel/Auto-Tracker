import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  base: './', // works on GitHub Pages and Netlify
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/domain/**',
        'src/scoring/**',
        'src/application/**',
        'src/validation/**',
        'src/infrastructure/**',
        'src/ui/viewmodels/rankingViewModel.ts',
      ],
      exclude: ['**/*.test.ts'],
      thresholds: { lines: 80, functions: 80, statements: 80, branches: 70 },
    },
  },
});

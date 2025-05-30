import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/BudgetME_V2/',
  plugins: [react()],
}); 
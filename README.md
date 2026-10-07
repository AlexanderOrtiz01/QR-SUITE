# QR-SUITE

Proyecto React + Vite.

## Stack

- React 19
- Vite 6
- Tailwind CSS 4 (vía `@tailwindcss/vite`)
- ESLint 9 + Prettier

Por decisión del equipo no se migra a versiones mayores de las dependencias
por ahora: Dependabot solo propone actualizaciones minor y patch (ver
`.github/dependabot.yml`).

## Requisitos

Node.js 22 LTS (la versión está en `.nvmrc`: con nvm basta `nvm use`).

## Scripts

```bash
npm install

npm run dev          # servidor de desarrollo (http://localhost:5173)
npm run build        # build de producción
npm run preview      # previsualizar el build
npm run lint         # ESLint
npm run format       # Prettier --write
npm run format:check # Prettier --check
npm test             # Vitest
```

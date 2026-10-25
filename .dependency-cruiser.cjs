/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'domain-is-standalone',
      comment: 'Die Domain darf nichts außerhalb von src/domain importieren.',
      severity: 'error',
      from: { path: '^src/domain', pathNot: '\\.test\\.tsx?$' },
      to: { path: '^(?!src/domain)' },
    },
    {
      name: 'validation-not-in-domain',
      comment: 'Validierung (Zod) lebt bewusst nicht in der Domain.',
      severity: 'error',
      from: { path: '^src/domain' },
      to: { path: '^src/validation' },
    },
    {
      name: 'ui-no-infrastructure',
      comment:
        'UI und ViewModels hängen nur an Ports/Application, nicht an konkreten Adaptern. Verkabelung nur in composition.',
      severity: 'error',
      from: { path: '^src/ui' },
      to: { path: '^src/infrastructure' },
    },
    {
      name: 'application-no-ui',
      severity: 'error',
      from: { path: '^src/(application|scoring|validation|infrastructure|ports)' },
      to: { path: '^src/ui' },
    },
    {
      name: 'no-restricted-externals',
      comment: 'Nur die in docs/TASKS.md erlaubten externen Pakete.',
      severity: 'error',
      from: {},
      to: {
        dependencyTypes: ['npm'],
        pathNot:
          'node_modules/(react|react-dom|zod|react-router-dom|@fontsource-variable/manrope|lucide-react|lottie-web|vitest)/',
      },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: { extensions: ['.ts', '.tsx'] },
  },
};

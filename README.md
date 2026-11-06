# plugin-rsc dev can't evaluate a CommonJS require cycle

In `vite dev`, a CommonJS package whose files `require()` each other in a cycle throws while it goes through plugin-rsc's CJS to ESM transform, and the page answers 500. `vite build` + `vite preview` work, and so does dev when the package is left external so Node requires it.

The starter as scaffolded doesn't show it, because server deps are external by default. It shows up once the package is bundled in a server environment (`resolve.noExternal`), which is what sends it through the transform. I hit it through vinext with `semver` (pulled in by `@launchdarkly/node-server-sdk`; its `classes/range.js` and `classes/comparator.js` require each other) and with `jszip`.

This is plugin-rsc's starter (`pnpm create vite --template rsc`) plus:

- `packages/cjs-cycle`: a tiny CJS package where `a.js` and `b.js` require each other, same shape as semver's range/comparator. Node is fine with it: `node -e "const { A } = require('./packages/cjs-cycle'); console.log(new A().toB().toA() instanceof A)"` prints `true`.
- `src/root.tsx` uses it, and `semver.satisfies`, in the root server component.
- `vite.config.ts` puts both in `environments.rsc.resolve.noExternal`.

Use pnpm. The `file:` dependency has to be copied into `node_modules` for the transform to pick it up, and pnpm does that (npm symlinks it instead).

## Steps

```sh
pnpm i
pnpm dev
curl -i http://localhost:5173/
```

## Actual

500, and the dev server prints (paths shortened):

```
[vite] Internal server error: Cannot read properties of undefined (reading '__cjs_module_runner_transform')
    at eval (node_modules/.pnpm/cjs-cycle@file+packages+cjs-cycle/node_modules/cjs-cycle/b.js?v=13f7ffb8:8:155)
    at Array.every (<anonymous>)
    at __cjs_interop__ (node_modules/.pnpm/cjs-cycle@file+packages+cjs-cycle/node_modules/cjs-cycle/b.js?v=13f7ffb8:8:105)
    at eval (node_modules/.pnpm/cjs-cycle@file+packages+cjs-cycle/node_modules/cjs-cycle/b.js:9:11)
    at async ESModulesEvaluator.runInlinedModule (node_modules/.pnpm/vite@8.3.6/node_modules/vite/dist/node/module-runner.js:807:3)
    at async ModuleRunner.directRequest (node_modules/.pnpm/vite@8.3.6/node_modules/vite/dist/node/module-runner.js:1262:59)
    at async ModuleRunner.cachedRequest (node_modules/.pnpm/vite@8.3.6/node_modules/vite/dist/node/module-runner.js:1169:73)
    at async eval (node_modules/.pnpm/cjs-cycle@file+packages+cjs-cycle/node_modules/cjs-cycle/a.js:9:11)
```

`semver` on its own fails the same way. Take `'cjs-cycle'` out of `noExternal` and the error moves to `semver/classes/range.js`, required from `semver/classes/comparator.js`. The ssr environment does the same if the package is in its `noExternal` and used from a client component.

## Expected

The page renders `cjs-cycle: true` and `semver: true`, the way it does with either of these:

```sh
pnpm build && pnpm preview
EXTERNAL=1 pnpm dev   # both packages left external, Node requires them
```

Versions: @vitejs/plugin-rsc 0.5.39, vite 8.3.6, @vitejs/plugin-react 6.2.1, react 19.3.1, Node 24.18.0, pnpm 10.8.1, macOS.

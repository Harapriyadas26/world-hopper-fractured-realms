# Asset credits

All environment arrangements, stone texture generation, primitive character meshes, enemy meshes, weapons, portals, UI and synthesized oscillator effects are original source-generated work for World Hopper. No attached reference image, Temple Run branding, character design, commercial soundtrack, downloaded character pack or third-party artwork is included.

System fonts: Georgia and Segoe UI (or local browser fallbacks); no fonts are redistributed or downloaded at runtime.

Runtime libraries are npm dependencies. Their authoritative installed license texts are included in their package directories and should be retained when redistributing dependencies:

- React / React DOM — MIT (`node_modules/react/LICENSE`, `react-dom/LICENSE`).
- Three.js — MIT (`node_modules/three/LICENSE`).
- React Three Fiber / Drei — MIT (respective package LICENSE files).
- React Three Rapier — MIT; Rapier compatibility package — Apache-2.0 (respective installed license files).
- Zustand — MIT (`node_modules/zustand/LICENSE`).

The game does not require external art or audio servers. Dependencies are pinned by `package-lock.json`. Inspect installed license texts for complete attribution terms.

The Rapier packages omit some license text in their published npm archives. Upstream license copies are retained in public/licenses and included in builds: [React Three Rapier MIT](https://github.com/pmndrs/react-three-rapier/blob/master/LICENSE), [Rapier Apache-2.0](https://github.com/dimforge/rapier/blob/master/LICENSE).

# The Wild Between

An original cinematic WebGL short built as a scroll-directed landscape. The camera moves through dawn, encounter, pursuit and blue hour. A rigged fox changes between survey, walk and run animation states. Pointer movement places the warm lure on desktop; the `Place the light` control provides a touch alternative.

## Run locally

Serve `dist` through any static HTTP server. ES modules and the remote glTF asset will not load correctly from a `file://` URL.

```bash
npx serve dist
```

## Accessibility and fallback

- Keyboard skip link and sound control
- User-controlled sound, off by default
- Reduced-motion camera state
- CSS landscape fallback when WebGL cannot initialize
- Separate mobile camera field of view, render scale and touch interaction

## Licensed asset

`Fox.glb` is loaded from the Three.js examples CDN. Model by PixelMannen, rig and animation by tomkranis, glTF conversion by AsoboStudio and scurest. Distributed under CC BY 4.0. The page includes visible attribution.

## Main references

See `../formed-space/dist/REFERENCES.md` for the shared reference study. No proprietary reference assets or layouts are included.

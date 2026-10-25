# Deploy the-wild-between

## GitHub
1. Create a **new empty repository** named `the-wild-between`.
2. Unzip this archive and upload the contents of its top-level folder to the repository root, including `dist/` and `vercel.json`.
3. Commit the files.

## Vercel
1. In Vercel, choose **Add New → Project**, then import the GitHub repository.
2. Framework preset: **Other**.
3. Root directory: repository root.
4. Build command: **leave empty**; output directory: **dist**.
5. Deploy. Changes pushed to the GitHub repo will trigger subsequent deployments.

## Local preview
Run `python -m http.server 8000 --directory dist` from the archive root, then open http://localhost:8000.

## Notes
The Wild Between uses CDN-loaded Three.js and attempts to load the rigged Fox.glb externally. Its fallback fox geometry is embedded in the site, so the story shows an animal even if Fox.glb is unavailable. WebGL still must be enabled.

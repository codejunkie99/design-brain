# Publishing

## Publish to npmjs

```bash
npm run build
npm test
npm publish --access public
```

## Publish from a dedicated GitHub repo

```bash
# create repo and push
git init
git add .
git commit -m "feat: initial design-brain-memory package"
git branch -M main
git remote add origin git@github.com:design-brain/design-brain.git
git push -u origin main
```

Consumers can install from GitHub:

```bash
npm install -g github:design-brain/design-brain
```

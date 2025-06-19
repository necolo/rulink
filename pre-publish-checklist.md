# Pre-Publish Checklist

## ✅ Build & Package
- [ ] `pnpm build` runs without errors
- [ ] `npm pack` creates proper tarball
- [ ] Tarball contains only necessary files
- [ ] Binary is executable (`packages/cli/bin/cursor-rules.js`)
- [ ] TypeScript declarations are generated

## ✅ Functionality Tests
- [ ] All 5 commands work: install, remove, update, list, status
- [ ] Project detection works (git, npm, nested)
- [ ] Rules are copied correctly
- [ ] Error handling is graceful
- [ ] Verbose mode provides useful output

## ✅ Package Metadata
- [ ] Version is correct in package.json
- [ ] Dependencies are accurate
- [ ] Binary path is correct
- [ ] Files array includes necessary files
- [ ] License is specified

## ✅ Cross-Platform
- [ ] Works on your OS
- [ ] Executable permissions are set
- [ ] Path separators work correctly
- [ ] No OS-specific dependencies

## ✅ Real-World Testing
- [ ] Tested in actual TypeScript project
- [ ] Tested in React project
- [ ] Tested in empty directory
- [ ] Tested with --to custom path
- [ ] Tested remove functionality

## ✅ Performance
- [ ] Commands respond quickly (<2s)
- [ ] No memory leaks during operation
- [ ] Large project handling is reasonable

## ✅ Documentation
- [ ] README has correct installation steps
- [ ] All commands are documented
- [ ] Examples work as written
- [ ] Troubleshooting section is helpful

## ✅ Publishing
- [ ] NPM credentials are set up
- [ ] Package name is available on NPM
- [ ] Provenance publishing is configured
- [ ] Changeset is created for release

## ✅ Final Verification
```bash
# Install from tarball and test
npm install -g cursor-rules-0.1.0.tgz
cursor-rules --version
cursor-rules list
cd /tmp && mkdir test && cd test
git init
cursor-rules install typescript
ls .cursor/rules/
cursor-rules status
cursor-rules remove typescript
```

## 🚀 Ready to Publish
When all items are checked, you're ready to publish:

```bash
pnpm changeset
git add . && git commit -m "feat: initial cursor-rules CLI release"
git push
``` 
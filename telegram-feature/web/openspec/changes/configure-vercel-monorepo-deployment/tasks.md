# Tasks: Configure Vercel Monorepo Deployment

## Implementation Checklist

### Phase 1: Create Configuration
- [x] Create OpenSpec proposal
- [ ] Create web/vercel.json configuration file
- [ ] Set root directory to "web/"
- [ ] Configure build and output directories
- [ ] Validate JSON syntax

### Phase 2: Vercel Console Configuration
- [ ] Access Vercel dashboard
- [ ] Find existing web project or create new one
- [ ] Configure Root Directory: web
- [ ] Set Framework Preset: Vite
- [ ] Verify Build Command: npm run build
- [ ] Verify Output Directory: dist
- [ ] Verify Install Command: npm install

### Phase 3: Testing & Validation
- [ ] Test local build: cd web && npm run build
- [ ] Deploy and verify successful build
- [ ] Test frontend change triggers deployment
- [ ] Test backend change doesn't trigger deployment
- [ ] Verify deployment URL serves content correctly
- [ ] Check Vercel logs for correct directory

### Phase 4: Documentation
- [ ] Update deployment documentation
- [ ] Create setup guide for future developers
- [ ] Archive this change proposal

## Configuration Template

### web/vercel.json
```json
{
  "version": 2,
  "name": "nofx-frontend",
  "root": "web/",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
```

## Testing Commands

### Local Build Test
```bash
cd web
npm run build
ls -la dist/
```

### Expected Output
```
dist/
├── index.html
└── assets/
    ├── index-*.js
    └── index-*.css
```

### Vercel Deployment Test
```bash
cd web
vercel --prod
```

### Expected Behavior
- Deploys only web/ directory
- Build completes successfully
- Deployment URL serves frontend
- Backend files unchanged

## Vercel Console Settings

### Required Settings
| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Root Directory | web/ |
| Build Command | npm run build |
| Output Directory | dist |
| Install Command | npm install |

### Optional Settings
| Setting | Value |
|---------|-------|
| Dev Command | npm run dev |
| Environment Variables | VITE_API_URL |
| Regions | Auto |

## Success Criteria

### Deployment Tests
1. ✅ web/vercel.json exists and is valid
2. ✅ Vercel recognizes web/ as root directory
3. ✅ Local build creates dist/ directory
4. ✅ Deployment succeeds without errors
5. ✅ Frontend changes trigger deployment
6. ✅ Backend changes don't trigger deployment
7. ✅ Deployment URL works correctly
8. ✅ No build conflicts or warnings

### Performance Metrics
- Build time: < 20 seconds
- Deployment time: < 30 seconds
- Bundle size: Optimized (current ~1.3MB)

## Troubleshooting

### Common Issues
1. **"dist not found"** → Check outputDirectory configuration
2. **Build failures** → Verify buildCommand matches package.json
3. **Wrong directory** → Ensure root is set to "web/"
4. **Dependency errors** → Verify installCommand

### Solutions
```bash
# Fix missing dist directory
cd web && npm run build

# Fix dependency issues
cd web && npm install

# Check Vercel configuration
cat web/vercel.json
```

## Files Modified

1. **web/vercel.json** - Created (new file)
2. **No other files** - Configuration only
3. **Vercel console** - Settings updated

## Rollback Plan

If monorepo configuration fails:
1. Delete web/vercel.json
2. Use Vercel console to reset to default configuration
3. Revert to previous working deployment method
4. Document lessons learned

## Notes

- This configuration isolates frontend deployment
- Backend remains in same Git repository
- Both parts share version history
- Simplifies frontend-only deployments
- Reduces deployment time and resource usage

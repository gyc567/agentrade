# Proposal: Configure Vercel Monorepo Deployment for Frontend

## Problem Statement

Currently, Vercel deploys the entire `/Users/guoyingcheng/dreame/code/nofx` repository, including both backend (Go) and frontend (React) code. This causes:
- Inefficient deployments (building entire project)
- Longer build times
- Potential conflicts between different build systems
- Wasted resources on backend code that shouldn't be deployed to Vercel

We want Vercel to only deploy frontend code from the `web/` directory when changes are pushed to GitHub.

## Root Cause Analysis

### Current Structure
```
nofx/
├── main.go (Go backend)
├── api/ (Backend APIs)
├── web/ (React frontend)
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   └── vercel.json
```

### Current Issue
- Vercel treats the entire repository as the deployment source
- Both backend and frontend code trigger deployments
- Confusion about which directory is the root
- Build failures due to mixed language stacks

## Proposed Solution

### Option 1: Vercel Monorepo Configuration (Recommended)

Configure Vercel to recognize `web/` as the deployment root directory.

#### Implementation
```json
// web/vercel.json
{
  "version": 2,
  "name": "nofx-frontend",
  "root": "web/",  // Specify web as project root
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install"
}
```

#### Advantages
- ✅ Single Git repository (simple management)
- ✅ Vercel automatically detects web directory changes
- ✅ Keeps frontend and backend in same repo
- ✅ Supports subdirectory deployment
- ✅ Minimal configuration changes

#### Disadvantages
- ⭐ Requires correct root parameter configuration
- ⭐ GitHub shows all file changes (but this is fine)

#### Implementation Steps
1. Create standalone vercel.json in web directory
2. Configure root as current directory
3. Set correct build commands
4. Configure Vercel console to select web directory as deployment root

### Alternative Solutions (Not Chosen)
1. **Separate Vercel Project** - More complex configuration
2. **GitHub Path Filters** - Requires GitHub Actions setup
3. **Separate Repositories** - Overkill for this use case

## Change Scope

### Files to Create/Modify
1. **Create**: `web/vercel.json` - Vercel configuration
2. **Modify**: No existing code changes required
3. **Configure**: Vercel console settings

### Configuration Details
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

## Acceptance Criteria

1. ✅ Create vercel.json in web directory
2. ✅ Configure root directory as web
3. ✅ Test build command works correctly
4. ✅ Configure Vercel console settings
5. ✅ Deploy and verify frontend-only deployment
6. ✅ Verify backend changes don't trigger frontend deployment
7. ✅ Verify frontend changes trigger frontend deployment
8. ✅ Ensure no build errors or conflicts

## Technical Details

### Vercel Configuration
- **Project Name**: nofx-frontend
- **Framework Preset**: Vite
- **Root Directory**: web/ (CRITICAL SETTING)
- **Build Command**: npm run build
- **Output Directory**: dist
- **Install Command**: npm install

### Expected Behavior
- When files in web/ are changed → Deploy frontend
- When files outside web/ are changed → No deployment triggered
- Build only executes npm commands in web directory
- Output served from web/dist directory

## Testing Plan

### Pre-Deployment Testing
1. Verify local build works: `cd web && npm run build`
2. Check dist directory is created correctly
3. Ensure all dependencies are in package.json

### Post-Deployment Testing
1. Push changes to web/src/ → Should trigger deployment
2. Push changes to root files → Should NOT trigger deployment
3. Verify deployment URL serves frontend correctly
4. Check Vercel dashboard shows web/ as root

## References

- Vercel Monorepo Documentation
- Vite Deployment Guide
- Current Project Structure: `/Users/guoyingcheng/dreame/code/nofx/web/`

## Next Steps

1. Create vercel.json configuration file
2. Configure Vercel console settings
3. Test deployment workflow
4. Verify frontend-only deployment behavior
5. Document final configuration

## Timeline

- **Implementation**: 1-2 hours
- **Testing**: 30 minutes
- **Verification**: 30 minutes
- **Total**: ~2.5 hours

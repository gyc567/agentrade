# Vercel Monorepo Deployment Spec Delta

## ADDED Requirements

### Vercel Configuration for Frontend-Only Deployment
**Requirement:** Vercel must deploy only the frontend code from the web/ directory, ignoring backend changes.

#### Scenario: Deploy only frontend directory
**Given** a monorepo containing both backend (Go) and frontend (React) code
**When** code is pushed to the GitHub repository
**Then** Vercel should deploy only the web/ directory
**And** ignore changes in backend directories (main.go, api/, etc.)

#### Scenario: Detect frontend changes
**Given** files in web/src/ or web/package.json are modified
**When** the changes are pushed to GitHub
**Then** Vercel should trigger a new deployment
**And** execute build commands from the web/ directory

#### Scenario: Ignore backend changes
**Given** files in root or api/ directories are modified
**When** the changes are pushed to GitHub
**Then** Vercel should NOT trigger a deployment
**And** the frontend remains at its last deployed state

#### Scenario: Serve from correct directory
**Given** Vercel has built the frontend
**When** a user visits the deployment URL
**Then** it should serve content from web/dist/ directory
**And** all assets should load correctly

## MODIFIED Requirements

### Build Configuration
**Requirement:** Build commands must execute from the web/ directory root.

**Previous:** Build commands executed from repository root
**Modified:** Build commands execute from web/ directory

#### Scenario: Execute build command
**Given** Vercel triggers a deployment
**When** running the build command
**Then** it should execute: `npm run build`
**And** the working directory should be web/
**And** the output directory should be web/dist/

## Implementation Details

### File: `web/vercel.json`

**Created Configuration:**
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

**Key Configuration Values:**
- `root`: "web/" - Tells Vercel to treat web/ as the project root
- `buildCommand`: "npm run build" - Runs from web/ directory
- `outputDirectory`: "dist" - Relative to web/ directory
- `installCommand`: "npm install" - Runs in web/ directory

### Directory Structure
```
Repository Root (/)
├── main.go (Backend)
├── api/ (Backend)
└── web/ (Frontend - Deployment Root)
    ├── vercel.json (Deployment Config)
    ├── package.json
    ├── vite.config.ts
    ├── src/
    └── dist/ (Build Output)
```

### Vercel Console Settings

**Project Configuration:**
- Framework Preset: Vite
- Root Directory: web/
- Build Command: npm run build
- Output Directory: dist
- Install Command: npm install

## Testing

### Unit Tests
1. **vercel.json validation**
   - Check JSON syntax is valid
   - Verify required fields are present
   - Confirm root path is correct

2. **Local build test**
   ```bash
   cd web
   npm run build
   # Verify dist/ directory is created
   ls -la dist/
   ```

### Integration Tests
1. **Frontend change test**
   - Modify a file in web/src/
   - Push to GitHub
   - Verify Vercel triggers deployment
   - Verify deployment succeeds

2. **Backend change test**
   - Modify main.go or api/ files
   - Push to GitHub
   - Verify Vercel does NOT trigger deployment

3. **End-to-end test**
   - Deploy frontend changes
   - Visit deployment URL
   - Verify page loads correctly
   - Verify API calls work (if applicable)

### Performance Tests
- Build time: < 20 seconds
- Deployment time: < 30 seconds
- Cold start: < 2 seconds

## Validation

### Pre-Deployment Checklist
- [ ] web/vercel.json exists and is valid JSON
- [ ] web/package.json has build script
- [ ] web/vite.config.ts is configured correctly
- [ ] Local build succeeds without errors

### Post-Deployment Checklist
- [ ] Vercel dashboard shows web/ as root
- [ ] Build logs show commands running in web/
- [ ] Deployment URL serves correct content
- [ ] Frontend changes trigger deployment
- [ ] Backend changes don't trigger deployment

### Error Scenarios
1. **Build failure**
   - Check build command matches package.json
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Wrong directory served**
   - Verify root: "web/" in vercel.json
   - Check Vercel console Root Directory setting

3. **Assets not loading**
   - Verify outputDirectory: "dist" is set
   - Check that dist/index.html exists
   - Verify asset paths are correct

## Rollback

### Rollback Procedure
If the monorepo configuration causes issues:
1. Delete web/vercel.json
2. Reset Vercel project to default settings
3. Redeploy using previous configuration
4. Investigate and fix issues
5. Re-apply configuration

### Emergency Contacts
- Vercel Support: https://vercel.com/support
- Project Maintainer: See repository README

## Notes

**Security:**
- This configuration doesn't expose backend code
- Vercel only serves frontend static files
- Backend remains on separate infrastructure (Replit)

**Performance:**
- Faster builds (only frontend code)
- Smaller deployment bundles
- Reduced bandwidth usage

**Maintainability:**
- Clear separation of concerns
- Independent frontend deployments
- Simplified CI/CD pipeline

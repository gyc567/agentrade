## Why

Users should see the blue "积分套餐" (Credits Packages) button in the header's right navigation menu that was added in commit `6ed16f40`. However, the button is not visible in production at https://www.agentrade.xyz despite the code being present in Header.tsx (lines 50-67). This blocks the new call-to-action feature for purchasing credit packages.

## What Changes

This is a bug fix restoring the intended visibility of the Credits Packages button. No new functionality is being added; the feature was already implemented but is not displaying correctly in production.

## Root Cause Analysis

Three probable root causes have been identified (ranked by probability):

### Cause 1: Deployment/Caching Issue (60-70% probability) - MOST LIKELY
- Latest commit `6ed16f40` may not be deployed to production yet
- Vercel CDN cache may still serve old bundle without button code
- Browser cache (HTTP cache, Service Worker) may serve stale assets
- Need to verify: deployment timestamp vs. code commit time, cache invalidation

### Cause 2: Condition Rendering Issue (20-30% probability) - DESIGN INCONSISTENCY
- Button code at line 50 lacks `{!simple && }` condition wrapper
- CreditsDisplay (line 48) and user email (lines 41-44) both have this condition
- Button may not render on certain pages using `simple={true}` (like login/register)
- Need to verify: button visibility on different page types

### Cause 3: Style/Visibility Issue (5-10% probability) - LOWEST LIKELIHOOD
- Container width overflow: right menu has `flex items-center gap-4` with multiple elements
- Button could be visually clipped due to container overflow or `overflow: hidden` on parent
- CSS z-index issues hiding button behind other elements
- Need to verify: CSS computed styles, container dimensions, z-index stacking context

## Impact

- **Affected specs**: header-navigation
- **Affected code**: src/components/Header.tsx (lines 50-67)
- **User impact**: Blocking new feature for purchasing credits, reduces conversion
- **Breaking changes**: None - bug fix only
- **Risk level**: Low - isolated diagnostic and fix, no new dependencies


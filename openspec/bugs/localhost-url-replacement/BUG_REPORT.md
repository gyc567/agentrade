# Bug Report: Replace localhost URLs in User Manuals

## Bug Description

**Issue**: User manuals contain hardcoded localhost URLs (`http://localhost:3000`) that need to be replaced with the production domain (`https://www.agentrade.xyz/`).

**Affected Files**:
- `/web/public/docs/user-manual-en.md` (English version)
- `/web/public/docs/user-manual-zh.md` (Chinese version)

**Impact**: Users following the manual will attempt to access the wrong URL, causing confusion and preventing proper onboarding.

## Root Cause Analysis

### Architecture Layer
- **Problem**: Hardcoded development URLs in production documentation
- **Violation**: Separation of environments principle - documentation should reference environment-specific configurations
- **Impact**: User experience degradation, increased support burden

### Code Philosophy Layer
- **Design Flaw**: Static URLs in dynamic environments violate the "configuration over hardcoding" principle
- **Maintainability**: Manual URL updates are error-prone and don't scale across multiple environments
- **User Trust**: Broken links erode user confidence in documentation accuracy

## Technical Details

### Current State
```markdown
English: Open the web interface at `http://localhost:3000` or your deployed domain
Chinese: 在 `http://localhost:3000` 或您的部署域名打开Web界面
```

### Required Change
```markdown
English: Open the web interface at `https://www.agentrade.xyz/`
Chinese: 在 `https://www.agentrade.xyz/` 打开Web界面
```

## Solution Approach

### Immediate Fix
1. Direct string replacement in both manual files
2. Remove "or your deployed domain" ambiguity
3. Ensure consistent URL formatting

### Long-term Architecture
1. Implement documentation templating system
2. Environment-specific configuration injection
3. Automated documentation validation pipeline

## Validation Criteria

- [ ] Both English and Chinese manuals updated
- [ ] All localhost:3000 references replaced
- [ ] URL formatting consistent across languages
- [ ] Documentation remains user-friendly
- [ ] No broken formatting or syntax errors

## Priority
**High** - This directly impacts user onboarding and first impressions

## Type
**Documentation Bug** - Content accuracy issue affecting user experience
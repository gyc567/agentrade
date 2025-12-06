# Proposal: Replace localhost URLs in User Manuals

## Summary
Replace hardcoded `http://localhost:3000` URLs in user manuals with the production domain `https://www.agentrade.xyz/` to ensure users access the correct application endpoint.

## Problem Statement

### Phenomenon Layer
Users following the manual instructions attempt to access `http://localhost:3000`, which fails because:
- Localhost only works in development environments
- Production users need the actual deployed domain
- Creates confusion during onboarding process

### Architecture Layer
- **Hardcoded URLs**: Violate environment separation principles
- **Documentation Drift**: Manuals don't reflect deployment reality
- **User Experience Gap**: Broken links prevent successful first-time setup

### Philosophy Layer
> "Documentation is the contract between software and its users. Broken URLs are broken promises."

Hardcoded localhost URLs represent a fundamental disconnect between development mindset and user-centric thinking. Good documentation should guide users to success, not require them to mentally translate development concepts.

## Proposed Solution

### Phase 1: Immediate Fix
Replace all occurrences of `http://localhost:3000` with `https://www.agentrade.xyz/` in:
- `/web/public/docs/user-manual-en.md`
- `/web/public/docs/user-manual-zh.md`

### Phase 2: Content Refinement
1. Remove "or your deployed domain" ambiguity
2. Ensure consistent URL formatting
3. Maintain cultural context in translations

## Implementation Plan

### Files to Modify
1. **English Manual** (`/web/public/docs/user-manual-en.md`)
   - Line 8: Registration section URL reference
   - Update: Remove localhost reference, use production domain

2. **Chinese Manual** (`/web/public/docs/user-manual-zh.md`)
   - Line 8: 注册和登录 section URL reference
   - Update: Remove localhost reference, use production domain

### Technical Approach
```diff
- Open the web interface at `http://localhost:3000` or your deployed domain
+ Open the web interface at `https://www.agentrade.xyz/`

- 在 `http://localhost:3000` 或您的部署域名打开Web界面
+ 在 `https://www.agentrade.xyz/` 打开Web界面
```

## Success Criteria

### Functional Requirements
- [ ] All localhost:3000 references replaced
- [ ] Production domain correctly referenced
- [ ] Both language versions updated
- [ ] Documentation formatting preserved

### Quality Requirements
- [ ] No broken markdown syntax
- [ ] Consistent URL formatting
- [ ] Preserved cultural nuances in translation
- [ ] Maintained user-friendly tone

## Risk Assessment

### Low Risk
- Simple string replacement operation
- No functional code changes
- Minimal testing required

### Mitigation
- Backup original files before modification
- Validate markdown rendering after changes
- Cross-reference with other documentation

## Future Considerations

### Architecture Evolution
1. **Templating System**: Implement environment-specific documentation generation
2. **Configuration Management**: Centralize domain references
3. **Automated Validation**: CI/CD pipeline to catch hardcoded URLs

### Design Philosophy
> "The best documentation is invisible to the user - it simply works."

This fix moves us closer to documentation that serves users rather than documenting implementation details.

## Conclusion

This proposal addresses an immediate user experience issue while laying groundwork for more robust documentation practices. The simple act of replacing localhost URLs with production domains represents a shift from developer-centric to user-centric thinking.

**Next Steps**: Implement the string replacement and validate documentation accuracy across both language versions.
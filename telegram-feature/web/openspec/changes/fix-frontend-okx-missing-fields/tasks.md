# Tasks: Fix Frontend OKX Missing API Key/Secret Key/Passphrase Fields

## Task 0: Investigation & Debugging (15 minutes)

**Objective**: Gather data to understand why input fields aren't showing

**Actions**:
- [ ] 0.1. Add debug logging to `AITradersPage.tsx`
  ```typescript
  // Add after line ~1178 (selectedExchange definition)
  console.log('[DEBUG ExchangeConfigModal]', {
    selectedExchangeId,
    selectedExchange,
    allExchangesCount: allExchanges?.length,
    shouldShowCEXFields: (selectedExchange?.id === 'binance' || selectedExchange?.type === 'cex') &&
      selectedExchange?.id !== 'hyperliquid' &&
      selectedExchange?.id !== 'aster',
    shouldShowPassphrase: selectedExchange?.id === 'okx'
  });
  ```

- [ ] 0.2. Build and deploy debug version
  ```bash
  cd web
  npm run build
  ```

- [ ] 0.3. Instruct user to test with DevTools
  - Open https://nofx-gyc567.replit.app/traders
  - Open DevTools Console (F12)
  - Click "Exchanges" → "Add Exchange"
  - Select "OKX Futures" from dropdown
  - Copy console output and send back

**Expected Output**:
Debug information showing the state of `selectedExchange`, `selectedExchangeId`, and conditional results.

---

## Task 1: Implement Rendering Fix (20 minutes)

**Objective**: Fix the rendering issue based on debug findings

**If Debug Shows `selectedExchange` is undefined or condition is false**:
- [ ] 1.1. Add `key` prop to force re-render
  ```typescript
  // Line ~1417 in AITradersPage.tsx
  <ExchangeConfigModal
    key={selectedExchangeId}  // Add this line
    allExchanges={supportedExchanges}
    ...
  ```

- [ ] 1.2. Simplify conditional logic for CEX exchanges
  ```typescript
  // Line ~1291, replace complex condition with:
  {(selectedExchange.type === 'cex') &&
    selectedExchange.id !== 'hyperliquid' &&
    selectedExchange.id !== 'aster' && (
    // API Key and Secret Key fields
  )}
  ```

- [ ] 1.3. Add explicit OKX handling
  ```typescript
  // Line ~1323, enhance the passphrase condition
  {(selectedExchange.id === 'okx' || selectedExchange.type === 'cex') &&
    selectedExchange.id !== 'hyperliquid' &&
    selectedExchange.id !== 'aster' && (
    // Passphrase field
  )}
  ```

**If Debug Shows Everything is Correct**:
- [ ] 1.4. Check for browser cache issues
  - Clear browser cache
  - Hard refresh (Ctrl+Shift+R)
  - Test in incognito mode

- [ ] 1.5. Check for build cache issues
  ```bash
  cd web
  rm -rf node_modules/.vite
  npm run build
  ```

**Files Modified**:
- `web/src/components/AITradersPage.tsx`

---

## Task 2: Add Visual Indicator (10 minutes)

**Objective**: Make it clearer to users what fields are required

**Actions**:
- [ ] 2.1. Add a "Supported Exchanges" section header in the modal
  ```typescript
  // Add after line ~1270, before the input fields
  <div className="mb-4 p-3 rounded" style={{ background: '#0B0E11', border: '1px solid #2B3139' }}>
    <h3 className="text-sm font-semibold" style={{ color: '#F0B90B' }}>
      {t('configureExchangeCredentials', language)}
    </h3>
    <p className="text-xs mt-1" style={{ color: '#848E9C' }}>
      {selectedExchange?.id === 'okx' ? t('okxRequiresAllThreeFields', language) :
       selectedExchange?.type === 'cex' ? t('cexRequiresApiAndSecret', language) :
       t('enterRequiredFields', language)}
    </p>
  </div>
  ```

- [ ] 2.2. Add field requirement indicators
  ```typescript
  // For each input field, add an asterisk
  <label className="block text-sm font-semibold mb-2" style={{ color: '#EAECEF' }}>
    {t('apiKey', language)} <span style={{ color: '#F6465D' }}>*</span>
  </label>
  ```

**Files Modified**:
- `web/src/components/AITradersPage.tsx`

---

## Task 3: Translation Updates (15 minutes)

**Objective**: Ensure all labels are properly translated

**Actions**:
- [ ] 3.1. Check translation files for missing keys
  ```bash
  grep -r "configureExchangeCredentials" web/src/i18n/
  grep -r "okxRequiresAllThreeFields" web/src/i18n/
  grep -r "cexRequiresApiAndSecret" web/src/i18n/
  ```

- [ ] 3.2. Add missing translations in:
  - `web/src/i18n/translations.ts`
  - Language-specific files if applicable

**Translation Keys to Add**:
```typescript
configureExchangeCredentials: '配置交易所凭证',
okxRequiresAllThreeFields: 'OKX 需要 API Key、Secret Key 和 Passphrase',
cexRequiresApiAndSecret: 'CEX 交易所需要 API Key 和 Secret Key',
enterRequiredFields: '请填写所需字段',
```

**Files Modified**:
- `web/src/i18n/translations.ts`

---

## Task 4: Testing & Validation (30 minutes)

**Objective**: Comprehensive testing of the fix

**Actions**:
- [ ] 4.1. Test OKX configuration flow
  - [ ] Select OKX from dropdown → Fields appear
  - [ ] Verify API Key field is present and required
  - [ ] Verify Secret Key field is present and required
  - [ ] Verify Passphrase field is present and required
  - [ ] Fill all fields → Save configuration
  - [ ] Verify save is successful

- [ ] 4.2. Test other exchanges still work
  - [ ] Binance Futures: API Key, Secret Key (no Passphrase) ✅
  - [ ] Hyperliquid: Private Key, Wallet Address ✅
  - [ ] Aster: User, Signer, Private Key ✅

- [ ] 4.3. Cross-browser testing
  - [ ] Chrome ✅
  - [ ] Firefox ✅
  - [ ] Safari ✅
  - [ ] Edge ✅

- [ ] 4.4. Mobile testing
  - [ ] iOS Safari ✅
  - [ ] Android Chrome ✅

- [ ] 4.5. Clear browser cache and test
  - [ ] Hard refresh
  - [ ] Incognito mode
  - [ ] Different device

**Test Checklist**:
```markdown
## Test Results

### OKX Futures
- [ ] Dropdown shows "OKX Futures (CEX)"
- [ ] Selecting OKX displays 3 input fields
- [ ] API Key field is present
- [ ] Secret Key field is present
- [ ] Passphrase field is present
- [ ] All fields are required (validation works)
- [ ] Can save configuration successfully
- [ ] Saved configuration persists

### Binance Futures
- [ ] Dropdown shows "Binance Futures (CEX)"
- [ ] Selecting Binance displays 2 input fields
- [ ] API Key field is present
- [ ] Secret Key field is present
- [ ] No Passphrase field (correct)

### Hyperliquid
- [ ] Dropdown shows "Hyperliquid (DEX)"
- [ ] Selecting Hyperliquid displays 2 input fields
- [ ] Private Key field is present
- [ ] Wallet Address field is present
- [ ] No Passphrase field (correct)

### Aster
- [ ] Dropdown shows "Aster DEX (DEX)"
- [ ] Selecting Aster displays 3 input fields
- [ ] User field is present
- [ ] Signer field is present
- [ ] Private Key field is present
- [ ] No Passphrase field (correct)
```

**Files Modified**:
- None (testing phase)

---

## Task 5: Documentation Update (15 minutes)

**Objective**: Update documentation to reflect the fix

**Actions**:
- [ ] 5.1. Update API documentation
  - Document OKX configuration requirements
  - Add screenshot or example of OKX setup

- [ ] 5.2. Update troubleshooting guide
  - Add known issue #123: "OKX input fields not showing"
  - Document solution: "Select OKX from dropdown, fields will appear"
  - Add cache clearing instructions if needed

**Files to Update**:
- `API_DOCUMENTATION.md`
- `docs/guides/TROUBLESHOOTING.md`

---

## Task 6: Deployment (20 minutes)

**Objective**: Deploy the fix to production

**Actions**:
- [ ] 6.1. Create deployment package
  ```bash
  cd web
  npm run build
  ```

- [ ] 6.2. Deploy to staging environment
  - Verify fix works in staging
  - Run smoke tests

- [ ] 6.3. Deploy to production
  - Monitor error logs
  - Verify fix in production

- [ ] 6.4. Post-deployment verification
  - Check `/traders` page
  - Test OKX configuration
  - Confirm no regressions

---

## Task 7: Monitoring & Metrics (10 minutes)

**Objective**: Monitor the fix and track usage

**Actions**:
- [ ] 7.1. Monitor API errors
  - Check `/api/supported-exchanges` endpoint
  - Verify no increase in 500 errors

- [ ] 7.2. Monitor user activity
  - Track OKX configuration attempts
  - Monitor success/failure rates

- [ ] 7.3. Set up alerts (if needed)
  - Alert on configuration failures
  - Alert on API errors

---

## Success Criteria

- [ ] Users can successfully configure OKX Futures exchange
- [ ] Modal displays all three required fields: API Key, Secret Key, Passphrase
- [ ] Form validation works correctly for all fields
- [ ] Configuration persists in database
- [ ] No regressions in other exchange configurations
- [ ] All tests passing
- [ ] Production deployment successful
- [ ] Documentation updated
- [ ] No console errors

## Rollback Plan

If issues arise:

1. **Revert Code Changes**:
   ```bash
   git revert <commit-hash>
   npm run build
   ```

2. **Clear All Caches**:
   - Browser cache
   - Build cache
   - CDN cache (if applicable)

3. **Redeploy**:
   ```bash
   npm run build
   # Deploy to production
   ```

4. **Verify Rollback**:
   - Test that previous version works
   - Monitor for errors

## Time Estimates

| Task | Estimated Time |
|------|----------------|
| Task 0: Investigation | 15 minutes |
| Task 1: Implementation | 20 minutes |
| Task 2: Visual Indicator | 10 minutes |
| Task 3: Translations | 15 minutes |
| Task 4: Testing | 30 minutes |
| Task 5: Documentation | 15 minutes |
| Task 6: Deployment | 20 minutes |
| Task 7: Monitoring | 10 minutes |
| **Total** | **~2.5 hours** |

## Resources

- **Proposal**: `fix-frontend-okx-missing-fields/proposal.md`
- **Source Code**: `web/src/components/AITradersPage.tsx`
- **API Endpoint**: `/api/supported-exchanges`
- **Type Definitions**: `web/src/types.ts:107-123`
- **Translations**: `web/src/i18n/translations.ts`

## Communication

**Keep User Informed**:
1. After Task 0: Share debug findings
2. After Task 1: Confirm fix is implemented
3. After Task 4: Provide test results
4. After Task 6: Confirm production deployment

**Status Updates**:
- Daily standup updates
- Any blockers or issues
- Completion of major milestones

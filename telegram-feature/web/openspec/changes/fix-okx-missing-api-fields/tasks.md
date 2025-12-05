# Tasks: Fix OKX Missing API Key and Secret Key Fields

## Implementation Tasks

### Task 1: Update Database Schema
**Owner**: Backend Team
**Estimate**: 15 minutes

- [ ] 1.1. Execute SQL update to change OKX type from 'okx' to 'cex'
  ```bash
  cd /home/runner/$(ls /home/runner | grep nofx)
  sqlite3 config.db "UPDATE exchanges SET type = 'cex' WHERE id = 'okx' AND user_id = 'default';"
  ```

- [ ] 1.2. Verify the change
  ```bash
  sqlite3 config.db "SELECT id, name, type FROM exchanges WHERE id = 'okx' AND user_id = 'default';"
  ```
  Expected output: `okx|OKX Futures|cex`

- [ ] 1.3. Commit the change to database (if needed)

**Files modified**:
- `config.db` (database file)

---

### Task 2: Verify Frontend Behavior
**Owner**: Frontend Team
**Estimate**: 10 minutes

- [ ] 2.1. Rebuild and deploy frontend
  ```bash
  cd web
  npm run build
  ```

- [ ] 2.2. Test the fix locally
  1. Navigate to `/traders` page
  2. Click "Exchanges" → "Add Exchange"
  3. Select "OKX Futures"
  4. Verify modal shows:
     - ✅ API Key field
     - ✅ Secret Key field
     - ✅ Passphrase field

- [ ] 2.3. Test other exchanges still work
  - Binance Futures: Should show API Key, Secret Key, no Passphrase
  - Hyperliquid: Should show Private Key, Wallet Address
  - Aster: Should show User, Signer, Private Key

---

### Task 3: Update Frontend Code (Optional - Fallback)
**Owner**: Frontend Team
**Estimate**: 20 minutes

If Task 1 (database update) cannot be deployed, implement Option 2:

- [ ] 3.1. Edit `src/components/AITradersPage.tsx`

- [ ] 3.2. Update line 1291 conditional to include OKX:
  ```typescript
  // Before:
  {(selectedExchange.id === 'binance' || selectedExchange.type === 'cex') && selectedExchange.id !== 'hyperliquid' && selectedExchange.id !== 'aster' && (

  // After:
  {(selectedExchange.id === 'binance' ||
    selectedExchange.type === 'cex' ||
    selectedExchange.id === 'okx') &&
    selectedExchange.id !== 'hyperliquid' &&
    selectedExchange.id !== 'aster' && (
  ```

- [ ] 3.3. Test the change
  ```bash
  cd web
  npm run dev
  ```

- [ ] 3.4. Rebuild and deploy
  ```bash
  npm run build
  ```

**Files modified**:
- `src/components/AITradersPage.tsx`

---

### Task 4: Update Database Initialization (Long-term Fix)
**Owner**: Backend Team
**Estimate**: 30 minutes

Prevent future occurrences by updating default data initialization:

- [ ] 4.1. Edit `config/database.go`

- [ ] 4.2. Find `initDefaultData()` function (line ~343)

- [ ] 4.3. Update OKX initialization to use 'cex' type:
  ```go
  // Before:
  {"okx", "OKX Futures", "okx"},

  // After:
  {"okx", "OKX Futures", "cex"},
  ```

- [ ] 4.4. Test the change
  1. Backup current database
  2. Delete config.db
  3. Run server to recreate database
  4. Verify OKX has type 'cex'

- [ ] 4.5. Rebuild backend binary

**Files modified**:
- `config/database.go`

---

### Task 5: Documentation Update
**Owner**: Technical Writer
**Estimate**: 15 minutes

- [ ] 5.1. Update API documentation
  - Document OKX exchange configuration requirements
  - Add example of OKX API setup

- [ ] 5.2. Update troubleshooting guide
  - Add known issue and resolution

**Files to update**:
- `API_DOCUMENTATION.md`
- `docs/guides/TROUBLESHOOTING.md`

---

### Task 6: Testing & Validation
**Owner**: QA Team
**Estimate**: 30 minutes

- [ ] 6.1. Create test cases
  - Test OKX configuration flow
  - Test other exchanges still work
  - Test form validation

- [ ] 6.2. Execute test suite
  - Unit tests (if applicable)
  - Integration tests
  - Manual QA testing

- [ ] 6.3. Cross-browser testing
  - Chrome
  - Firefox
  - Safari
  - Edge

- [ ] 6.4. Mobile testing
  - iOS Safari
  - Android Chrome

- [ ] 6.5. Document test results

---

### Task 7: Deployment
**Owner**: DevOps Team
**Estimate**: 20 minutes

- [ ] 7.1. Prepare deployment
  - Create deployment checklist
  - Prepare rollback plan

- [ ] 7.2. Deploy to staging
  - Verify fix works in staging environment
  - Run smoke tests

- [ ] 7.3. Deploy to production
  - Monitor error logs
  - Verify fix in production

- [ ] 7.4. Post-deployment verification
  - Confirm OKX configuration works
  - Check for any regressions

---

### Task 8: Monitoring & Metrics
**Owner**: DevOps Team
**Estimate**: 10 minutes

- [ ] 8.1. Monitor API errors
  - Check `/api/supported-exchanges` endpoint
  - Verify no increase in 500 errors

- [ ] 8.2. Monitor user activity
  - Track OKX configuration attempts
  - Monitor success/failure rates

- [ ] 8.3. Set up alerts (if needed)
  - Alert on configuration failures
  - Alert on API errors

---

## Verification Checklist

After all tasks complete:

- [ ] Database has OKX with type 'cex'
- [ ] Frontend modal shows API Key, Secret Key, Passphrase for OKX
- [ ] Users can save OKX configuration
- [ ] Other exchanges still work correctly
- [ ] No regressions in existing functionality
- [ ] Documentation updated
- [ ] Tests passing
- [ ] Production deployment successful

## Rollback Plan

If issues arise:

1. **Database Rollback**:
   ```bash
   sqlite3 config.db "UPDATE exchanges SET type = 'okx' WHERE id = 'okx' AND user_id = 'default';"
   ```

2. **Frontend Rollback**:
   - Revert `AITradersPage.tsx` changes
   - Redeploy previous version

3. **Full System Rollback**:
   - Restore database from backup
   - Redeploy previous backend binary
   - Redeploy previous frontend build

## Success Criteria

1. ✅ Users can successfully configure OKX Futures exchange
2. ✅ Modal displays all required fields: API Key, Secret Key, Passphrase
3. ✅ Form validation works correctly
4. ✅ Configuration persists in database
5. ✅ No regressions in other exchange configurations
6. ✅ All tests passing
7. ✅ Production deployment successful

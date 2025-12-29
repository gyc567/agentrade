# Feature: Payment Modal Responsive Width Enhancement

## Summary
Increase payment modal width to improve visibility of Crossmint checkout interface, with responsive breakpoints for different screen sizes.

## Problem Statement
Current payment modal has `max-width: 600px` which is too narrow for:
1. Crossmint embedded checkout displays payment options (crypto/fiat) side-by-side
2. Package selection grid needs more space for 3 packages
3. Users find it difficult to see complete payment flow

## Solution

### Design Principles
- **KISS**: Minimal CSS changes, no JavaScript complexity
- **High Cohesion**: All changes in single CSS module
- **Low Coupling**: No changes to component logic

### Implementation

#### 1. CSS Changes (payment-modal.module.css)

**Base content width:**
```css
.content {
  max-width: 480px;  /* Default for package selection */
}
```

**Checkout state width expansion:**
```css
.checkoutContainer {
  width: 100%;
  max-width: 720px;  /* Expanded for Crossmint checkout */
}

.content:has(.checkoutContainer) {
  max-width: 760px;  /* Container expands when checkout is active */
}
```

**Responsive breakpoints:**
```css
/* Mobile: Full width with padding */
@media (max-width: 640px) {
  .content { max-width: 95vw; }
}

/* Tablet: Medium width */
@media (min-width: 641px) and (max-width: 1024px) {
  .content:has(.checkoutContainer) { max-width: 680px; }
}

/* Desktop: Full expanded width */
@media (min-width: 1025px) {
  .content:has(.checkoutContainer) { max-width: 800px; }
}
```

### Affected Files
1. `web/src/features/payment/styles/payment-modal.module.css` - Width adjustments

### Test Plan
1. Unit test: Verify CSS classes render correctly
2. Visual test: Check modal at 320px, 768px, 1024px, 1440px viewports
3. Integration test: Confirm Crossmint checkout displays properly

### Rollback Plan
Revert CSS changes - no data or logic dependencies.

## Acceptance Criteria
- [ ] Modal width expands to 800px on desktop when checkout is active
- [ ] Package selection remains at comfortable width (480px)
- [ ] Mobile experience maintains full-width usability
- [ ] No horizontal scrolling on any viewport
- [ ] All existing functionality preserved

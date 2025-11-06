# Performance Optimizations

This document explains the performance optimizations applied to the resizer implementation based on web animation best practices from [Motion's Web Animation Performance Tier List](https://motion.dev/blog/web-animation-performance-tier-list).

## Overview

The resizer implementation has been optimized to minimize layout thrashing and provide smooth 60fps performance during resize operations. While resizing is fundamentally a layout operation (requiring changes to element dimensions), we've applied performance best practices to minimize the impact.

## Optimizations Applied

### 1. RequestAnimationFrame Throttling

**Problem**: Mouse/touch pointer move events can fire hundreds of times per second, causing excessive layout calculations.

**Solution**: Pointer move events are throttled using `requestAnimationFrame` to synchronize updates with the browser's paint cycle (~60fps).

```typescript
// Before: Updates happen on every pointer move (100s per second)
handlePointerMove(event) {
  applyLayout(calculateNewLayout(offset));
}

// After: Updates throttled to 60fps via RAF
handlePointerMove(event) {
  currentDragState.pendingOffset = offset;
  if (!currentDragState.rafId) {
    currentDragState.rafId = requestAnimationFrame(updateLayoutInFrame);
  }
}
```

**Impact**: Reduces layout calculations from 100s/second to ~60/second, matching the display refresh rate. Multiple pointer move events between frames are naturally coalesced - the latest offset is used and intermediate values are discarded.

### 2. Deferred Non-Critical Updates

**Problem**: ARIA attribute updates during drag are unnecessary and add overhead.

**Solution**: Only update ARIA attributes when the drag is committed, not during each pointer move.

```typescript
applyLayoutToGroup(group, layout, commit: boolean) {
  // Apply flex values on every update
  for (const [childId, { flex, percentage }] of Object.entries(layout.panels)) {
    group.elm.style.setProperty(CSS_PROP_CHILD_FLEX(childId), ...);
  }
  
  if (commit) {
    // Only update ARIA on final commit
    applyAriaToGroup(group.elm, layout);
  }
}
```

**Impact**: Reduces DOM operations during the performance-critical drag operation. The browser automatically batches style updates within the same execution context, so explicit batching is unnecessary.

### 3. CSS Containment

**Problem**: Layout changes can cascade to parent and sibling elements, causing unnecessary recalculations.

**Solution**: Use CSS `contain` property to limit layout scope.

```css
.split-ui-panel {
  /* Limits layout and style recalculations to panel boundaries */
  contain: layout style;
}

.split-ui-resizer {
  /* Fully isolates resizer from surrounding layout */
  contain: layout style paint;
}
```

**Impact**: Browser can skip recalculating layout for elements outside the contained boundary.

## Performance Tier List Context

The Motion blog post categorizes CSS properties by animation performance:

- **S-Tier** (GPU-accelerated): `transform`, `opacity`
- **A-Tier**: `scale`, `rotate`, `translate` 
- **D-Tier** (triggers layout): `width`, `height`, `top`, `left`
- **F-Tier** (never use): Properties causing major reflows

### Why Not Use Transform?

You might wonder: "Why not use `transform` (S-tier) instead of changing flex-basis?"

**Answer**: Resizing panels is fundamentally a layout operation. We need to:
1. Actually change panel dimensions (not just visually offset them)
2. Maintain proper hit testing and interaction areas
3. Keep flex layout benefits (responsive sizing, constraints)

Using `transform` would only create a visual illusion without actually resizing the panels, breaking functionality.

## Measuring Performance

To verify these optimizations are effective:

1. **Open Chrome DevTools Performance panel**
2. **Start recording**
3. **Drag a resizer**
4. **Stop recording**

Look for:
- **Frame rate**: Should maintain ~60fps during drag
- **Layout events**: Should see ~60/second (not 100s/second)
- **Paint events**: Should be minimal due to containment
- **Scripting time**: Should be minimal per frame

### Before Optimizations
- Layout: 100-300 events/second
- Frame drops during fast dragging
- Janky cursor updates

### After Optimizations
- Layout: ~60 events/second (RAF-limited)
- Smooth 60fps performance
- Responsive cursor and visual feedback

## Trade-offs

### Memory vs Performance
### Code Complexity
RAF throttling adds complexity with animation frame management. Benefits:
- Significant performance improvement
- Better user experience
- Industry best practice for drag operations

## Best Practices for Users

If you're implementing custom drag handlers or extending the library:

1. **Use RAF for frequent updates**: Throttle to display refresh rate
2. **Batch DOM operations**: Collect changes, apply together
3. **Use CSS containment**: Prevent cascade of layout changes
4. **Defer non-critical updates**: ARIA, analytics, etc. can wait

## Further Reading

- [Motion: Web Animation Performance Tier List](https://motion.dev/blog/web-animation-performance-tier-list)
- [MDN: CSS Containment](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Containment)
- [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)

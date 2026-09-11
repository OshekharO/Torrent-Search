## 2025-05-10 - HTML Escaping & Protocol Handler Optimization

**Learning:**
Creating DOM elements (`document.createElement('div')` and `document.createTextNode()`) inside high-frequency utility functions (e.g., `escapeHtml`) introduces unnecessary GC allocations and DOM thread overhead when rendering large lists/grids. Additionally, using `window.open(magnet, '_blank')` for custom protocol schemes (`magnet:`) triggers browser popup blockers on mobile and strict desktop browsers.

**Action:**
Use fast regex string replacement (`str.replace(/[&<>"']/g, ...)`) for escaping raw string inputs before DOM insertion, and navigate directly via `window.location.href = magnet` or clean protocol links to reliably open torrent magnet handlers.

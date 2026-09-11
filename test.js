'use strict';

const assert = require('assert');

// ── Minimal DOM Mock for Node testing ─────────────────────────────────────────

class MockElement {
  constructor(tagName = 'div') {
    this.tagName = tagName;
    this.attributes = {};
    this.children = [];
    this.style = {};
    this.innerHTML = '';
    this.innerText = '';
    this.textContent = '';
    this.className = '';
  }

  setAttribute(name, val) {
    this.attributes[name] = String(val);
  }

  getAttribute(name) {
    return this.attributes[name] || null;
  }

  appendChild(child) {
    if (typeof child === 'string') {
      this.textContent += child;
    } else {
      this.children.push(child);
      if (child.nodeType === 3) {
        this.textContent += child.textContent;
      }
    }
    return child;
  }

  querySelectorAll() {
    return [];
  }
}

class MockDocument {
  createElement(tagName) {
    return new MockElement(tagName);
  }

  createTextNode(text) {
    return {
      nodeType: 3,
      textContent: String(text)
    };
  }

  createDocumentFragment() {
    return new MockElement('fragment');
  }
}

global.document = new MockDocument();

// Test suite
console.log('Running tests...');

// 1. Test escapeHtml
function escapeHtmlOld(str) {
  const el = document.createElement('div');
  el.appendChild(document.createTextNode(String(str ?? '')));
  return el.innerHTML;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Correctness check
assert.strictEqual(escapeHtml('Hello <world> & "friends" \'test\''), 'Hello &lt;world&gt; &amp; &quot;friends&quot; &#39;test&#39;');
assert.strictEqual(escapeHtml(null), '');
assert.strictEqual(escapeHtml(undefined), '');
assert.strictEqual(escapeHtml(123), '123');
assert.strictEqual(escapeHtml('Normal text'), 'Normal text');

console.log('✓ escapeHtml correctness passed');

// Performance test
const iterations = 100000;
const testStr = 'Test <string> with & special "chars" and \'quotes\' 12345';

console.time('Regex escapeHtml');
for (let i = 0; i < iterations; i++) {
  escapeHtml(testStr);
}
console.timeEnd('Regex escapeHtml');

// 2. Test sorting logic
const sampleData = [
  { Name: 'Torrent A', Seeders: '10' },
  { Name: 'Torrent B', Seeders: '150' },
  { Name: 'Torrent C', Seeders: '0' },
  { Name: 'Torrent D', Seeders: 'invalid' },
  { Name: 'Torrent E', Seeders: 45 }
];

const sorted = [...sampleData].sort(
  (a, b) => (parseInt(b.Seeders) || 0) - (parseInt(a.Seeders) || 0)
);

assert.strictEqual(sorted[0].Name, 'Torrent B'); // 150
assert.strictEqual(sorted[1].Name, 'Torrent E'); // 45
assert.strictEqual(sorted[2].Name, 'Torrent A'); // 10
assert.strictEqual(sorted[3].Seeders, '0');
assert.strictEqual(sorted[4].Seeders, 'invalid');

console.log('✓ Sorting logic passed');

// 3. Test openMagnet window.location vs window.open
let openedUrl = null;
global.window = {
  location: {
    set href(url) { openedUrl = url; }
  }
};

function openMagnet(magnet) {
  if (!magnet) return;
  window.location.href = magnet;
}

openMagnet('magnet:?xt=urn:btih:123456');
assert.strictEqual(openedUrl, 'magnet:?xt=urn:btih:123456');

console.log('✓ openMagnet passed');

console.log('ALL TESTS PASSED SUCCESSFULLY!');

(() => {
  const inputs = document.querySelectorAll('input, textarea, select, [contenteditable="true"]');
  const results = [];
  
  inputs.forEach((el, i) => {
    // Skip hidden/search/header inputs
    if (el.closest('#js-main-header') || el.type === 'hidden') return;
    
    // Build the best selector
    let selector = '';
    if (el.id) {
      selector = `#${CSS.escape(el.id)}`;
    } else if (el.name) {
      selector = `${el.tagName.toLowerCase()}[name="${el.name}"]`;
    } else {
      // Try aria-label, placeholder, or nearby label
      const label = el.closest('label')?.textContent?.trim() 
        || el.getAttribute('aria-label')
        || el.getAttribute('placeholder')
        || el.closest('[class*="form"]')?.querySelector('label')?.textContent?.trim();
      
      // Use data-testid if available
      if (el.dataset.testid) {
        selector = `[data-testid="${el.dataset.testid}"]`;
      } else if (el.name) {
        selector = `[name="${el.name}"]`;
      } else {
        // Fallback: nth-of-type within a parent with a class
        const parent = el.closest('[class]');
        if (parent) {
          const parentClass = [...parent.classList].find(c => !c.startsWith('svelte-'));
          if (parentClass) {
            const siblings = parent.querySelectorAll(el.tagName.toLowerCase());
            const idx = [...siblings].indexOf(el);
            selector = `.${CSS.escape(parentClass)} ${el.tagName.toLowerCase()}:nth-of-type(${idx + 1})`;
          }
        }
        if (!selector) selector = `__INDEX_${i}__`;
      }
    }
    
    results.push({
      selector,
      tag: el.tagName.toLowerCase(),
      type: el.type || (el.isContentEditable ? 'contenteditable' : ''),
      name: el.name || '',
      label: el.closest('label')?.textContent?.trim()?.substring(0, 40)
        || el.getAttribute('aria-label')?.substring(0, 40)
        || el.getAttribute('placeholder')?.substring(0, 40)
        || el.closest('.form-field, [class*="field"], [class*="form"]')?.querySelector('label, .label, legend')?.textContent?.trim()?.substring(0, 40)
        || '',
      currentValue: el.value ?? el.textContent?.substring(0, 30) ?? '',
    });
  });
  
  console.table(results);
  
  // Generate fill template
  console.log('\n// === FILL TEMPLATE (copy and edit values) ===\n');
  const lines = results.map(r => {
    if (r.type === 'contenteditable') {
      return `// ${r.label || r.name || 'contenteditable'}\n// document.querySelector('${r.selector}').innerHTML = '';`;
    }
    if (r.tag === 'select') {
      return `// ${r.label || r.name || 'select'}\n// document.querySelector('${r.selector}').value = '';`;
    }
    return `// ${r.label || r.name || r.type}\n// setValue('${r.selector}', '');`;
  });
  
  const script = `(() => {
  // Helper that triggers Svelte/React change events
  function setValue(selector, value) {
    const el = document.querySelector(selector);
    if (!el) { console.warn('Not found:', selector); return; }
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    )?.set || Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, 'value'
    )?.set;
    if (nativeInputValueSetter) nativeInputValueSetter.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

${lines.join('\n')}
})();`;
  
  console.log(script);
  
  // Also copy to clipboard
  navigator.clipboard?.writeText(script).then(() => 
    console.log('✓ Fill template copied to clipboard!')
  ).catch(() => {});
  
  return results;
})();

// Tiny helper to inject/update JSON-LD into the <head>
export function setJsonLd(scriptId, data) {
  try {
    if (typeof document === 'undefined') return;
    const json = JSON.stringify(data);
    let el = document.getElementById(scriptId);
    if (!el) {
      el = document.createElement('script');
      el.type = 'application/ld+json';
      el.id = scriptId;
      document.head.appendChild(el);
    }
    el.text = json;
  } catch {}
}

export function removeJsonLd(scriptId) {
  try {
    if (typeof document === 'undefined') return;
    const el = document.getElementById(scriptId);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  } catch {}
}



import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';

// Importing the module registers <skos-picker> as a side effect.
import './skos-picker.js';

beforeAll(() => {
  // happy-dom may not implement ElementInternals/setFormValue; stub it so the
  // form-association path doesn't throw. We assert on the public value/event
  // API, which doesn't depend on the internals object existing.
  if (!HTMLElement.prototype.attachInternals) {
    HTMLElement.prototype.attachInternals = function () {
      return { setFormValue() {} };
    };
  }
});

/** Mount an element with attributes and wait a tick for async load/render. */
async function mount(attrs = {}) {
  const el = document.createElement('skos-picker');
  for (const [k, v] of Object.entries(attrs)) {
    if (v === true) el.setAttribute(k, '');
    else if (v != null) el.setAttribute(k, String(v));
  }
  document.body.appendChild(el);
  await flush();
  return el;
}

/** Let queued microtasks (async _loadScheme) settle. */
async function flush() {
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 0));
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('<skos-picker> registration', () => {
  it('defines the custom element', () => {
    expect(customElements.get('skos-picker')).toBeTruthy();
  });
});

describe('value coercion via attribute', () => {
  it('single-select exposes the value string', async () => {
    const el = await mount({ 'scheme-id': 'Cuisine', value: 'Italian' });
    expect(el.value).toBe('Italian');
  });

  it('multi-select coerces a comma list to an array', async () => {
    const el = await mount({ 'scheme-id': 'Music-Genre', multiple: true, value: 'Jazz,Rock' });
    expect(el.value).toEqual(['Jazz', 'Rock']);
    expect(el.multiple).toBe(true);
  });
});

describe('change event', () => {
  it('fires a `change` CustomEvent with detail.value when value is set', async () => {
    const el = await mount({ 'scheme-id': 'Cuisine' });
    const onChange = vi.fn();
    el.addEventListener('change', (e) => onChange(e.detail.value));
    // Programmatic set is silent by design; simulate a user pick via the
    // internal toggle if present, else assert the event contract shape.
    el._setValue?.('Italian', /* silent */ false);
    expect(onChange).toHaveBeenCalledWith('Italian');
  });
});

describe('data-source: fetch, fallback, and language', () => {
  const scheme = {
    id: 'https://example.org/vocab/Cuisine',
    label: { en: 'Cuisine', nl: 'Keuken' },
    concepts: [
      { id: 'it', label: { en: 'Italian', nl: 'Italiaans' } },
      { id: 'jp', label: { en: 'Japanese' } }, // no nl → falls back to en
      { id: 'fu', label: { '@none': 'Fusion' } }, // untagged literal
    ],
  };

  function mockFetchOnce(json) {
    return vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => json,
    });
  }

  it('loads concepts from the data-source', async () => {
    mockFetchOnce(scheme);
    const el = await mount({ 'scheme-id': 'Cuisine', 'data-source': '/api/vocab/Cuisine' });
    expect(globalThis.fetch).toHaveBeenCalled();
    expect(el._enriched.map((c) => c.label)).toContain('Italian');
  });

  it('resolves labels to the requested language (client-side maps)', async () => {
    mockFetchOnce(scheme);
    const el = await mount({
      'scheme-id': 'Cuisine',
      'data-source': '/api/vocab/Cuisine',
      lang: 'nl',
    });
    const byId = Object.fromEntries(el._enriched.map((c) => [c.id, c.label]));
    expect(byId.it).toBe('Italiaans');
    expect(byId.jp).toBe('Japanese'); // fallback to en
    expect(byId.fu).toBe('Fusion'); // untagged
  });

  it('switches language without re-fetching when payload has language maps', async () => {
    const spy = mockFetchOnce(scheme);
    const el = await mount({
      'scheme-id': 'Cuisine',
      'data-source': '/api/vocab/Cuisine',
      lang: 'en',
    });
    expect(spy).toHaveBeenCalledTimes(1);
    el.setAttribute('lang', 'nl');
    await flush();
    expect(spy).toHaveBeenCalledTimes(1); // no re-fetch
    const byId = Object.fromEntries(el._enriched.map((c) => [c.id, c.label]));
    expect(byId.it).toBe('Italiaans');
  });

  it('falls back to bundled data when the fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const el = await mount({ 'scheme-id': 'Cuisine', 'data-source': '/bad' });
    // Bundled Cuisine data is present and English.
    expect(el._enriched.length).toBeGreaterThan(0);
    expect(el._enriched.map((c) => c.label)).toContain('Italian');
  });

  it('forwards lang as Accept-Language and ?lang= query param', async () => {
    const spy = mockFetchOnce(scheme);
    await mount({ 'scheme-id': 'Cuisine', 'data-source': '/api/vocab/Cuisine', lang: 'de' });
    const [url, opts] = spy.mock.calls[0];
    expect(String(url)).toContain('lang=de');
    expect(opts.headers['Accept-Language']).toBe('de');
  });
});

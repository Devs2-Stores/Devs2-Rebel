---
description: Tìm kiếm dự đoán (Predictive Search) với API endpoint và Section Rendering
---

# Tìm Kiếm Dự Đoán (Predictive Search)

## Tổng quan

Shopify cung cấp 2 endpoint:

| Endpoint | Response | Khi nào dùng |
|---|---|---|
| `GET /{locale}/search/suggest.json` | JSON | Tự render UI bằng JS |
| `GET /{locale}/search/suggest` | Section HTML | Dùng Liquid section render |

## 1. Query Parameters

| Param | Mô tả | Giá trị |
|---|---|---|
| `q` | Từ khoá | Chuỗi bất kỳ |
| `resources[type]` | Loại kết quả | `product,page,article,collection,query` |
| `resources[limit]` | Số kết quả tối đa | 1–10 (mặc định: 10) |
| `resources[limit_scope]` | Phân bổ | `all` hoặc `each` |
| `resources[options][unavailable_products]` | SP hết hàng | `show`, `hide`, `last` |
| `resources[options][fields]` | Trường tìm | `title,body,product_type,tag,vendor,variants.barcode,variants.sku,variants.title` |

## 2. JSON Endpoint

```javascript
async function predictiveSearch(query, options = {}) {
  const { types = 'product,page,article,collection', limit = 6 } = options;
  const params = new URLSearchParams({
    'q': query,
    'resources[type]': types,
    'resources[limit]': limit,
    'resources[options][unavailable_products]': 'last',
  });
  const response = await fetch(
    `${window.Shopify.routes.root}search/suggest.json?${params}`
  );
  if (!response.ok) throw new Error('Search failed');
  return response.json();
}
```

## 3. Section Endpoint (Khuyến nghị)

### Section Liquid: `sections/predictive-search.liquid`

```liquid
{%- if predictive_search.performed -%}
  <div id="predictive-search-results" role="listbox">
    {%- if predictive_search.resources.queries.size > 0 -%}
      <div class="predictive-search__group">
        <h3 id="ps-queries">{{ 'search.suggestions' | t }}</h3>
        <ul role="group" aria-labelledby="ps-queries">
          {%- for query in predictive_search.resources.queries -%}
            <li role="option"><a href="{{ query.url }}">{{ query.styled_text }}</a></li>
          {%- endfor -%}
        </ul>
      </div>
    {%- endif -%}

    {%- if predictive_search.resources.products.size > 0 -%}
      <div class="predictive-search__group">
        <h3 id="ps-products">{{ 'search.products' | t }}</h3>
        <ul role="group" aria-labelledby="ps-products">
          {%- for product in predictive_search.resources.products -%}
            <li role="option">
              <a href="{{ product.url }}" class="predictive-search__item">
                {%- if product.featured_image != blank -%}
                  {{ product.featured_image | image_url: width: 150 | image_tag:
                    loading: 'lazy',
                    alt: product.featured_image.alt | default: product.title | escape
                  }}
                {%- endif -%}
                <span>{{ product.title }}</span>
                <span>{{ product.price | money }}</span>
              </a>
            </li>
          {%- endfor -%}
        </ul>
      </div>
    {%- endif -%}

    {%- if predictive_search.resources.collections.size > 0 -%}
      <div class="predictive-search__group">
        <h3 id="ps-collections">{{ 'search.collections' | t }}</h3>
        <ul role="group" aria-labelledby="ps-collections">
          {%- for collection in predictive_search.resources.collections -%}
            <li role="option"><a href="{{ collection.url }}">{{ collection.title }}</a></li>
          {%- endfor -%}
        </ul>
      </div>
    {%- endif -%}

    {%- if predictive_search.resources.articles.size > 0 -%}
      <div class="predictive-search__group">
        <h3 id="ps-articles">{{ 'search.articles' | t }}</h3>
        <ul role="group" aria-labelledby="ps-articles">
          {%- for article in predictive_search.resources.articles -%}
            <li role="option"><a href="{{ article.url }}">{{ article.title }}</a></li>
          {%- endfor -%}
        </ul>
      </div>
    {%- endif -%}
  </div>
{%- endif -%}

{% schema %}
{ "name": "Predictive Search", "tag": "div" }
{% endschema %}
```

### JavaScript gọi Section

```javascript
async function fetchSearchSection(query, sectionId = 'predictive-search') {
  const params = new URLSearchParams({
    'q': query,
    'section_id': sectionId,
    'resources[type]': 'product,collection,article,page,query',
    'resources[limit]': '6',
  });
  const response = await fetch(
    `${window.Shopify.routes.root}search/suggest?${params}`
  );
  return response.text();
}
```

## 4. Web Component

```javascript
if (!customElements.get('predictive-search')) {
  class PredictiveSearch extends HTMLElement {
    constructor() {
      super();
      this.input = this.querySelector('input[type="search"]');
      this.results = this.querySelector('[data-results]');
      this.status = this.querySelector('[data-status]');
      this.abortController = null;
      this.debounceTimer = null;
    }

    connectedCallback() {
      this.input?.addEventListener('input', this.onInput.bind(this));
      this.input?.addEventListener('keydown', this.onKeydown.bind(this));
      this.addEventListener('focusout', this.onFocusOut.bind(this));
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.close(); });
    }

    onInput(event) {
      const query = event.target.value.trim();
      clearTimeout(this.debounceTimer);
      if (query.length < 2) { this.close(); return; }
      this.debounceTimer = setTimeout(() => this.search(query), 300);
    }

    async search(query) {
      this.abortController?.abort();
      this.abortController = new AbortController();
      try {
        const params = new URLSearchParams({
          'q': query,
          'section_id': this.dataset.sectionId || 'predictive-search',
          'resources[type]': 'product,collection,article,page,query',
          'resources[limit]': '6',
        });
        const response = await fetch(
          `${window.Shopify.routes.root}search/suggest?${params}`,
          { signal: this.abortController.signal }
        );
        if (!response.ok) throw new Error('Search error');
        const html = await response.text();
        this.renderResults(html);
        this.open();
      } catch (error) {
        if (error.name === 'AbortError') return;
      }
    }

    renderResults(html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const newResults = doc.querySelector('#predictive-search-results');
      if (this.results && newResults) this.results.innerHTML = newResults.innerHTML;
      if (this.status) {
        const count = this.results?.querySelectorAll('[role="option"]').length || 0;
        this.status.textContent = count > 0 ? `${count} kết quả` : 'Không có kết quả';
      }
    }

    onKeydown(event) {
      const items = this.results?.querySelectorAll('[role="option"] a');
      if (!items?.length) return;
      const idx = [...items].indexOf(document.activeElement);
      if (event.key === 'ArrowDown') { event.preventDefault(); items[(idx + 1) % items.length].focus(); }
      if (event.key === 'ArrowUp') { event.preventDefault(); items[idx > 0 ? idx - 1 : items.length - 1].focus(); }
    }

    onFocusOut() { setTimeout(() => { if (!this.contains(document.activeElement)) this.close(); }, 100); }

    open() { this.setAttribute('open', ''); this.input?.setAttribute('aria-expanded', 'true'); }
    close() { this.removeAttribute('open'); this.input?.setAttribute('aria-expanded', 'false'); if (this.results) this.results.innerHTML = ''; }
    disconnectedCallback() { this.abortController?.abort(); clearTimeout(this.debounceTimer); }
  }
  customElements.define('predictive-search', PredictiveSearch);
}
```

## 5. HTML Template

```liquid
<predictive-search data-section-id="predictive-search">
  <form action="{{ routes.search_url }}" method="get" role="search">
    <label for="search-{{ section.id }}" class="visually-hidden">{{ 'search.placeholder' | t }}</label>
    <input type="search" id="search-{{ section.id }}" name="q"
      placeholder="{{ 'search.placeholder' | t }}"
      autocomplete="off" role="combobox"
      aria-expanded="false" aria-controls="predictive-search-results"
      aria-haspopup="listbox">
    <button type="submit" aria-label="{{ 'search.submit' | t }}">{%- render 'icon-search' -%}</button>
  </form>
  <div data-results></div>
  <span data-status class="visually-hidden" role="status" aria-live="polite"></span>
</predictive-search>
```

## 6. Lưu ý

- Typo tolerance: tự động sửa lỗi chính tả (query ≥ 4 ký tự)
- Rate limit: HTTP 429 + `Retry-After` header → **luôn debounce 300ms+**
- `AbortController` để huỷ request cũ
- ARIA: `combobox`, `listbox`, `option`, `aria-live`
- Keyboard: Arrow keys, Escape
- Minimum query: ≥ 2 ký tự

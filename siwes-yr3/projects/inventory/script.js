

const STORE_KEY = 'inv_v1';


/* ── Events ── */
const addBtn = document.getElementById('btn-add');
const nameInput = document.getElementById("inp-name")
const priceInput = document.getElementById("inp-price")
const qtyInput = document.getElementById("inp-qty")
const searchInput = document.getElementById("search-inp");
const invBody = document.getElementById('inv-body')


addBtn.addEventListener('click', addProduct);
nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") priceInput.focus();
});
priceInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") qtyInput.focus();
});
qtyInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addProduct();
});

searchInput.addEventListener("input", (e) => {
  render(e.target.value);
});

// event delegation — one listener handles all delete buttons
invBody.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-del");
  if (!btn) return;
  if (confirm("Remove this product?")) deleteProduct(Number(btn.dataset.id));
});

/* ── Storage ── */
function load()     { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch { return []; } }
function save(data) { localStorage.setItem(STORE_KEY, JSON.stringify(data)); }

/* ── Helpers ── */
function fmt(n) {
  return '₦' + Number(n).toLocaleString('en-NG', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
}
function fmtShort(n) {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return '₦' + (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + 'M';
  }
  if (n >= 1_000) {
    const v = n / 1_000;
    return '₦' + (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + 'K';
  }
  return fmt(n);
}
function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
function stockClass(qty) {
  if (qty === 0) return 'out';
  if (qty <= 5)  return 'low';
  return 'in';
}
function stockLabel(qty) {
  if (qty === 0) return 'Out of Stock';
  if (qty <= 5)  return 'Low Stock';
  return 'In Stock';
}

/* ── Stats (always reflects full data, not filtered view) ── */
function updateStats(products) {
  const total = products.length;
  const items = products.reduce((s, p) => s + p.qty, 0);
  const value = products.reduce((s, p) => s + p.price * p.qty, 0);
  document.getElementById('stat-products').textContent = total;
  document.getElementById('stat-items').textContent    = items;
  document.getElementById('stat-value').textContent    = fmtShort(value);
  document.getElementById('count-pill').textContent    = `${total} product${total !== 1 ? 's' : ''}`;
}

/* ── Render ── */
function render(filter = '') {
  const products = load();
  const query    = filter.toLowerCase().trim();
  const filtered = query
    ? products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      )
    : products;

  const tbody = document.getElementById('inv-body');
  const table = document.getElementById('inv-table');
  const empty = document.getElementById('empty-state');

  updateStats(products);

  if (filtered.length === 0) {
    table.style.display = 'none';
    empty.style.display = 'block';
    empty.querySelector('p').textContent = query
      ? `No products match "${filter}".`
      : 'No products yet. Use the form above to add your first item.';
    return;
  }

  table.style.display = 'table';
  empty.style.display = 'none';
  tbody.innerHTML = '';

  filtered.forEach((p, i) => {
    const sc = stockClass(p.qty);
    const sl = stockLabel(p.qty);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="num">${i + 1}</td>
      <td class="name">${esc(p.name)}</td>
      <td><span class="cat-tag">${esc(p.category)}</span></td>
      <td class="price">${fmt(p.price)}</td>
      <td>${p.qty}</td>
      <td><span class="stock-badge ${sc}">${sl}</span></td>
      <td class="center">
        <button class="btn-del" data-id="${p.id}" title="Remove product">
          <i data-lucide="trash-2"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // reinit icons for dynamically injected trash-2 buttons
  lucide.createIcons();
}

/* ── Add product ── */
function addProduct() {
  const nameEl  = document.getElementById('inp-name');
  const catEl   = document.getElementById('inp-cat');
  const priceEl = document.getElementById('inp-price');
  const qtyEl   = document.getElementById('inp-qty');
  const errEl   = document.getElementById('err-msg');

  const name  = nameEl.value.trim();
  const cat   = catEl.value;
  const price = parseFloat(priceEl.value);
  const qty   = parseInt(qtyEl.value, 10);

  if (!name || isNaN(price) || price < 0 || isNaN(qty) || qty < 0) {
    errEl.classList.add('show');
    return;
  }

  errEl.classList.remove('show');

  const products = load();
  products.push({ id: Date.now(), name, category: cat, price, qty });
  save(products);

  nameEl.value  = '';
  priceEl.value = '';
  qtyEl.value   = '';
  catEl.selectedIndex = 0;
  nameEl.focus();

  render(document.getElementById('search-inp').value);
}

/* ── Delete product ── */
function deleteProduct(id) {
  const updated = load().filter(p => p.id !== id);
  save(updated);
  render(document.getElementById('search-inp').value);
}

/* ── Init ── */
render();

// Cosmos Image Downloader - Web Frontend

let currentSearchTerm = '';
let nextPageCursor = null;
let totalAvailableCount = 0;
let isLoading = false;
let isLoadingMore = false;
let loadedItems = [];
let lastServerResponse = null;

// DOM prvky
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearBtn');
const searchBtn = document.getElementById('searchBtn');
const emptyState = document.getElementById('emptyState');
const initialLoading = document.getElementById('initialLoading');
const loadingStatusText = document.getElementById('loadingStatusText');
const imageGrid = document.getElementById('imageGrid');
const loadMoreSection = document.getElementById('loadMoreSection');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const loadMoreSpinner = document.getElementById('loadMoreSpinner');
const loadMoreStatus = document.getElementById('loadMoreStatus');
const countBadge = document.getElementById('countBadge');
const subCountText = document.getElementById('subCountText');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const copyAllUrlsBtn = document.getElementById('copyAllUrlsBtn');
const autoScrollCheck = document.getElementById('autoScrollCheck');
const statusBarText = document.getElementById('statusBarText');
const viewRawBtn = document.getElementById('viewRawBtn');

// ZIP Progress
const zipProgressBanner = document.getElementById('zipProgressBanner');
const zipProgressText = document.getElementById('zipProgressText');
const zipProgressPercent = document.getElementById('zipProgressPercent');
const zipProgressBar = document.getElementById('zipProgressBar');

// Lightbox Modal
const lightboxModal = document.getElementById('lightboxModal');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDimensions = document.getElementById('modalDimensions');
const modalDirectDownload = document.getElementById('modalDirectDownload');
const modalCopyUrl = document.getElementById('modalCopyUrl');
const modalOriginalLink = document.getElementById('modalOriginalLink');

// Raw Response Modal
const rawModal = document.getElementById('rawModal');
const rawModalBackdrop = document.getElementById('rawModalBackdrop');
const rawModalCloseBtn = document.getElementById('rawModalCloseBtn');
const rawContent = document.getElementById('rawContent');
const copyRawBtn = document.getElementById('copyRawBtn');

// Toast
const toast = document.getElementById('toast');

// Inicializace událostí
document.addEventListener('DOMContentLoaded', () => {
  searchInput.addEventListener('input', () => {
    clearBtn.style.display = searchInput.value ? 'block' : 'none';
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    searchInput.focus();
  });

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) startSearch(query);
  });

  loadMoreBtn.addEventListener('click', () => {
    loadNextPage();
  });

  window.addEventListener('scroll', handleScroll);

  downloadAllBtn.addEventListener('click', downloadAllAsZip);
  copyAllUrlsBtn.addEventListener('click', copyAllUrls);

  // Lightbox zavírání
  modalCloseBtn.addEventListener('click', closeLightbox);
  modalBackdrop.addEventListener('click', closeLightbox);

  // Raw modal
  viewRawBtn.addEventListener('click', () => {
    if (lastServerResponse) {
      rawContent.textContent = JSON.stringify(lastServerResponse, null, 2);
      rawModal.classList.remove('hidden');
    }
  });
  rawModalCloseBtn.addEventListener('click', () => rawModal.classList.add('hidden'));
  rawModalBackdrop.addEventListener('click', () => rawModal.classList.add('hidden'));
  copyRawBtn.addEventListener('click', () => {
    if (lastServerResponse) {
      navigator.clipboard.writeText(JSON.stringify(lastServerResponse, null, 2));
      showToast('JSON odpověď byla zkopírována do schránky');
    }
  });

  // ESC pro zavření modálů
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLightbox();
      rawModal.classList.add('hidden');
    }
  });
});

// Hlavní vyhledávání
async function startSearch(query) {
  if (isLoading) return;
  isLoading = true;
  currentSearchTerm = query;
  nextPageCursor = null;
  totalAvailableCount = 0;
  loadedItems = [];

  // Reset UI
  imageGrid.innerHTML = '';
  imageGrid.classList.add('hidden');
  emptyState.classList.add('hidden');
  loadMoreSection.classList.add('hidden');
  initialLoading.classList.remove('hidden');
  loadingStatusText.textContent = `Vyhledávám přes Cosmos API: "${query}"...`;
  statusBarText.textContent = `Načítám data pro dotaz: "${query}"...`;
  searchBtn.disabled = true;

  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || `Chyba serveru: ${res.status}`);
    }

    const data = await res.json();
    lastServerResponse = data;
    viewRawBtn.disabled = false;

    nextPageCursor = data.nextPageCursor || null;
    totalAvailableCount = data.totalCount || 0;

    if (!data.items || data.items.length === 0) {
      emptyState.classList.remove('hidden');
      emptyState.querySelector('h2').textContent = 'Nenalezeny žádné obrázky';
      emptyState.querySelector('p').textContent = `Pro výraz "${query}" nebyly nalezeny žádné výsledky. Zkuste jiný termín.`;
      statusBarText.textContent = 'Nenalezeny žádné obrázky.';
      return;
    }

    renderItems(data.items);
    updateToolbar();
    updatePaginationUI();
    statusBarText.textContent = `Úspěšně načteno ${loadedItems.length} obrázků pro "${query}".`;
  } catch (err) {
    alert(`Chyba při vyhledávání: ${err.message}`);
    statusBarText.textContent = `Chyba: ${err.message}`;
    emptyState.classList.remove('hidden');
  } finally {
    isLoading = false;
    initialLoading.classList.add('hidden');
    searchBtn.disabled = false;
  }
}

// Načtení další stránky (Infinite scroll / Load More)
async function loadNextPage() {
  if (isLoadingMore || !nextPageCursor) return;
  isLoadingMore = true;

  loadMoreBtn.disabled = true;
  loadMoreSpinner.classList.remove('hidden');
  loadMoreStatus.textContent = 'Načítám další dávku obrázků ze serveru...';
  statusBarText.textContent = `Načítám další obrázky pro "${currentSearchTerm}"...`;

  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(currentSearchTerm)}&cursor=${encodeURIComponent(nextPageCursor)}`);
    if (!res.ok) throw new Error(`Chyba serveru: ${res.status}`);

    const data = await res.json();
    lastServerResponse = data;
    nextPageCursor = data.nextPageCursor || null;

    if (data.items && data.items.length > 0) {
      renderItems(data.items);
    }

    updateToolbar();
    updatePaginationUI();
    statusBarText.textContent = `Zobrazeno ${loadedItems.length} z ${totalAvailableCount} obrázků.`;
  } catch (err) {
    console.error('Chyba při načítání dalších:', err);
    loadMoreStatus.textContent = `Chyba: ${err.message}`;
  } finally {
    isLoadingMore = false;
    loadMoreBtn.disabled = false;
    loadMoreSpinner.classList.add('hidden');
  }
}

// Vykreslení karet obrázků do mřížky
function renderItems(newItems) {
  imageGrid.classList.remove('hidden');

  for (const item of newItems) {
    loadedItems.push(item);
    const card = createCardElement(item);
    imageGrid.appendChild(card);
  }
}

function createCardElement(item) {
  const card = document.createElement('div');
  card.className = 'image-card';

  const dimText = item.width > 0 && item.height > 0 ? `${item.width} × ${item.height} px` : '';

  card.innerHTML = `
    <div class="card-image-wrapper">
      <img
        class="card-image"
        src="${item.url}"
        alt="${escapeHtml(item.fileName)}"
        loading="lazy"
        onerror="this.src='/api/image?url=' + encodeURIComponent('${item.url}')"
      />
      ${dimText ? `<span class="card-badge">${dimText}</span>` : ''}
    </div>
    <div class="card-info">
      <div class="card-title" title="${escapeHtml(item.fileName)}">${escapeHtml(item.fileName)}</div>
      ${item.caption ? `<div class="card-caption" title="${escapeHtml(item.caption)}">${escapeHtml(item.caption)}</div>` : ''}
    </div>
    <div class="card-actions">
      <a href="/api/image?url=${encodeURIComponent(item.url)}&download=1&filename=${encodeURIComponent(item.fileName)}"
         class="btn btn-success btn-sm btn-download"
         title="Stáhnout do PC">
        Uložit
      </a>
      <button class="btn btn-secondary btn-sm btn-zoom" title="Zvětšit náhled">Náhled</button>
      <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" title="Otevřít v novém okně">Web</a>
      <button class="btn btn-secondary btn-sm btn-copy" title="Kopírovat URL">Kopírovat</button>
    </div>
  `;

  // Kliknutí na obrázek nebo lupu otevře lightbox
  card.querySelector('.card-image-wrapper').addEventListener('click', () => openLightbox(item));
  card.querySelector('.btn-zoom').addEventListener('click', () => openLightbox(item));

  // Kopírování odkazu
  card.querySelector('.btn-copy').addEventListener('click', () => {
    navigator.clipboard.writeText(item.url);
    showToast(`URL zkopírována: ${item.fileName}`);
  });

  return card;
}

// Lightbox Modal
function openLightbox(item) {
  modalImage.src = item.url;
  modalTitle.textContent = item.fileName;
  modalDimensions.textContent = item.width > 0 && item.height > 0 ? `${item.width} × ${item.height} px` : 'Neznámé rozměry';
  modalDirectDownload.href = `/api/image?url=${encodeURIComponent(item.url)}&download=1&filename=${encodeURIComponent(item.fileName)}`;
  modalOriginalLink.href = item.url;

  modalCopyUrl.onclick = () => {
    navigator.clipboard.writeText(item.url);
    showToast('URL zkopírována do schránky');
  };

  lightboxModal.classList.remove('hidden');
}

function closeLightbox() {
  lightboxModal.classList.add('hidden');
  modalImage.src = '';
}

// Stránkování a scroll listener
function handleScroll() {
  if (!autoScrollCheck.checked || isLoading || isLoadingMore || !nextPageCursor) return;

  const scrollY = window.scrollY;
  const visibleHeight = window.innerHeight;
  const pageHeight = document.documentElement.scrollHeight;

  // Pokud je uživatel méně než 400px od konce stránky
  if (scrollY + visibleHeight >= pageHeight - 400) {
    loadNextPage();
  }
}

function updateToolbar() {
  countBadge.textContent = loadedItems.length;
  if (totalAvailableCount > 0) {
    subCountText.textContent = `(z celkem ${totalAvailableCount} dostupných)`;
  } else {
    subCountText.textContent = '';
  }

  downloadAllBtn.disabled = loadedItems.length === 0;
  copyAllUrlsBtn.disabled = loadedItems.length === 0;
}

function updatePaginationUI() {
  if (nextPageCursor) {
    loadMoreSection.classList.remove('hidden');
    const remaining = totalAvailableCount > loadedItems.length ? totalAvailableCount - loadedItems.length : 0;
    loadMoreStatus.textContent = remaining > 0
      ? `K dispozici dalších cca ${remaining} obrázků.`
      : 'K dispozici další obrázky.';
  } else {
    if (loadedItems.length > 0) {
      loadMoreSection.classList.remove('hidden');
      loadMoreBtn.disabled = true;
      loadMoreBtn.querySelector('span').textContent = 'Všechny dostupné obrázky načteny';
      loadMoreStatus.textContent = `Načteno všech ${loadedItems.length} výsledků.`;
    } else {
      loadMoreSection.classList.add('hidden');
    }
  }
}

// Hromadné stažení jako ZIP pomocí JSZip přímo v prohlížeči
async function downloadAllAsZip() {
  if (!window.JSZip) {
    alert('Knihovna JSZip se ještě nenačetla.');
    return;
  }

  if (loadedItems.length === 0) return;

  downloadAllBtn.disabled = true;
  zipProgressBanner.classList.remove('hidden');
  zipProgressBar.style.width = '0%';
  zipProgressPercent.textContent = '0%';
  zipProgressText.textContent = `Příprava stahování ${loadedItems.length} obrázků...`;

  const zip = new JSZip();
  let downloadedCount = 0;
  const total = loadedItems.length;

  for (let i = 0; i < total; i++) {
    const item = loadedItems[i];
    zipProgressText.textContent = `Stahuji obrázek [${i + 1}/${total}]: ${item.fileName}...`;

    try {
      // Použijeme /api/image pro spolehlivé stažení bez CORS blokace
      const res = await fetch(`/api/image?url=${encodeURIComponent(item.url)}`);
      if (res.ok) {
        const blob = await res.blob();
        zip.file(item.fileName, blob);
        downloadedCount++;
      }
    } catch (err) {
      console.warn(`Nepodařilo se stáhnout ${item.fileName}:`, err);
    }

    const percent = Math.round(((i + 1) / total) * 100);
    zipProgressBar.style.width = `${percent}%`;
    zipProgressPercent.textContent = `${percent}%`;
  }

  zipProgressText.textContent = 'Generuji ZIP archiv...';

  try {
    const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
      zipProgressPercent.textContent = `${Math.round(metadata.percent)}%`;
    });

    const cleanTerm = currentSearchTerm.replace(/[^a-zA-Z0-9]/g, '_') || 'cosmos';
    const zipName = `cosmos_${cleanTerm}_${downloadedCount}_images.zip`;

    // Trigger stažení
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = zipName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Staženo ${downloadedCount} obrázků v archivu ${zipName}`);
  } catch (err) {
    alert(`Chyba při tvorbě ZIP: ${err.message}`);
  } finally {
    downloadAllBtn.disabled = false;
    setTimeout(() => {
      zipProgressBanner.classList.add('hidden');
    }, 2000);
  }
}

// Kopírování všech URL
function copyAllUrls() {
  if (loadedItems.length === 0) return;
  const urls = loadedItems.map((item) => item.url).join('\n');
  navigator.clipboard.writeText(urls);
  showToast(`Všech ${loadedItems.length} URL adres bylo zkopírováno do schránky`);
}

// Toast notifikace
let toastTimer = null;
function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.remove('hidden');

  toastTimer = setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

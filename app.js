import { convert } from './src/convert.js';
import { UserError } from './src/util.js';
import { t, setLang, getLang, SUPPORTED_LANGS } from './src/i18n.js';
import { isArchiveName, listArchiveEntries, extractArchiveEntry, closeArchive } from './src/archive.js';

const $ = id => document.getElementById(id);
const sections = ['drop', 'archive', 'progress', 'done', 'error'];
let busy = false;
let currentUrl = null;
let archiveEntries = [];

function show(name) {
  for (const s of sections) $(s).hidden = s !== name;
}

function formatSize(n) {
  return n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
}

function applyI18n() {
  document.documentElement.lang = getLang();
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  const sel = $('lang');
  if (sel && sel.value !== getLang()) sel.value = getLang();
  const badge = $('offline');
  if (badge) checkOffline();
}

async function handleFile(file) {
  if (!file || busy) return;
  busy = true;
  if (currentUrl) { URL.revokeObjectURL(currentUrl); currentUrl = null; }
  await closeArchive();
  archiveEntries = [];

  if (isArchiveName(file.name)) {
    $('stage') && ($('stage').textContent = t('archive.reading'));
    show('progress');
    $('fname').textContent = file.name;
    $('barfill').style.width = '2%';
    try {
      const entries = await listArchiveEntries(file);
      archiveEntries = entries;
      renderArchiveList(entries);
      $('barfill').style.width = '100%';
      show('archive');
    } catch (e) {
      console.error(e);
      $('errmsg').textContent = e instanceof UserError ? e.message : t('error.generic');
      show('error');
    } finally {
      busy = false;
    }
    return;
  }

  await runConvert(file);
}

function readOptions() {
  return {
    outputFormat: $('format').value,
    typography: {
      fontSize: Number($('fontSize').value) || 20,
      lineHeight: Number($('lineHeight').value) || 1.4,
      marginTop: Number($('margin').value) || 40,
      marginBottom: Number($('margin').value) || 40,
      marginLeft: Number($('margin').value) || 40,
      marginRight: Number($('margin').value) || 40,
      fontFamily: $('fontFamily').value || 'serif',
    },
  };
}

async function runConvert(file) {
  busy = true;
  $('fname').textContent = file.name;
  $('barfill').style.width = '2%';
  $('stage').textContent = t('progress.start');
  show('progress');
  try {
    const res = await convert(file, (msg, frac) => {
      $('stage').textContent = msg;
      $('barfill').style.width = `${Math.round(Math.max(0.02, Math.min(1, frac)) * 100)}%`;
    }, readOptions());
    currentUrl = URL.createObjectURL(res.blob);
    const a = $('download');
    a.href = currentUrl;
    a.download = res.filename;
    a.textContent = t('download', { filename: res.filename });
    const extra = res.pages ? ` · ${res.pages} pages` : (res.hasCover ? t('coverSuffix') : '');
    $('summary').textContent =
      t('summary', { chapters: res.chapters, size: formatSize(res.blob.size), cover: extra });
    show('done');
  } catch (e) {
    console.error(e);
    $('errmsg').textContent = e instanceof UserError ? e.message : t('error.generic');
    show('error');
  } finally {
    busy = false;
  }
}

function renderArchiveList(entries) {
  const ul = $('archive-list');
  ul.innerHTML = '';
  for (const entry of entries) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = `${entry.name} (${formatSize(entry.size || 0)})`;
    btn.addEventListener('click', async () => {
      if (busy) return;
      busy = true;
      try {
        const file = await extractArchiveEntry(entry);
        await closeArchive();
        archiveEntries = [];
        await runConvert(file);
      } catch (e) {
        console.error(e);
        $('errmsg').textContent = e instanceof UserError ? e.message : t('error.generic');
        show('error');
        busy = false;
      }
    });
    li.appendChild(btn);
    ul.appendChild(li);
  }
}

// --- pick / drop ---
const drop = $('drop'), input = $('file');
$('pick').addEventListener('click', e => { e.stopPropagation(); input.click(); });
drop.addEventListener('click', () => input.click());
drop.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
input.addEventListener('change', () => { const f = input.files[0]; input.value = ''; handleFile(f); });
for (const ev of ['dragenter', 'dragover']) {
  window.addEventListener(ev, e => { e.preventDefault(); if (!busy) drop.classList.add('over'); });
}
for (const ev of ['dragleave', 'drop']) {
  window.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); });
}
window.addEventListener('drop', e => handleFile(e.dataTransfer?.files?.[0]));
$('again').addEventListener('click', () => show('drop'));
$('retry').addEventListener('click', () => show('drop'));
$('archive-cancel').addEventListener('click', async () => {
  await closeArchive();
  archiveEntries = [];
  show('drop');
});

// language
const langSel = $('lang');
langSel.value = getLang();
langSel.addEventListener('change', () => {
  setLang(langSel.value);
  applyI18n();
});
window.addEventListener('xteink:lang', applyI18n);

// Test hook
window.__xteinkConvert = handleFile;
window.__xteinkConvertRaw = convert;

// --- PWA / offline ---
const badge = $('offline');
async function checkOffline() {
  try {
    const hit = await caches.match('vendor/jszip.min.js');
    const done = !!hit && !!navigator.serviceWorker.controller;
    badge.textContent = done ? t('offline.ready') : t('offline.preparing');
    badge.classList.toggle('ready', done);
  } catch {
    badge.textContent = t('offline.unavailable');
  }
}
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(() => navigator.serviceWorker.ready)
    .then(() => { checkOffline(); setTimeout(checkOffline, 1500); });
  navigator.serviceWorker.addEventListener('controllerchange', () => setTimeout(checkOffline, 500));
  checkOffline();
} else {
  badge.textContent = t('offline.unsupported');
}

applyI18n();

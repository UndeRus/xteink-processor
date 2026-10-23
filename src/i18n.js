const STORAGE_KEY = 'xteink.lang';

const DICT = {
  vi: {
    'app.title': 'Xteink EPUB',
    'app.subtitle': 'Chuyển ebook sang EPUB tối giản cho máy đọc Xteink X3',
    'drop.title': 'Kéo thả ebook vào đây',
    'drop.or': 'hoặc',
    'drop.pick': 'Chọn tệp',
    'drop.formats': 'EPUB · AZW3 · AZW · MOBI · PRC · TXT · HTML · FB2 · ZIP · RAR · 7Z',
    'progress.start': 'Đang bắt đầu…',
    'done.ok': 'Chuyển đổi xong',
    'error.ok': 'Không chuyển đổi được',
    'error.generic': 'Đã xảy ra lỗi khi xử lý tệp. Tệp có thể bị hỏng hoặc không đúng định dạng.',
    'again': 'Chuyển tệp khác',
    'retry': 'Thử tệp khác',
    'offline.ready': 'Sẵn sàng offline',
    'offline.preparing': 'Đang chuẩn bị offline…',
    'offline.unavailable': 'Offline không khả dụng',
    'offline.unsupported': 'Trình duyệt không hỗ trợ offline',
    'footer.note': 'Mọi thao tác chạy ngay trên máy của bạn, tệp không được tải lên đâu.',
    'summary': '{chapters} chương · {size}{cover}',
    'coverSuffix': ' · có ảnh bìa',
    'download': 'Tải xuống {filename}',
    'archive.title': 'Chọn sách trong tệp nén',
    'archive.cancel': 'Hủy',
    'archive.none': 'Không tìm thấy sách được hỗ trợ trong tệp nén.',
    'archive.reading': 'Đang đọc tệp nén…',
    'lang.label': 'Ngôn ngữ',
    // convert messages
    'conv.reading': 'Đang đọc tệp…',
    'conv.processing': 'Đang xử lý nội dung…',
    'conv.cover': 'Đang xử lý ảnh bìa…',
    'conv.packaging': 'Đang đóng gói EPUB…',
    'conv.done': 'Hoàn tất',
    'err.unsupported': 'Định dạng ".{ext}" chưa được hỗ trợ. Hỗ trợ: EPUB, AZW3, AZW, MOBI, PRC, TXT, HTML, FB2.',
    'err.epub.drm': 'Sách này được bảo vệ bản quyền (DRM) nên không thể chuyển đổi.',
    'err.epub.nocontent': 'Không tìm thấy nội dung sách trong tệp EPUB.',
    'err.epub.badopf': 'Tệp EPUB có phần mô tả (OPF) bị lỗi.',
    'err.epub.nospine': 'Sách EPUB không có nội dung để chuyển đổi.',
    'err.epub.broken': 'Tệp EPUB bị hỏng hoặc không phải là tệp ZIP hợp lệ.',
    'err.fb2.invalid': 'Tệp FB2 không hợp lệ hoặc bị hỏng.',
    'err.fb2.empty': 'Tệp FB2 không có nội dung.',
    'err.html.empty': 'Tệp HTML không có nội dung.',
    'err.mobi.small': 'Tệp quá nhỏ hoặc bị hỏng.',
    'err.mobi.unknown': 'Không nhận dạng được định dạng Kindle/MOBI (có thể là PalmDOC cũ hoặc tệp bị hỏng).',
    'err.mobi.drm': 'Sách này được bảo vệ bản quyền (DRM) nên không thể chuyển đổi. Hãy dùng bản không có DRM.',
    'err.mobi.read': 'Không đọc được tệp MOBI/AZW. Tệp có thể bị hỏng, có DRM hoặc là định dạng không được hỗ trợ.',
    'err.mobi.nocontent': 'Không đọc được nội dung của tệp MOBI/AZW.',
    'err.txt.empty': 'Tệp văn bản trống.',
    'err.normalize.empty': 'Không tìm thấy nội dung văn bản trong tệp này.',
    'err.archive.none': 'Không tìm thấy sách được hỗ trợ trong tệp nén.',
    'err.archive.broken': 'Tệp nén bị hỏng hoặc không đọc được.',
    'chapter.preface': 'Mở đầu',
    'chapter.part': 'Phần',
  },
  en: {
    'app.title': 'Xteink EPUB',
    'app.subtitle': 'Convert ebooks to minimal EPUB for the Xteink X3 reader',
    'drop.title': 'Drop an ebook here',
    'drop.or': 'or',
    'drop.pick': 'Choose file',
    'drop.formats': 'EPUB · AZW3 · AZW · MOBI · PRC · TXT · HTML · FB2 · ZIP · RAR · 7Z',
    'progress.start': 'Starting…',
    'done.ok': 'Conversion finished',
    'error.ok': 'Conversion failed',
    'error.generic': 'An error occurred while processing the file. The file may be damaged or in an unsupported format.',
    'again': 'Convert another file',
    'retry': 'Try another file',
    'offline.ready': 'Ready offline',
    'offline.preparing': 'Preparing offline…',
    'offline.unavailable': 'Offline unavailable',
    'offline.unsupported': 'Browser does not support offline',
    'footer.note': 'Everything runs on your device; files are never uploaded.',
    'summary': '{chapters} chapters · {size}{cover}',
    'coverSuffix': ' · has cover image',
    'download': 'Download {filename}',
    'archive.title': 'Choose a book in the archive',
    'archive.cancel': 'Cancel',
    'archive.none': 'No supported books found in the archive.',
    'archive.reading': 'Reading archive…',
    'lang.label': 'Language',
    'conv.reading': 'Reading file…',
    'conv.processing': 'Processing content…',
    'conv.cover': 'Processing cover image…',
    'conv.packaging': 'Packaging EPUB…',
    'conv.done': 'Done',
    'err.unsupported': 'Format ".{ext}" is not supported. Supported: EPUB, AZW3, AZW, MOBI, PRC, TXT, HTML, FB2.',
    'err.epub.drm': 'This book is DRM-protected and cannot be converted.',
    'err.epub.nocontent': 'No book content found in the EPUB.',
    'err.epub.badopf': 'The EPUB description (OPF) is invalid.',
    'err.epub.nospine': 'The EPUB has no readable content.',
    'err.epub.broken': 'The EPUB file is damaged or not a valid ZIP.',
    'err.fb2.invalid': 'The FB2 file is invalid or damaged.',
    'err.fb2.empty': 'The FB2 file has no content.',
    'err.html.empty': 'The HTML file has no content.',
    'err.mobi.small': 'The file is too small or damaged.',
    'err.mobi.unknown': 'Could not recognize the Kindle/MOBI format (may be an old PalmDOC or a damaged file).',
    'err.mobi.drm': 'This book is DRM-protected. Please use a DRM-free copy.',
    'err.mobi.read': 'Could not read the MOBI/AZW file. It may be damaged, DRM-protected, or unsupported.',
    'err.mobi.nocontent': 'Could not read the content of the MOBI/AZW file.',
    'err.txt.empty': 'The text file is empty.',
    'err.normalize.empty': 'No text content found in the file.',
    'err.archive.none': 'No supported books found in the archive.',
    'err.archive.broken': 'The archive is damaged or could not be read.',
    'chapter.preface': 'Beginning',
    'chapter.part': 'Part',
  },
  ru: {
    'app.title': 'Xteink EPUB',
    'app.subtitle': 'Конвертация электронных книг в минимальный EPUB для ридера Xteink X3',
    'drop.title': 'Перетащите книгу сюда',
    'drop.or': 'или',
    'drop.pick': 'Выбрать файл',
    'drop.formats': 'EPUB · AZW3 · AZW · MOBI · PRC · TXT · HTML · FB2 · ZIP · RAR · 7Z',
    'progress.start': 'Запуск…',
    'done.ok': 'Конвертация завершена',
    'error.ok': 'Конвертация не удалась',
    'error.generic': 'Произошла ошибка при обработке файла. Файл может быть повреждён или иметь неподдерживаемый формат.',
    'again': 'Конвертировать другой файл',
    'retry': 'Попробовать другой файл',
    'offline.ready': 'Готово к офлайн-работе',
    'offline.preparing': 'Подготовка офлайн…',
    'offline.unavailable': 'Офлайн недоступен',
    'offline.unsupported': 'Браузер не поддерживает офлайн',
    'footer.note': 'Всё выполняется на вашем устройстве, файлы никуда не загружаются.',
    'summary': '{chapters} глав · {size}{cover}',
    'coverSuffix': ' · есть обложка',
    'download': 'Скачать {filename}',
    'archive.title': 'Выберите книгу в архиве',
    'archive.cancel': 'Отмена',
    'archive.none': 'В архиве не найдено поддерживаемых книг.',
    'archive.reading': 'Чтение архива…',
    'lang.label': 'Язык',
    'conv.reading': 'Чтение файла…',
    'conv.processing': 'Обработка содержимого…',
    'conv.cover': 'Обработка обложки…',
    'conv.packaging': 'Упаковка EPUB…',
    'conv.done': 'Готово',
    'err.unsupported': 'Формат ".{ext}" не поддерживается. Поддерживаемые: EPUB, AZW3, AZW, MOBI, PRC, TXT, HTML, FB2.',
    'err.epub.drm': 'Эта книга защищена DRM и не может быть конвертирована.',
    'err.epub.nocontent': 'В EPUB не найдено содержимого книги.',
    'err.epub.badopf': 'Описание EPUB (OPF) повреждено.',
    'err.epub.nospine': 'В EPUB нет читаемого содержимого.',
    'err.epub.broken': 'Файл EPUB повреждён или не является корректным ZIP.',
    'err.fb2.invalid': 'Файл FB2 недействителен или повреждён.',
    'err.fb2.empty': 'Файл FB2 не содержит содержимого.',
    'err.html.empty': 'Файл HTML не содержит содержимого.',
    'err.mobi.small': 'Файл слишком мал или повреждён.',
    'err.mobi.unknown': 'Не удалось распознать формат Kindle/MOBI (возможно, старый PalmDOC или повреждённый файл).',
    'err.mobi.drm': 'Эта книга защищена DRM. Используйте копию без DRM.',
    'err.mobi.read': 'Не удалось прочитать файл MOBI/AZW. Он может быть повреждён, защищён DRM или не поддерживаться.',
    'err.mobi.nocontent': 'Не удалось прочитать содержимое файла MOBI/AZW.',
    'err.txt.empty': 'Текстовый файл пуст.',
    'err.normalize.empty': 'В файле не найдено текстового содержимого.',
    'err.archive.none': 'В архиве не найдено поддерживаемых книг.',
    'err.archive.broken': 'Архив повреждён или не может быть прочитан.',
    'chapter.preface': 'Начало',
    'chapter.part': 'Часть',
  },
};

function detect() {
  const nav = (typeof navigator !== 'undefined' && (navigator.language || navigator.userLanguage)) || 'en';
  const base = String(nav).toLowerCase().split(/[-_]/)[0];
  return Object.prototype.hasOwnProperty.call(DICT, base) ? base : 'en';
}

let current = (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY)) || detect();
if (!Object.prototype.hasOwnProperty.call(DICT, current)) current = 'en';

export function getLang() { return current; }
export function setLang(lang) {
  if (!Object.prototype.hasOwnProperty.call(DICT, lang)) return;
  current = lang;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('xteink:lang', { detail: lang }));
}
export function t(key, vars) {
  const dict = DICT[current] || DICT.en;
  let str = dict[key];
  if (str == null) str = (DICT.en[key] != null ? DICT.en[key] : key);
  if (vars) {
    str = str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : ''));
  }
  return str;
}
export const SUPPORTED_LANGS = Object.keys(DICT);
export { DICT };
export function detectLang() { return detect(); }

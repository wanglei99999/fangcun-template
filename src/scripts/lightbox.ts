// Click-to-zoom for images in article bodies. Adapted from Fuwari's PhotoSwipe setup (MIT License);
// PhotoSwipe itself only loads when an article actually contains images.
import 'photoswipe/style.css';

const GALLERY = '.prose';
const IMAGES = '.prose img';

async function setup(): Promise<void> {
  if (!document.querySelector(IMAGES)) return;
  const { default: PhotoSwipeLightbox } = await import('photoswipe/lightbox');
  const lightbox = new PhotoSwipeLightbox({
    gallery: GALLERY,
    children: 'img',
    pswpModule: () => import('photoswipe'),
    padding: { top: 24, bottom: 24, left: 24, right: 24 },
    bgOpacity: 0.92,
    wheelToZoom: true,
    arrowPrev: false,
    arrowNext: false,
    imageClickAction: 'close',
    tapAction: 'close',
    doubleTapAction: 'zoom',
    closeTitle: '关闭',
    zoomTitle: '缩放',
  });
  // Markdown images carry no size hints for PhotoSwipe; use the image's own dimensions.
  lightbox.addFilter('domItemData', (itemData, element) => {
    if (element instanceof HTMLImageElement) {
      itemData.src = element.currentSrc || element.src;
      itemData.msrc = itemData.src;
      itemData.w = element.naturalWidth || innerWidth;
      itemData.h = element.naturalHeight || innerHeight;
      itemData.alt = element.alt;
    }
    return itemData;
  });
  lightbox.init();
}

void setup();

import Drupal from 'drupal';
import once from 'once';

Drupal.behaviors.arrowLink = {
  attach(context) {
    const arrowLinks = once(
      'arrow-links-prevent-wrap',
      '.c-arrow-link, .c-arrow-link--white, .c-cta-link',
      context
    );
    arrowLinks.forEach(link => {
      const html = link.innerHTML;
      if (html.indexOf('c-arrow-link__word') > -1) {
        return;
      }

      // Get the deepest nested Text Node of the last child element in the
      // link. This ensures we're accounting for markup within the <a> tag.
      let lastTextChild = link.lastChild;
      while (lastTextChild) {
        if (lastTextChild.nodeType === Node.TEXT_NODE) {
          break;
        }
        lastTextChild = lastTextChild.lastChild;
      }

      if (lastTextChild) {
        const text = lastTextChild.nodeValue
        const textArray = text.trim().split(' ');
        const lastWord = textArray[textArray.length - 1];

        if (lastWord) {
          const lastWordMarkup = `<span class="c-arrow-link__word">${lastWord}</span>`;
          const lastIndex = text.lastIndexOf(lastWord);
          link.innerHTML =
            text.substring(0, lastIndex) +
            lastWordMarkup +
            text.substring(lastIndex + lastWord.length);
        }
      }
    });
  },
};

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

      // Check if this element already has a child span with a *.__word class.
      let lastTextChild = null;
      const existingWordSpan = link.querySelector('[class$="__word"]');
      if (existingWordSpan) {
        // Move the last word text content out of the existing *.__word span, then remove the span.
        lastTextChild = existingWordSpan.firstChild;
        existingWordSpan.parentElement.appendChild(lastTextChild);
        existingWordSpan.remove();
      }
      else {
        // Get the deepest nested Text Node of the last child element in the
        // link. This ensures we're accounting for markup within the <a> tag.
        lastTextChild = link.lastChild;
        while (lastTextChild) {
          if (lastTextChild.nodeType === Node.TEXT_NODE) {
            break;
          }
          lastTextChild = lastTextChild.lastChild;
        }
      }

      if (lastTextChild) {
        const text = lastTextChild.parentElement.innerHTML;
        const textArray = text.trim().split(' ');
        const lastWord = textArray.pop();

        if (lastWord) {
          const lastWordMarkup = `<span class="c-arrow-link__word">${lastWord}</span>`;
          const lastIndex = text.lastIndexOf(lastWord);
          lastTextChild.parentElement.innerHTML =
            text.substring(0, lastIndex) +
            lastWordMarkup +
            text.substring(lastIndex + lastWord.length);
        }
      }
    });
  },
};

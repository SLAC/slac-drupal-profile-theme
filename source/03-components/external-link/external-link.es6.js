import Drupal from 'drupal';
import drupalSettings from 'drupalSettings';

Drupal.behaviors.externalLinks = {
  attach(context) {
    const allowedDomains = [];
    const lockedDomains = [
      'intranet.slac.stanford.edu',
      'userportal.slac.stanford.edu',
      'www-internal.slac.stanford.edu',
      'internal.slac.stanford.edu',
      'int.slac.stanford.edu',
      'www-bis1.slac.stanford.edu',
      'www-bis2.slac.stanford.edu',
      'slac.sharepoint.com',
      'slacspace.slac.stanford.edu',
      'slac.wta-us8.wfs.cloud',
      'slacprod.servicenowservices.com',
      'slac.slack.com',
      'erp-fsprd.erp.slac.stanford.edu',
      'login.adaptiveinsights.com',
    ];
    function linkIsExternal(linkElement) {
      let isExternal = true;
      if (
        linkElement.host === 'www6.slac.stanford.edu' ||
        linkElement.host.endsWith('.slac.stanford.edu') ||
        linkElement.host === window.location.host
      ) {
        isExternal = false;
      }

      if (allowedDomains.length) {
        allowedDomains.forEach(domain => {
          if (
            linkElement.host === domain ||
            linkElement.host.endsWith(`.${domain}`)
          ) {
            isExternal = false;
          }
        });
      }

      return isExternal;
    }

    function linkIsLocked(linkElement) {
      let isLocked = false;
      if (linkElement.host === window.location.host) {
        return isLocked;
      }
      if (lockedDomains.length) {
        lockedDomains.forEach(domain => {
          if (
            linkElement.host === domain ||
            linkElement.host.endsWith(`.${domain}`)
          ) {
            isLocked = true;
          }
        });
      }
      return isLocked;
    }

    const externalLinks = context.querySelectorAll(
      "a:not([href=''], [href^='#'], [href^='?'], [href^='/'], [href^='.'], [href^='javascript:'], [href^='mailto:'], [href^='tel:'], .c-logo, .c-social-links__link, .rss-link, .c-event-details__link, .external-link--no-icon)"
    );

    externalLinks.forEach(el => {
      if (el.hasAttribute('href') && !el.querySelector('img')) {
        // Check if this element already has a child span with a *.__word class.
        let lastTextChild = null;
        const existingWordSpan = el.querySelector('[class$="__word"]');
        if (existingWordSpan) {
          // Move the last word text content out of the existing *.__word span, then remove the span.
          lastTextChild = existingWordSpan.firstChild;
          existingWordSpan.parentElement.appendChild(lastTextChild);
          existingWordSpan.remove();
        }
        else {
         // Get the deepest nested Text Node of the last child element in the
         // link. This ensures we're accounting for markup within the <a> tag.
         lastTextChild = el.lastChild;
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
            let lastWordMarkup = lastWord;
            if (linkIsLocked(el)) {
              lastWordMarkup = `<span class="external-link__word">${lastWord}<svg class="c-icon" role="img"><title>(requires login)</title><use xlink:href="${drupalSettings.gesso.gessoImagePath}/sprite.artifact.svg#lock-solid"></use></svg></span>`;
              el.classList.add('external-link', 'external-link--locked');
            } else if (linkIsExternal(el)) {
              lastWordMarkup = `<span class="external-link__word">${lastWord}<svg class="c-icon" role="img"><title>(external link)</title><use xlink:href="${drupalSettings.gesso.gessoImagePath}/sprite.artifact.svg#diagonal-arrow"></use></svg></span>`;
              el.classList.add('external-link');
            }
            const lastIndex = text.lastIndexOf(lastWord);
            lastTextChild.parentElement.innerHTML =
              text.substring(0, lastIndex) +
              lastWordMarkup +
              text.substring(lastIndex + lastWord.length);
          }
        }

      }
    });
  },
};

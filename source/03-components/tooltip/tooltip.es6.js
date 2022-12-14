import Drupal from 'drupal';
import once from 'once';

Drupal.behaviors.gessoTooltip = {
  attach(context) {
    const tooltips = once('tooltip-init', '.c-tooltip', context);
    tooltips.forEach(tooltip => {
      const tooltipButton = tooltip.querySelector('.c-tooltip__button');
      const tooltipTip = tooltip.querySelector('.c-tooltip__tooltip');
      if (tooltipTip && tooltipButton) {
        tooltipButton.addEventListener('click', event => {
          event.preventDefault();
          tooltipTip.hidden = !tooltipTip.hidden;
        });
      }
    });

    window.addEventListener('keyup', event => {
      const { key } = event;
      if (key === 'Escape') {
        const tooltipTips = context.querySelectorAll('.c-tooltip__tooltip');
        tooltipTips.forEach(tooltip => {
          tooltip.hidden = true;
        });
      }
    });
  },
};

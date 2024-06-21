<?php

/**
 * @file
 * PAGE-related hook implementations.
 */

/**
 * Implements hook_theme_suggestions_HOOK_alter().
 */
function slac_theme_suggestions_page_alter(array &$suggestions, array $variables) {
  $route_name = \Drupal::routeMatch()->getRouteName();
  if ($route_name == 'entity.node.canonical' && !in_array('page__node', $suggestions)) {
    $suggestions[] = 'page__node';
  }
}

function slac_preprocess_page(&$variables) {
    $variables['slac_today_header_link'] = theme_get_setting('slac_today_header_link');
}
<?php

/**
 * @file
 * Region-related hook implementations.
 */

/**
 * Implements hook_preprocess_region().
 */
function slac_preprocess_region(&$variables) {
  if ($variables['region'] == 'header') {
    $variables['include_slac_web_search'] = theme_get_setting('include_slac_web_search', 'slac') ?? FALSE;
  }
}

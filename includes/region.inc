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
    $variables['include_slac_web_search'] = theme_get_setting('include_slac_web_search') ?? FALSE;
    $search_this_site_placeholder = theme_get_setting('search_this_site_placeholder');

    if (!$search_this_site_placeholder) {
      $site_settings = \Drupal::service('plugin.manager.site_settings_loader')->getActiveLoaderPlugin();
      $organization_details = $site_settings->loadByGroup('organization_details');
      if ($organization_details) {
        foreach ($organization_details as $organization_detail) {
          $search_this_site_placeholder = $organization_detail->field_acronym->value ?? $organization_detail->field_organization_name->value;
        }
      }
      else {
        $search_this_site_placeholder = \Drupal::config('system.site')->get('name');
      }

      $search_this_site_placeholder = trim("Search {$search_this_site_placeholder}");
    }

    $variables['search_this_site_placeholder'] = $search_this_site_placeholder;
    $variables['#attached']['drupalSettings']['search_this_site_placeholder'] = $search_this_site_placeholder;
    $variables['#attached']['drupalSettings']['search_people_placeholder'] = 'Search people by name';
  }
}

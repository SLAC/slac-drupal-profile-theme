<?php

/**
 * @file
 * Functions to support theme settings.
 */

use Drupal\Core\Form\FormStateInterface;

/**
 * Implements hook_form_FORM_ID_alter() for system_theme_settings.
 */
function slac_form_system_theme_settings_alter(&$form, FormStateInterface $form_state) {
  // Work-around for a core bug affecting admin themes.
  // See https://www.drupal.org/docs/8/theming-drupal-8/creating-advanced-theme-settings.
  if (isset($form_id)) {
    return;
  }

  $form['back_to_top'] = [
    '#type' => 'details',
    '#title' => t('Back to Top'),
    '#open' => theme_get_setting('include_back_to_top') ?? TRUE,
  ];
  $form['back_to_top']['include_back_to_top'] = [
    '#type' => 'checkbox',
    '#title' => t('Include back to top'),
    '#default_value' => theme_get_setting('include_back_to_top') ?? TRUE,
  ];
  $form['back_to_top']['threshold'] = [
    '#type' => 'textfield',
    '#title' => t('Back to top threshold'),
    '#description' => t('How far, in pixels, a user should scroll down the page before the back to top component appears'),
    '#default_value' => theme_get_setting('threshold') ?? 200,
  ];
  $form['back_to_top']['smooth_scroll'] = [
    '#type' => 'checkbox',
    '#title' => t('Enable smooth scroll'),
    '#description' => t('Whether to animate the scroll back to the top'),
    '#default_value' => theme_get_setting('smooth_scroll') ?? TRUE,
  ];

  $form['breadcrumb'] = [
    '#type' => 'details',
    '#title' => t('Breadcrumb'),
    '#open' => TRUE,
  ];
  $form['breadcrumb']['include_current_page_in_breadcrumb'] = [
    '#type' => 'checkbox',
    '#title' => t('Include current page in breadcrumb'),
    '#default_value' => theme_get_setting('include_current_page_in_breadcrumb') ?? TRUE,
  ];

  $form['social_media_share_icons'] = [
    '#type' => 'details',
    '#title' => t('Hide Social Share Icons'),
    '#open' => TRUE,
    ];
  $form['social_media_share_icons']['hide_social_media_share_icons'] = [
    '#type' => 'checkbox',
    '#title' => t('Hide Social Media Icons'),
    '#description' => t('If enabled, social media icons will not be shown on the side'),
    '#default_value' => theme_get_setting('hide_social_media_share_icons'),
    ];

  $form['slac_today_header_link'] =[
    '#type' => 'textfield',
    '#title' => t('Slac today header link'),
    '#default_value' => theme_get_setting('slac_today_header_link'),
    '#description' => t('The slac today header link'),
    ];

  $form['slac_web_search'] = [
    '#type' => 'details',
    '#title' => 'SLAC search',
    '#open' => TRUE,
  ];

  $form['slac_web_search']['include_slac_web_search'] = [
    '#type' => 'checkbox',
    '#title' => t('Include SLAC web search option?'),
    '#default_value' => theme_get_setting('include_slac_web_search') ?? FALSE,
  ];

  $form['slac_web_search']['search_this_site_placeholder'] = [
      '#type' => 'textfield',
      '#title' => t('Custom placeholder text when "This site" search option is selected'),
      '#description' => t('<p>If no value is entered, then the following values will be used in this order:<ul><li>Organization Acronym (Organization Details Site Setting)</li><li>Organization Name (Organization Details Site Setting)</li><li>Site Name (Basic site settings)</li></ul></p>'),
      '#default_value' => theme_get_setting('search_this_site_placeholder'),
  ];
}

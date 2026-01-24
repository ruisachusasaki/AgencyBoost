export const sectionDescriptionTemplates: Record<string, string> = {
  "Task Basics": `## Task Overview

**Task Name:** {{task_name}}
**Type:** {{task_scope}} task
**Client:** {{client_select}}
**Due Date:** {{due_date}}
**Priority:** {{priority_level}}
{{#if urgent_reason}}
**Urgency Reason:** {{urgent_reason}}
{{/if}}`,

  "Department Selection": `**Department:** {{department}}`,

  "Creative Type": `---
## Creative Request

**Creative Type:** {{creative_type}}
{{#if creative_kpi}}**Target KPI:** {{creative_kpi}}{{/if}}
{{#if creative_cta}}**CTA:** {{creative_cta}}{{/if}}
{{#if creative_audience}}**Target Audience:** {{creative_audience}}{{/if}}

**Asset Links:**
{{#if raw_files_link}}- RAW Files: {{raw_files_link}}{{/if}}
{{#if approved_files_link}}- Approved Files: {{approved_files_link}}{{/if}}
{{#if canva_link}}- Canva: {{canva_link}}{{/if}}
{{#if loom_link}}- Loom: {{loom_link}}{{/if}}`,

  "Creative - Copy Details": `---
## Copy Details

**Variations Needed:** {{copy_variations_count}}
**Usage:** {{copy_usage_location}}
{{#if copy_usage_other}}({{copy_usage_other}}){{/if}}

{{#if copy_legal_requirements}}
**Legal/Compliance Requirements:**
{{copy_legal_requirements}}
{{/if}}

{{#if copy_example}}
**Example/Reference:**
{{copy_example}}
{{/if}}`,

  "Creative - Graphic Details": `---
## Graphic Details

**Usage:** {{graphic_usage_location}}
{{#if graphic_usage_other}}({{graphic_usage_other}}){{/if}}
**Sizes Needed:** {{graphic_sizes}}
{{#if graphic_custom_size}}(Custom: {{graphic_custom_size}}){{/if}}
**Formats:** {{graphic_formats}}
{{#if graphic_format_other}}({{graphic_format_other}}){{/if}}
**Quantity:** {{graphic_count}}`,

  "Creative - Landing Page Details": `---
## Landing Page Details

**Approach:** {{lp_creative_approach}}
**Page Type:** {{lp_page_type}}
{{#if lp_page_type_other}}({{lp_page_type_other}}){{/if}}
**Traffic Source:** {{lp_traffic_source}}
{{#if lp_traffic_other}}({{lp_traffic_other}}){{/if}}
**Variations Needed:** {{lp_variation_count}}

**Links:**
{{#if lp_engager_link}}- Engager LP: {{lp_engager_link}}{{/if}}
{{#if lp_graphics_save_link}}- Graphics Folder: {{lp_graphics_save_link}}{{/if}}
{{#if lp_cro_doc}}- CRO Doc: {{lp_cro_doc}}{{/if}}
{{#if lp_copy_link}}- Copy Doc: {{lp_copy_link}}{{/if}}
{{#if lp_media_link}}- Media Assets: {{lp_media_link}}{{/if}}
{{#if lp_process_map}}- Process Map: {{lp_process_map}}{{/if}}
{{#if lp_example}}- Example LP: {{lp_example}}{{/if}}

**Conversion Element:** {{lp_conversion_element}}
{{#if lp_separate_step_details}}{{lp_separate_step_details}}{{/if}}

{{#if lp_social_proof}}
**Social Proof Available:** {{lp_social_proof}}
{{#if lp_social_proof_links}}{{lp_social_proof_links}}{{/if}}
{{/if}}

**Copy Ready:** {{lp_copy_ready}}
**Thank You Page:** {{lp_thankyou_needed}}
{{#if lp_thankyou_details}}{{lp_thankyou_details}}{{/if}}

{{#if lp_confirmation_details}}
**Confirmation Details:**
{{lp_confirmation_details}}
{{/if}}

{{#if lp_competitors}}
**Competitor LPs:**
{{lp_competitors}}
{{/if}}`,

  "Creative - Video Details": `---
## Video Details

**Variations Needed:** {{video_variation_count}}
**Usage:** {{video_usage}}
{{#if video_usage_other}}({{video_usage_other}}){{/if}}

**Specifications:**
- Aspect Ratio: {{video_aspect_ratio}}{{#if video_aspect_custom}} ({{video_aspect_custom}}){{/if}}
- Duration: {{video_duration}}
- Subtitles/Captions: {{video_subtitles}}
{{#if video_intro_outro}}- Intro/Outro: {{video_intro_outro}}{{/if}}
- Background Music: {{video_music}}

**Assets:**
{{#if video_script_link}}- Script: {{video_script_link}}{{/if}}
{{#if video_footage_link}}- Footage: {{video_footage_link}}{{/if}}
{{#if video_example}}- Example: {{video_example}}{{/if}}`,

  "Creative - Motion Graphic Details": `---
## Motion Graphic Details

**Quantity:** {{motion_count}}
**Usage:** {{motion_usage}}
{{#if motion_usage_other}}({{motion_usage_other}}){{/if}}`,

  "Creative - Live Event Details": `---
## Live Event Information

**City/Cities:** {{live_event_cities}}
**Date(s):** {{live_event_dates}}
**Speaker(s):** {{live_event_speakers}}
{{#if live_event_process_map}}**Process Map:** {{live_event_process_map}}{{/if}}`,

  "DevOps Type": `---
## DevOps Request

**Request Type:** {{devops_type}}

**Links:**
{{#if devops_content_docs}}- Content Docs: {{devops_content_docs}}{{/if}}
{{#if devops_engager_lp}}- Engager LP: {{devops_engager_lp}}{{/if}}
{{#if devops_engager_automations}}- Automations: {{devops_engager_automations}}{{/if}}`,

  "DevOps - Landing Page Details": `---
## DevOps Landing Page Details

**Scope:** {{devops_lp_scope}}
{{#if devops_lp_products_doc}}- Products/Pricing Doc: {{devops_lp_products_doc}}{{/if}}
**Process Map:** {{devops_lp_process_map}}

**Page Structure:**
- Main LP: {{devops_lp_main}}
- Steps: {{devops_lp_steps}}

**Assets Checklist:**
{{#if devops_lp_favicon}}- Favicon: {{devops_lp_favicon}}{{/if}}
- Emails: {{devops_lp_emails}}
{{#if devops_lp_sms}}- SMS: {{devops_lp_sms}}{{/if}}
- Confirmation Pages: {{devops_lp_confirmations}}
- Tracking Ready: {{devops_lp_tracking}}`,

  "DevOps - Landing Page A/B Test Details": `---
## A/B Test Configuration

**Test Name:** {{ab_test_name}}
**Traffic Split:** {{ab_test_traffic}}
**Channels:** {{ab_test_channels}}
**Markets:** {{ab_test_markets}}

**Test Details:**
{{ab_test_details}}

**Variations:**
{{ab_test_variations}}

{{#if ab_test_tags}}**Tags/Custom Fields:** {{ab_test_tags}}{{/if}}

**Forms Needed:** {{ab_test_forms_needed}}
{{#if ab_test_forms_details}}{{ab_test_forms_details}}{{/if}}

**Copy Needed:** {{ab_test_copy_needed}}
{{#if ab_test_copy_details}}{{ab_test_copy_details}}{{/if}}`,

  "DevOps - Webinar Details": `---
## Webinar Details

**Platform:** {{webinar_platform}}
**Topic:** {{webinar_topic}}
**Date(s):** {{webinar_dates}}
**Type:** {{webinar_type}}
**Audience:** {{webinar_audience_type}} - {{webinar_audience}}
**Hosts/Panelists:** {{webinar_hosts}}
**Process Map:** {{webinar_process_map}}

{{#if webinar_tags}}**Tag Outline:** {{webinar_tags}}{{/if}}

**Email Sequence:**
- Sender: {{webinar_email_sender_name}} ({{webinar_email_sender_email}})
{{#if webinar_email_sequence}}{{webinar_email_sequence}}{{/if}}

{{#if webinar_sms_sequence}}
**SMS Sequence:**
{{webinar_sms_sequence}}
{{/if}}`,

  "DevOps - Troubleshooting Details": `---
## Troubleshooting Request

**Link to Issue:** {{troubleshoot_link}}
**Loom Recording:** {{troubleshoot_loom}}`,

  "DevOps - Phone Integration Details": `---
## Phone Integration Request

**Details:**
{{phone_integration_details}}

**Systems to Integrate:**
{{phone_integration_systems}}

{{#if phone_integration_timeline}}**Expected Timeline:** {{phone_integration_timeline}}{{/if}}

_Note: Phone integrations typically take 3-4 days._`,

  "DevOps - Market Launch Details": `---
## Market Launch Request

**Markets:**
{{market_launch_markets}}

**Target Launch Date:** {{market_launch_date}}

**Requirements:**
{{market_launch_details}}`,

  "DevOps - A2P Registration Details": `---
## A2P Registration Request

**Details:**
{{a2p_details}}

**Campaigns/Numbers:**
{{a2p_campaigns}}`,

  "Data Task Type": `---
## Data Request

**Request Type:** {{data_type}}
{{#if data_type_other}}({{data_type_other}}){{/if}}

{{#if data_existing_report}}**Existing Report:** {{data_existing_report}}{{/if}}
{{#if data_example_report}}**Example Report:** {{data_example_report}}{{/if}}

{{#if data_secondary}}**Secondary Items:** {{data_secondary}}{{/if}}
{{#if data_secondary_other}}({{data_secondary_other}}){{/if}}

**QA/Approver:** {{data_qa_approver}}
{{#if data_qa_email}}({{data_qa_email}}){{/if}}`,

  "Data - Test Reporting Details": `---
## Test Reporting Details

**Hypothesis:**
{{test_hypothesis}}

**KPI Support:**
{{test_kpi_support}}

**Audience/Segment:** {{test_audience}}
**Tracking Setup:** {{test_tracking}}
**Duration:** {{test_duration}}
**Success Criteria:** {{test_success_criteria}}
**Test Owner:** {{test_owner}}`,

  "Data - New Dashboard Details": `---
## New Dashboard Details

**Primary User:** {{dashboard_primary_user}}
{{#if dashboard_user_other}}({{dashboard_user_other}}){{/if}}

**Top 3 KPIs:**
1. {{dashboard_kpi_1}}
2. {{dashboard_kpi_2}}
3. {{dashboard_kpi_3}}

**Filters:** {{dashboard_filters}}
{{#if dashboard_filters_other}}({{dashboard_filters_other}}){{/if}}

**Visualizations:** {{dashboard_visualizations}}
{{#if dashboard_viz_other}}({{dashboard_viz_other}}){{/if}}

**Update Frequency:** {{dashboard_update_frequency}}

{{#if dashboard_data_sources}}**Data Sources:** {{dashboard_data_sources}}{{/if}}
{{#if dashboard_access}}**Access Requirements:** {{dashboard_access}}{{/if}}`,

  "Data - New Dashboard Page Details": `---
## New Dashboard Page Details

**Add to Dashboard:** {{dashboard_page_parent}}
**Goal:** {{dashboard_page_goal}}
{{#if dashboard_page_goal_other}}({{dashboard_page_goal_other}}){{/if}}

**Charts/Metrics:**
{{dashboard_page_charts}}

{{#if dashboard_page_sources}}**New Data Sources:** {{dashboard_page_sources}}{{/if}}

**Reuse Filters:** {{dashboard_page_filters}}
{{#if dashboard_page_filters_detail}}{{dashboard_page_filters_detail}}{{/if}}`,

  "Data - One-Off Report Details": `---
## One-Off Report Details

**Data Points/Columns:**
{{report_data_points}}

**Time Range:** {{report_time_range}}
**Grouping:** {{report_grouping}}
{{#if report_grouping_other}}({{report_grouping_other}}){{/if}}
**Format:** {{report_format}}
{{#if report_format_other}}({{report_format_other}}){{/if}}

**Sharing:** {{report_shared}}
{{#if report_shared_who}}({{report_shared_who}}){{/if}}

**Visualization:** {{report_viz_needed}}
{{#if report_viz_details}}{{report_viz_details}}{{/if}}`,

  "Data - Extra Information": `---
## Additional Data Requirements

{{#if data_naming_conventions}}**Naming Conventions:** {{data_naming_conventions}}{{/if}}

**Existing Formulas to Replicate:** {{data_existing_formulas}}
{{#if data_formulas_detail}}{{data_formulas_detail}}{{/if}}

{{#if data_new_fields}}**New Fields/Tags/Segmentations:** {{data_new_fields}}{{/if}}

**Duplicate for Other Clients:** {{data_duplicate}}

{{#if data_compliance}}**Compliance/Privacy Considerations:** {{data_compliance}}{{/if}}`
};

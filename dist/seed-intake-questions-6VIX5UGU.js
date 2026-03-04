import "./chunk-R5U7XKVJ.js";

// server/seed-intake-questions.ts
var intakeQuestionsSeed = [
  {
    sectionName: "Task Basics",
    questions: [
      { orderIndex: 0, questionText: "What is the name of this task?", questionType: "text", isRequired: true, internalLabel: "task_name" },
      { orderIndex: 10, questionText: "Is this a personal task or team task?", questionType: "single_choice", isRequired: true, internalLabel: "task_scope", options: ["Personal", "Team"] },
      { orderIndex: 20, questionText: "Which client is this for?", questionType: "single_choice", isRequired: true, internalLabel: "client_select", options: ["Select Client"] },
      { orderIndex: 30, questionText: "What is the due date?", questionType: "date", isRequired: false, internalLabel: "due_date" },
      { orderIndex: 40, questionText: "What is the priority level?", questionType: "single_choice", isRequired: true, internalLabel: "TRIGGER - priority_level", options: ["Low", "Medium", "High", "Urgent"] },
      { orderIndex: 50, questionText: "Why is this urgent? What's driving the deadline?", questionType: "textarea", isRequired: true, internalLabel: "urgent_reason" }
    ]
  },
  {
    sectionName: "Department Selection",
    questions: [
      { orderIndex: 0, questionText: "Which department is this task for?", questionType: "single_choice", isRequired: true, internalLabel: "TRIGGER - department", options: ["Creative", "DevOps", "Data"] }
    ]
  },
  {
    sectionName: "Creative Type",
    questions: [
      { orderIndex: 0, questionText: "What type of creative is needed?", questionType: "single_choice", isRequired: true, internalLabel: "TRIGGER - creative_type", options: ["Copywriting", "Graphic", "Landing Page", "Video", "Motion Graphic"] },
      { orderIndex: 10, questionText: "What KPI are we trying to improve?", questionType: "text", isRequired: false, internalLabel: "creative_kpi" },
      { orderIndex: 20, questionText: "Link to Google Drive location for RAW files", questionType: "url", isRequired: false, internalLabel: "raw_files_link" },
      { orderIndex: 30, questionText: "Link to Google Drive location for APPROVED files", questionType: "url", isRequired: false, internalLabel: "approved_files_link" },
      { orderIndex: 40, questionText: "Canva link (if applicable)", questionType: "url", isRequired: false, internalLabel: "canva_link" },
      { orderIndex: 50, questionText: "Loom link (if applicable)", questionType: "url", isRequired: false, internalLabel: "loom_link" },
      { orderIndex: 60, questionText: "What's the CTA (Call to Action)?", questionType: "text", isRequired: false, internalLabel: "creative_cta" },
      { orderIndex: 70, questionText: "Who is the desired audience?", questionType: "textarea", isRequired: false, internalLabel: "creative_audience" }
    ]
  },
  {
    sectionName: "Creative - Copy Details",
    questions: [
      { orderIndex: 0, questionText: "How many copy variations do you need?", questionType: "number", isRequired: true, internalLabel: "copy_variations_count" },
      { orderIndex: 10, questionText: "Where will this copy be used?", questionType: "multi_choice", isRequired: true, internalLabel: "copy_usage_location", options: ["Advertising (limited character count)", "Landing Pages", "Social Media Organic Post", "Email", "Print", "Other"] },
      { orderIndex: 20, questionText: 'If "Other" selected above, please explain', questionType: "text", isRequired: false, internalLabel: "copy_usage_other" },
      { orderIndex: 30, questionText: "Any legal or compliance requirements? (Disclaimers, restricted phrases, etc.)", questionType: "textarea", isRequired: false, internalLabel: "copy_legal_requirements" },
      { orderIndex: 40, questionText: "Can you provide an example of copy you like?", questionType: "textarea", isRequired: false, internalLabel: "copy_example" },
      { orderIndex: 50, questionText: "Is this for a live event client?", questionType: "single_choice", isRequired: true, internalLabel: "TRIGGER - copy_live_event", options: ["Yes", "No"] }
    ]
  },
  {
    sectionName: "Creative - Graphic Details",
    questions: [
      { orderIndex: 0, questionText: "Where will this graphic be used?", questionType: "multi_choice", isRequired: true, internalLabel: "graphic_usage_location", options: ["Landing Pages", "Social Media Organic Post", "Email", "Print", "Other"] },
      { orderIndex: 10, questionText: 'If "Other" selected above, please provide details', questionType: "text", isRequired: false, internalLabel: "graphic_usage_other" },
      { orderIndex: 20, questionText: "What graphic size(s) are needed?", questionType: "multi_choice", isRequired: true, internalLabel: "graphic_sizes", options: ["16:9 (Horizontal) - YouTube/Website", "9:16 (Vertical) - Reels/TikTok/Shorts", "1:1 (Square) - Instagram/Facebook Feed", "4:5 (Portrait) - Facebook/Instagram", "Custom"] },
      { orderIndex: 30, questionText: 'If "Custom" selected, what are the dimensions?', questionType: "text", isRequired: false, internalLabel: "graphic_custom_size" },
      { orderIndex: 40, questionText: "What file format(s) are needed?", questionType: "multi_choice", isRequired: true, internalLabel: "graphic_formats", options: ["PNG (Transparent background)", "WEBP (Smaller file size)", "PDF (Print/high-res)", "Other"] },
      { orderIndex: 50, questionText: 'If "Other" format, please explain', questionType: "text", isRequired: false, internalLabel: "graphic_format_other" },
      { orderIndex: 60, questionText: "How many graphics do you need?", questionType: "number", isRequired: true, internalLabel: "graphic_count" },
      { orderIndex: 70, questionText: "Is this for a live event client?", questionType: "single_choice", isRequired: true, internalLabel: "TRIGGER - graphic_live_event", options: ["Yes", "No"] }
    ]
  },
  {
    sectionName: "Creative - Landing Page Details",
    questions: [
      { orderIndex: 0, questionText: "Would you like the creative team to make improvements or replicate control?", questionType: "single_choice", isRequired: true, internalLabel: "lp_creative_approach", options: ["Improve", "Replicate"] },
      { orderIndex: 10, questionText: "Engager Link to Landing Page", questionType: "url", isRequired: false, internalLabel: "lp_engager_link" },
      { orderIndex: 20, questionText: "Link to Save LP Graphics", questionType: "url", isRequired: false, internalLabel: "lp_graphics_save_link" },
      { orderIndex: 30, questionText: "CRO Evaluation Doc Link", questionType: "url", isRequired: false, internalLabel: "lp_cro_doc" },
      { orderIndex: 40, questionText: "What is the page type?", questionType: "single_choice", isRequired: true, internalLabel: "lp_page_type", options: ["Lead Generation", "Sales Page", "Webinar/Event Registration", "Product Page", "Other"] },
      { orderIndex: 50, questionText: 'If "Other" page type, please explain', questionType: "text", isRequired: false, internalLabel: "lp_page_type_other" },
      { orderIndex: 60, questionText: "Where will this landing page be used?", questionType: "multi_choice", isRequired: true, internalLabel: "lp_traffic_source", options: ["Paid Ads", "Organic Traffic", "Email Campaign", "Social Media", "Other"] },
      { orderIndex: 70, questionText: 'If "Other" traffic source, please explain', questionType: "text", isRequired: false, internalLabel: "lp_traffic_other" },
      { orderIndex: 80, questionText: "How many variations do you need?", questionType: "number", isRequired: true, internalLabel: "lp_variation_count" },
      { orderIndex: 90, questionText: "Top Competitors' Landing Pages (if known)", questionType: "textarea", isRequired: false, internalLabel: "lp_competitors" },
      { orderIndex: 100, questionText: "What social proof is available?", questionType: "multi_choice", isRequired: false, internalLabel: "lp_social_proof", options: ["Testimonials", "Case Studies", "Trust Badges", "Video Proof", "Media Mentions"] },
      { orderIndex: 110, questionText: "Links to social proof assets", questionType: "textarea", isRequired: false, internalLabel: "lp_social_proof_links" },
      { orderIndex: 120, questionText: "Do you have the copy ready?", questionType: "single_choice", isRequired: true, internalLabel: "lp_copy_ready", options: ["Yes", "No - use placeholder"] },
      { orderIndex: 130, questionText: "If yes, link to copy", questionType: "url", isRequired: false, internalLabel: "lp_copy_link" },
      { orderIndex: 140, questionText: "Example Landing Page (if applicable)", questionType: "url", isRequired: false, internalLabel: "lp_example" },
      { orderIndex: 150, questionText: "Opt-In or Checkout Element", questionType: "single_choice", isRequired: true, internalLabel: "lp_conversion_element", options: ["Opt-In Form (on page)", "Opt-In Form (separate step)", "Checkout (on page)", "Checkout (separate step)"] },
      { orderIndex: 160, questionText: "If separate step, provide link or funnel position details", questionType: "text", isRequired: false, internalLabel: "lp_separate_step_details" },
      { orderIndex: 170, questionText: "Confirmation required after opt-in or checkout? (email, phone, etc.)", questionType: "textarea", isRequired: false, internalLabel: "lp_confirmation_details" },
      { orderIndex: 180, questionText: "Is a separate Thank You / Confirmation page needed?", questionType: "single_choice", isRequired: true, internalLabel: "lp_thankyou_needed", options: ["Yes", "No - confirmation handled another way"] },
      { orderIndex: 190, questionText: "If yes, details on messaging & additional CTAs", questionType: "textarea", isRequired: false, internalLabel: "lp_thankyou_details" },
      { orderIndex: 200, questionText: "Link to Images/Video for Landing Page", questionType: "url", isRequired: false, internalLabel: "lp_media_link" },
      { orderIndex: 210, questionText: "Process Map Link (Lucidchart, etc.)", questionType: "url", isRequired: false, internalLabel: "lp_process_map" },
      { orderIndex: 220, questionText: "Is this for a live event client?", questionType: "single_choice", isRequired: true, internalLabel: "TRIGGER - lp_live_event", options: ["Yes", "No"] }
    ]
  },
  {
    sectionName: "Creative - Video Details",
    questions: [
      { orderIndex: 0, questionText: "Google Drive Link to Script & Shot List", questionType: "url", isRequired: true, internalLabel: "video_script_link" },
      { orderIndex: 10, questionText: "Google Drive Link for Working File", questionType: "url", isRequired: false, internalLabel: "video_working_link" },
      { orderIndex: 20, questionText: "Google Drive Link for Final Cut", questionType: "url", isRequired: false, internalLabel: "video_final_link" },
      { orderIndex: 30, questionText: "Should the CTA be included in the video?", questionType: "single_choice", isRequired: true, internalLabel: "video_include_cta", options: ["Yes", "No"] },
      { orderIndex: 40, questionText: "Do you have a storyboard?", questionType: "single_choice", isRequired: true, internalLabel: "TRIGGER - video_has_storyboard", options: ["Yes", "No"] },
      { orderIndex: 50, questionText: "Would you like a storyboard created?", questionType: "single_choice", isRequired: true, internalLabel: "video_want_storyboard", options: ["Yes", "No"] },
      { orderIndex: 60, questionText: "How many video variations do you need?", questionType: "number", isRequired: true, internalLabel: "video_variation_count" },
      { orderIndex: 70, questionText: "Where will this video be used?", questionType: "multi_choice", isRequired: true, internalLabel: "video_usage", options: ["Ads", "Landing Page", "Social Media/Organic", "Other"] },
      { orderIndex: 80, questionText: 'If "Other" usage, please explain', questionType: "text", isRequired: false, internalLabel: "video_usage_other" },
      { orderIndex: 90, questionText: "What aspect ratio is needed?", questionType: "single_choice", isRequired: true, internalLabel: "video_aspect_ratio", options: ["16:9 (Horizontal) - YouTube/Website", "9:16 (Vertical) - Reels/TikTok/Shorts", "1:1 (Square) - Instagram/Facebook Feed", "4:5 (Portrait) - Instagram/Facebook", "Custom"] },
      { orderIndex: 100, questionText: 'If "Custom" aspect ratio, please specify', questionType: "text", isRequired: false, internalLabel: "video_aspect_custom" },
      { orderIndex: 110, questionText: "What is the target duration?", questionType: "single_choice", isRequired: true, internalLabel: "video_duration", options: ["Under 30 seconds", "Under 1 minute", "Based on script (no limit)"] },
      { orderIndex: 120, questionText: "Do you want subtitles or captions?", questionType: "multi_choice", isRequired: true, internalLabel: "video_subtitles", options: ["Subtitles (small text at bottom)", "Open Captions (large animated text highlighting keywords)", "No Subtitles", "No Captions"] },
      { orderIndex: 130, questionText: "Do you want intro or outro?", questionType: "multi_choice", isRequired: false, internalLabel: "video_intro_outro", options: ["Intro (logo animation at beginning)", "Outro (logo animation at end)"] },
      { orderIndex: 140, questionText: "Is background music needed?", questionType: "single_choice", isRequired: true, internalLabel: "video_music", options: ["Yes", "No"] },
      { orderIndex: 150, questionText: "Are sound effects needed?", questionType: "single_choice", isRequired: true, internalLabel: "video_sfx", options: ["Yes", "No"] },
      { orderIndex: 160, questionText: "Did the client grant permission to use AI technology? (deepfake faces, voiceovers, b-roll)", questionType: "single_choice", isRequired: true, internalLabel: "video_ai_permission", options: ["Yes", "No"] },
      { orderIndex: 170, questionText: "Example video link (if applicable)", questionType: "url", isRequired: false, internalLabel: "video_example" },
      { orderIndex: 180, questionText: "Is the copy ready?", questionType: "single_choice", isRequired: true, internalLabel: "video_copy_ready", options: ["Yes", "No"] },
      { orderIndex: 190, questionText: "If yes, link to copy for video", questionType: "url", isRequired: false, internalLabel: "video_copy_link" },
      { orderIndex: 200, questionText: "Is this for a live event client?", questionType: "single_choice", isRequired: true, internalLabel: "TRIGGER - video_live_event", options: ["Yes", "No"] }
    ]
  },
  {
    sectionName: "Creative - Motion Graphic Details",
    questions: [
      { orderIndex: 0, questionText: "How many motion graphics do you need?", questionType: "number", isRequired: true, internalLabel: "motion_count" },
      { orderIndex: 10, questionText: "Where will this motion graphic be used?", questionType: "multi_choice", isRequired: true, internalLabel: "motion_usage", options: ["Ads", "Landing Page", "Social Media/Organic", "Email", "Other"] },
      { orderIndex: 20, questionText: 'If "Other" usage, please explain', questionType: "text", isRequired: false, internalLabel: "motion_usage_other" },
      { orderIndex: 30, questionText: "Is this for a live event client?", questionType: "single_choice", isRequired: true, internalLabel: "TRIGGER - motion_live_event", options: ["Yes", "No"] }
    ]
  },
  {
    sectionName: "Creative - Live Event Details",
    questions: [
      { orderIndex: 0, questionText: "Process Map Link (Lucidchart, etc.)", questionType: "url", isRequired: false, internalLabel: "live_event_process_map" },
      { orderIndex: 10, questionText: "What are the city/cities?", questionType: "text", isRequired: true, internalLabel: "live_event_cities" },
      { orderIndex: 20, questionText: "What are the event date(s)?", questionType: "text", isRequired: true, internalLabel: "live_event_dates" },
      { orderIndex: 30, questionText: "Who are the speakers?", questionType: "textarea", isRequired: true, internalLabel: "live_event_speakers" }
    ]
  },
  {
    sectionName: "DevOps Type",
    questions: [
      { orderIndex: 0, questionText: "What is this request for?", questionType: "single_choice", isRequired: true, internalLabel: "TRIGGER - devops_type", options: ["Landing Page", "Webinar", "Troubleshooting", "Phone Integration", "Market Launch", "A2P Registration"] },
      { orderIndex: 10, questionText: "Link to Content Documents (Email Copy / Landing Page Copy)", questionType: "url", isRequired: false, internalLabel: "devops_content_docs" },
      { orderIndex: 20, questionText: "Engager Link to Landing Page (Builder)", questionType: "url", isRequired: false, internalLabel: "devops_engager_lp" },
      { orderIndex: 30, questionText: "Engager Link to Automations Page", questionType: "url", isRequired: false, internalLabel: "devops_engager_automations" }
    ]
  },
  {
    sectionName: "DevOps - Landing Page Details",
    questions: [
      { orderIndex: 0, questionText: "What is the scope of the Landing Page?", questionType: "single_choice", isRequired: true, internalLabel: "TRIGGER - devops_lp_scope", options: ["Single Page", "Full Funnel (LP + Step 2 + Thank You etc.)", "Funnel with Product Sales"] },
      { orderIndex: 10, questionText: "If Funnel with Product Sales, link to Outline of Products and Pricing Document", questionType: "url", isRequired: false, internalLabel: "devops_lp_products_doc" },
      { orderIndex: 20, questionText: "Process Map Link (Lucidchart, etc.)", questionType: "url", isRequired: true, internalLabel: "devops_lp_process_map" },
      { orderIndex: 30, questionText: "The following assets are needed. What is the LP?", questionType: "text", isRequired: true, internalLabel: "devops_lp_main" },
      { orderIndex: 40, questionText: "What are all the steps? (Step 2, TY page, Upsell, etc.)", questionType: "textarea", isRequired: true, internalLabel: "devops_lp_steps" },
      { orderIndex: 50, questionText: "Favicon", questionType: "text", isRequired: false, internalLabel: "devops_lp_favicon" },
      { orderIndex: 60, questionText: "What are the emails? (all email assets done and approved)", questionType: "textarea", isRequired: true, internalLabel: "devops_lp_emails" },
      { orderIndex: 70, questionText: "What are the SMS?", questionType: "textarea", isRequired: false, internalLabel: "devops_lp_sms" },
      { orderIndex: 80, questionText: "What are the tracking pixels?", questionType: "textarea", isRequired: false, internalLabel: "devops_lp_pixels" },
      { orderIndex: 90, questionText: "Existing customer list for Provely", questionType: "text", isRequired: false, internalLabel: "devops_lp_provely" },
      { orderIndex: 100, questionText: "Who is the final QA?", questionType: "single_choice", isRequired: true, internalLabel: "devops_lp_qa", options: ["Internal", "External", "Both"] },
      { orderIndex: 110, questionText: "What is the form/survey design needed? (mobile & desktop)", questionType: "textarea", isRequired: false, internalLabel: "devops_lp_form_design" },
      { orderIndex: 120, questionText: "Is it going to be an A/B test?", questionType: "single_choice", isRequired: true, internalLabel: "TRIGGER - devops_lp_ab_test", options: ["Yes", "No"] }
    ]
  },
  {
    sectionName: "DevOps - Landing Page A/B Test Details",
    questions: [
      { orderIndex: 0, questionText: "What are the test details to be included in testing log?", questionType: "textarea", isRequired: true, internalLabel: "ab_test_details" },
      { orderIndex: 10, questionText: "What are the variations for A/B Testing?", questionType: "textarea", isRequired: true, internalLabel: "ab_test_variations" },
      { orderIndex: 20, questionText: "What is the traffic volume %?", questionType: "text", isRequired: true, internalLabel: "ab_test_traffic" },
      { orderIndex: 30, questionText: "What is the name of the test?", questionType: "text", isRequired: true, internalLabel: "ab_test_name" },
      { orderIndex: 40, questionText: "Which channels are included?", questionType: "multi_choice", isRequired: true, internalLabel: "ab_test_channels", options: ["Paid Ads", "Email", "Organic", "Other"] },
      { orderIndex: 50, questionText: "What are the necessary tags/custom fields?", questionType: "textarea", isRequired: false, internalLabel: "ab_test_tags" },
      { orderIndex: 60, questionText: "Do we need survey/forms?", questionType: "single_choice", isRequired: true, internalLabel: "ab_test_forms_needed", options: ["Yes", "No"] },
      { orderIndex: 70, questionText: "If yes, which survey/forms?", questionType: "textarea", isRequired: false, internalLabel: "ab_test_forms_details" },
      { orderIndex: 80, questionText: "What are the markets included?", questionType: "textarea", isRequired: true, internalLabel: "ab_test_markets" },
      { orderIndex: 90, questionText: "Is copy needed?", questionType: "single_choice", isRequired: true, internalLabel: "ab_test_copy_needed", options: ["Yes", "No"] },
      { orderIndex: 100, questionText: "If yes, which copy?", questionType: "textarea", isRequired: false, internalLabel: "ab_test_copy_details" }
    ]
  },
  {
    sectionName: "DevOps - Webinar Details",
    questions: [
      { orderIndex: 0, questionText: "What platform will the webinar be on?", questionType: "text", isRequired: true, internalLabel: "webinar_platform" },
      { orderIndex: 10, questionText: "Process Map Link (Lucidchart, etc.)", questionType: "url", isRequired: true, internalLabel: "webinar_process_map" },
      { orderIndex: 20, questionText: "What are the webinar dates?", questionType: "text", isRequired: true, internalLabel: "webinar_dates" },
      { orderIndex: 30, questionText: "What is the topic?", questionType: "text", isRequired: true, internalLabel: "webinar_topic" },
      { orderIndex: 40, questionText: "Is it going to be live or recorded?", questionType: "single_choice", isRequired: true, internalLabel: "webinar_type", options: ["Live", "Recorded"] },
      { orderIndex: 50, questionText: "Who are the hosts and panelists? (names/titles)", questionType: "textarea", isRequired: true, internalLabel: "webinar_hosts" },
      { orderIndex: 60, questionText: "Is this an internal or external webinar?", questionType: "single_choice", isRequired: true, internalLabel: "webinar_audience_type", options: ["Internal", "External"] },
      { orderIndex: 70, questionText: "Who is the audience?", questionType: "textarea", isRequired: true, internalLabel: "webinar_audience" },
      { orderIndex: 80, questionText: "What is the tag outline?", questionType: "textarea", isRequired: false, internalLabel: "webinar_tags" },
      { orderIndex: 90, questionText: "Email Sequence - Sender Name", questionType: "text", isRequired: true, internalLabel: "webinar_email_sender_name" },
      { orderIndex: 100, questionText: "Email Sequence - Sender Email", questionType: "text", isRequired: true, internalLabel: "webinar_email_sender_email" },
      { orderIndex: 110, questionText: "Email Sequence - Subject Line", questionType: "text", isRequired: false, internalLabel: "webinar_email_subject" },
      { orderIndex: 120, questionText: "Email Sequence - Preview Text", questionType: "text", isRequired: false, internalLabel: "webinar_email_preview" },
      { orderIndex: 130, questionText: "Email Sequence - Timing/Cadence", questionType: "text", isRequired: true, internalLabel: "webinar_email_timing" },
      { orderIndex: 140, questionText: "Email Sequence - Platform", questionType: "text", isRequired: true, internalLabel: "webinar_email_platform" },
      { orderIndex: 150, questionText: "Email Sequence - Invite Sequence Link", questionType: "url", isRequired: false, internalLabel: "webinar_email_invite_link" },
      { orderIndex: 160, questionText: "Email Sequence - Reminder Sequence Link", questionType: "url", isRequired: false, internalLabel: "webinar_email_reminder_link" },
      { orderIndex: 170, questionText: "Email Sequence - Post-Reg Sequence Link", questionType: "url", isRequired: false, internalLabel: "webinar_email_postreg_link" },
      { orderIndex: 180, questionText: "SMS - Sender Name", questionType: "text", isRequired: false, internalLabel: "webinar_sms_sender" },
      { orderIndex: 190, questionText: "SMS - Timing/Cadence", questionType: "text", isRequired: false, internalLabel: "webinar_sms_timing" },
      { orderIndex: 200, questionText: "SMS - Platform", questionType: "text", isRequired: false, internalLabel: "webinar_sms_platform" },
      { orderIndex: 210, questionText: "SMS - Invite Sequence Link", questionType: "url", isRequired: false, internalLabel: "webinar_sms_invite_link" },
      { orderIndex: 220, questionText: "SMS - Reminder Sequence Link", questionType: "url", isRequired: false, internalLabel: "webinar_sms_reminder_link" },
      { orderIndex: 230, questionText: "SMS - Post-Reg Sequence Link", questionType: "url", isRequired: false, internalLabel: "webinar_sms_postreg_link" },
      { orderIndex: 240, questionText: "What webinar automations are needed?", questionType: "multi_choice", isRequired: true, internalLabel: "webinar_automations", options: ["Invite automations", "Registration automations", "Reminder automations", "Attendees automation sequence", "PNA automation sequence"] }
    ]
  },
  {
    sectionName: "DevOps - Troubleshooting Details",
    questions: [
      { orderIndex: 0, questionText: "Link to what's broken", questionType: "url", isRequired: true, internalLabel: "troubleshoot_link" },
      { orderIndex: 10, questionText: "Loom showing what's broken", questionType: "url", isRequired: true, internalLabel: "troubleshoot_loom" }
    ]
  },
  {
    sectionName: "DevOps - Phone Integration Details",
    questions: [
      { orderIndex: 0, questionText: "Describe the phone integration or AI calls needed", questionType: "textarea", isRequired: true, internalLabel: "phone_integration_details" },
      { orderIndex: 10, questionText: "What system(s) need to be integrated?", questionType: "textarea", isRequired: true, internalLabel: "phone_integration_systems" },
      { orderIndex: 20, questionText: "Expected timeline (note: typically 3-4 days)", questionType: "text", isRequired: false, internalLabel: "phone_integration_timeline" }
    ]
  },
  {
    sectionName: "DevOps - Market Launch Details",
    questions: [
      { orderIndex: 0, questionText: "Describe the market launch requirements", questionType: "textarea", isRequired: true, internalLabel: "market_launch_details" },
      { orderIndex: 10, questionText: "What markets are being launched?", questionType: "textarea", isRequired: true, internalLabel: "market_launch_markets" },
      { orderIndex: 20, questionText: "Target launch date", questionType: "date", isRequired: true, internalLabel: "market_launch_date" }
    ]
  },
  {
    sectionName: "DevOps - A2P Registration Details",
    questions: [
      { orderIndex: 0, questionText: "Describe the A2P registration requirements", questionType: "textarea", isRequired: true, internalLabel: "a2p_details" },
      { orderIndex: 10, questionText: "What phone numbers/campaigns need registration?", questionType: "textarea", isRequired: true, internalLabel: "a2p_campaigns" }
    ]
  },
  {
    sectionName: "Data Task Type",
    questions: [
      { orderIndex: 0, questionText: "Link to Existing Report (if applicable)", questionType: "url", isRequired: false, internalLabel: "data_existing_report" },
      { orderIndex: 10, questionText: "Link to Example Report (if applicable)", questionType: "url", isRequired: false, internalLabel: "data_example_report" },
      { orderIndex: 20, questionText: "Main Request Type", questionType: "single_choice", isRequired: true, internalLabel: "TRIGGER - data_type", options: ["New Dashboard", "New Dashboard Page", "One-Off Report", "Update Existing Report", "Data Pull Request", "Test Reporting", "Other"] },
      { orderIndex: 30, questionText: 'If "Other" request type, please explain', questionType: "textarea", isRequired: false, internalLabel: "data_type_other" },
      { orderIndex: 40, questionText: "Secondary Items Needed", questionType: "multi_choice", isRequired: false, internalLabel: "data_secondary", options: ["Connect to New Data Sources", "Define new custom fields or tags", "Create new calculations", "Other"] },
      { orderIndex: 50, questionText: 'If "Other" secondary items, please explain', questionType: "textarea", isRequired: false, internalLabel: "data_secondary_other" },
      { orderIndex: 60, questionText: "Who will need to QA or approve this task?", questionType: "multi_choice", isRequired: true, internalLabel: "data_qa_approver", options: ["Account Manager", "Client", "Executive Team Member", "Other"] },
      { orderIndex: 70, questionText: 'If "Other" approver, please specify', questionType: "text", isRequired: false, internalLabel: "data_qa_other" }
    ]
  },
  {
    sectionName: "Data - Test Reporting Details",
    questions: [
      { orderIndex: 0, questionText: "Test Hypothesis (what is being tested, why, expected outcome)", questionType: "textarea", isRequired: true, internalLabel: "test_hypothesis" },
      { orderIndex: 10, questionText: "Will this test help support the main KPIs for the client?", questionType: "textarea", isRequired: true, internalLabel: "test_kpi_support" },
      { orderIndex: 20, questionText: "Audience / Segment (markets, lists, groups)", questionType: "textarea", isRequired: true, internalLabel: "test_audience" },
      { orderIndex: 30, questionText: "Tags / Tracking Setup (custom fields, UTM tags, identifiers)", questionType: "textarea", isRequired: true, internalLabel: "test_tracking" },
      { orderIndex: 40, questionText: "Duration & Timeframe (start date, expected run length)", questionType: "text", isRequired: true, internalLabel: "test_duration" },
      { orderIndex: 50, questionText: "Success Criteria (top 2-3 KPIs to judge test)", questionType: "textarea", isRequired: true, internalLabel: "test_success_criteria" },
      { orderIndex: 60, questionText: "Test Owner (who set up/owns the test)", questionType: "text", isRequired: true, internalLabel: "test_owner" }
    ]
  },
  {
    sectionName: "Data - New Dashboard Details",
    questions: [
      { orderIndex: 0, questionText: "Who is the primary user of this dashboard?", questionType: "single_choice", isRequired: true, internalLabel: "dashboard_primary_user", options: ["Client", "Internal", "Sales Team", "Other"] },
      { orderIndex: 10, questionText: 'If "Other" user, please specify', questionType: "text", isRequired: false, internalLabel: "dashboard_user_other" },
      { orderIndex: 20, questionText: "What are the top 3 KPIs or metrics this dashboard must show? (KPI 1)", questionType: "text", isRequired: true, internalLabel: "dashboard_kpi_1" },
      { orderIndex: 30, questionText: "KPI 2", questionType: "text", isRequired: true, internalLabel: "dashboard_kpi_2" },
      { orderIndex: 40, questionText: "KPI 3", questionType: "text", isRequired: true, internalLabel: "dashboard_kpi_3" },
      { orderIndex: 50, questionText: "What filters should be available?", questionType: "multi_choice", isRequired: true, internalLabel: "dashboard_filters", options: ["Date range", "Campaign name", "Market", "Other"] },
      { orderIndex: 60, questionText: 'If "Other" filters, please specify', questionType: "text", isRequired: false, internalLabel: "dashboard_filters_other" },
      { orderIndex: 70, questionText: "What visualizations are preferred?", questionType: "multi_choice", isRequired: true, internalLabel: "dashboard_visualizations", options: ["Table", "Line graph", "Bar chart", "Scoreboard numbers", "Other"] },
      { orderIndex: 80, questionText: 'If "Other" visualizations, please specify', questionType: "text", isRequired: false, internalLabel: "dashboard_viz_other" },
      { orderIndex: 90, questionText: "How often should the data update?", questionType: "single_choice", isRequired: true, internalLabel: "dashboard_update_frequency", options: ["Daily", "Weekly", "Monthly", "Other"] },
      { orderIndex: 100, questionText: 'If "Other" frequency, please specify', questionType: "text", isRequired: false, internalLabel: "dashboard_freq_other" }
    ]
  },
  {
    sectionName: "Data - New Dashboard Page Details",
    questions: [
      { orderIndex: 0, questionText: "Which existing dashboard should this page be added to? (paste link)", questionType: "url", isRequired: true, internalLabel: "dashboard_page_parent" },
      { orderIndex: 10, questionText: "What is the goal of this new page?", questionType: "single_choice", isRequired: true, internalLabel: "dashboard_page_goal", options: ["Track event performance", "Compare campaigns", "Other"] },
      { orderIndex: 20, questionText: 'If "Other" goal, please specify', questionType: "text", isRequired: false, internalLabel: "dashboard_page_goal_other" },
      { orderIndex: 30, questionText: "List the charts or metrics to be included on this page", questionType: "textarea", isRequired: true, internalLabel: "dashboard_page_charts" },
      { orderIndex: 40, questionText: "Are any new data sources needed for this page?", questionType: "textarea", isRequired: false, internalLabel: "dashboard_page_sources" },
      { orderIndex: 50, questionText: "Should any filters be added or reused from existing dashboard?", questionType: "single_choice", isRequired: true, internalLabel: "dashboard_page_filters", options: ["Yes", "No"] },
      { orderIndex: 60, questionText: "If yes, which filters?", questionType: "textarea", isRequired: false, internalLabel: "dashboard_page_filters_detail" }
    ]
  },
  {
    sectionName: "Data - One-Off Report Details",
    questions: [
      { orderIndex: 0, questionText: "What specific data points or columns do you need?", questionType: "textarea", isRequired: true, internalLabel: "report_data_points" },
      { orderIndex: 10, questionText: "Over what time range should the data be pulled?", questionType: "text", isRequired: true, internalLabel: "report_time_range" },
      { orderIndex: 20, questionText: "How should the data be grouped or segmented?", questionType: "single_choice", isRequired: true, internalLabel: "report_grouping", options: ["By campaign", "By client", "By week", "Other"] },
      { orderIndex: 30, questionText: 'If "Other" grouping, please specify', questionType: "text", isRequired: false, internalLabel: "report_grouping_other" },
      { orderIndex: 40, questionText: "Preferred format of the report", questionType: "single_choice", isRequired: true, internalLabel: "report_format", options: ["Google Sheets", "Excel", "PDF", "Other"] },
      { orderIndex: 50, questionText: 'If "Other" format, please specify', questionType: "text", isRequired: false, internalLabel: "report_format_other" },
      { orderIndex: 60, questionText: "Does this report need to be shared or presented to someone?", questionType: "single_choice", isRequired: true, internalLabel: "report_shared", options: ["Yes", "No"] },
      { orderIndex: 70, questionText: "If yes, who?", questionType: "text", isRequired: false, internalLabel: "report_shared_who" },
      { orderIndex: 80, questionText: "Do you need a visualization (chart or graph) in the report?", questionType: "single_choice", isRequired: true, internalLabel: "report_viz_needed", options: ["Yes", "No"] },
      { orderIndex: 90, questionText: "If yes, what type?", questionType: "text", isRequired: false, internalLabel: "report_viz_type" }
    ]
  },
  {
    sectionName: "Data - Extra Information",
    questions: [
      { orderIndex: 0, questionText: "Any naming conventions or specific titles required?", questionType: "textarea", isRequired: false, internalLabel: "data_naming_conventions" },
      { orderIndex: 10, questionText: "Are there existing formulas, metrics, or calculations that must be replicated?", questionType: "single_choice", isRequired: false, internalLabel: "data_existing_formulas", options: ["Yes", "No"] },
      { orderIndex: 20, questionText: "If yes, please link or paste example", questionType: "textarea", isRequired: false, internalLabel: "data_formulas_detail" },
      { orderIndex: 30, questionText: "Are any new fields, tags, or segmentations required for this request?", questionType: "textarea", isRequired: false, internalLabel: "data_new_fields" },
      { orderIndex: 40, questionText: "Should this report/dashboard be duplicated for other clients or verticals?", questionType: "single_choice", isRequired: false, internalLabel: "data_duplicate", options: ["Yes", "No"] },
      { orderIndex: 50, questionText: "Any compliance, legal, or privacy considerations to account for?", questionType: "textarea", isRequired: false, internalLabel: "data_compliance" }
    ]
  }
];
export {
  intakeQuestionsSeed
};

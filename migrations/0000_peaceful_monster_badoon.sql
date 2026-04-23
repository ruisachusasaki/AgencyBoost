CREATE TABLE "activities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"details" jsonb,
	"client_id" varchar NOT NULL,
	"user_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_assistant_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"custom_instructions" text,
	"is_enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_integrations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"name" text DEFAULT 'OpenAI' NOT NULL,
	"api_key" text NOT NULL,
	"model" text DEFAULT 'gpt-4o',
	"is_active" boolean DEFAULT true,
	"last_test_at" timestamp,
	"connection_errors" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "application_stage_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" varchar NOT NULL,
	"from_stage" text,
	"to_stage" text NOT NULL,
	"changed_by" uuid NOT NULL,
	"notes" text,
	"changed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "appointment_reminders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" varchar NOT NULL,
	"type" text NOT NULL,
	"send_at" timestamp NOT NULL,
	"message" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"client_id" varchar NOT NULL,
	"scheduled_by" varchar NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"status" text DEFAULT 'confirmed',
	"meeting_link" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" varchar NOT NULL,
	"entity_name" text NOT NULL,
	"user_id" uuid NOT NULL,
	"details" text NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" text,
	"user_agent" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_login" timestamp,
	"password_reset_token" text,
	"password_reset_expires" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "auth_users_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "auth_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "automation_actions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"config_schema" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "automation_triggers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"config_schema" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bundle_products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bundle_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "business_profile" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text NOT NULL,
	"business_type" text,
	"website" text,
	"phone" text,
	"email" text,
	"timezone" text DEFAULT 'America/New_York',
	"logo" text,
	"address" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"country" text DEFAULT 'United States',
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "calendar_appointments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"calendar_id" varchar NOT NULL,
	"client_id" varchar,
	"assigned_to" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"location" text,
	"location_details" text,
	"meeting_link" text,
	"timezone" text NOT NULL,
	"booker_name" text,
	"booker_email" text NOT NULL,
	"booker_phone" text,
	"custom_field_data" jsonb,
	"external_event_id" text,
	"google_event_id" text,
	"google_calendar_id" text,
	"synced_to_google" boolean DEFAULT false,
	"booking_source" text DEFAULT 'public' NOT NULL,
	"booking_ip" text,
	"booking_user_agent" text,
	"cancelled_at" timestamp,
	"cancelled_by" uuid,
	"cancellation_reason" text,
	"time_entry_created" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "calendar_availability" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"calendar_id" varchar NOT NULL,
	"staff_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "calendar_connections" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"calendar_id" text DEFAULT 'primary' NOT NULL,
	"calendar_name" text,
	"email" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"scope" text NOT NULL,
	"sync_enabled" boolean DEFAULT true,
	"two_way_sync" boolean DEFAULT true,
	"create_contacts" boolean DEFAULT false,
	"trigger_workflows" boolean DEFAULT false,
	"block_as_appointments" boolean DEFAULT false,
	"last_synced_at" timestamp,
	"sync_token" text,
	"page_token" text,
	"webhook_channel_id" text,
	"webhook_expiration" timestamp,
	"webhook_resource_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_user_calendar" UNIQUE("user_id","calendar_id")
);
--> statement-breakpoint
CREATE TABLE "calendar_date_overrides" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"calendar_id" varchar NOT NULL,
	"staff_id" uuid NOT NULL,
	"date" date NOT NULL,
	"type" text NOT NULL,
	"start_time" text,
	"end_time" text,
	"reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "calendar_event_cache" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"busy_slots" jsonb NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"etag" text,
	CONSTRAINT "unique_user_date_cache" UNIQUE("user_id","date")
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connection_id" varchar NOT NULL,
	"google_event_id" text NOT NULL,
	"appointment_id" varchar,
	"client_id" varchar,
	"summary" text,
	"description" text,
	"location" text,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"all_day" boolean DEFAULT false,
	"status" text,
	"transparency" text,
	"google_hangout_link" text,
	"google_html_link" text,
	"attendees" jsonb,
	"organizer" jsonb,
	"organizer_email" text,
	"etag" text,
	"last_modified" timestamp,
	"synced_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"is_recurring" boolean DEFAULT false,
	"created_in_agency_flow" boolean DEFAULT false,
	"appointment_status" text DEFAULT 'confirmed',
	"time_entry_created" boolean DEFAULT false,
	CONSTRAINT "unique_connection_google_event" UNIQUE("connection_id","google_event_id")
);
--> statement-breakpoint
CREATE TABLE "calendar_integrations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"external_calendar_id" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"is_active" boolean DEFAULT true,
	"last_sync_at" timestamp,
	"sync_errors" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "calendar_staff" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"calendar_id" varchar NOT NULL,
	"staff_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true,
	"round_robin_order" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "calendar_sync_state" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connection_id" varchar NOT NULL,
	"last_sync_started" timestamp,
	"last_sync_completed" timestamp,
	"last_sync_status" text,
	"last_sync_error" text,
	"events_created" integer DEFAULT 0,
	"events_updated" integer DEFAULT 0,
	"events_deleted" integer DEFAULT 0,
	"next_sync_token" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "calendars" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"custom_url" text NOT NULL,
	"duration" integer NOT NULL,
	"duration_unit" text DEFAULT 'minutes' NOT NULL,
	"location" text,
	"location_details" text,
	"buffer_time" integer DEFAULT 15,
	"schedule_window_start" integer DEFAULT 24,
	"schedule_window_end" integer DEFAULT 1440,
	"is_active" boolean DEFAULT true,
	"custom_field_ids" text[],
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "calendars_custom_url_unique" UNIQUE("custom_url")
);
--> statement-breakpoint
CREATE TABLE "call_center_time_entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"client_id" varchar NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"duration" integer,
	"is_running" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"client_id" varchar NOT NULL,
	"project_id" varchar,
	"status" text DEFAULT 'draft' NOT NULL,
	"type" text NOT NULL,
	"budget" numeric(10, 2),
	"spent" numeric(10, 2) DEFAULT '0',
	"impressions" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"start_date" timestamp,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "capacity_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department" text NOT NULL,
	"role" text,
	"max_clients_per_staff" integer DEFAULT 10 NOT NULL,
	"alert_threshold" numeric(5, 2) DEFAULT '80.00' NOT NULL,
	"notify_user_ids" text[],
	"notification_message" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_appointments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"location" text,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_brief_sections" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"title" text NOT NULL,
	"placeholder" text,
	"icon" text DEFAULT 'FileText' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"scope" text DEFAULT 'custom' NOT NULL,
	"type" text DEFAULT 'text' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "client_brief_sections_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "client_brief_values" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"section_id" varchar NOT NULL,
	"value" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_bundles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"bundle_id" varchar NOT NULL,
	"price" numeric(10, 2),
	"status" text DEFAULT 'active',
	"custom_quantities" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_contacts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text,
	"email" text,
	"phone" text,
	"title" text,
	"is_primary" boolean DEFAULT false,
	"notes" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_url" text NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_groups" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_health_scores" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"week_start_date" date NOT NULL,
	"week_end_date" date NOT NULL,
	"weekly_recap" text,
	"opportunities" text,
	"solutions" text,
	"goals" text NOT NULL,
	"fulfillment" text NOT NULL,
	"relationship" text NOT NULL,
	"client_actions" text NOT NULL,
	"total_score" integer NOT NULL,
	"average_score" numeric(3, 2) NOT NULL,
	"health_indicator" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_notes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"content" text NOT NULL,
	"created_by_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"edited_by" uuid,
	"edited_at" timestamp,
	"is_locked" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "client_packages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"package_id" varchar NOT NULL,
	"price" numeric(10, 2),
	"status" text DEFAULT 'active',
	"custom_quantities" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_portal_users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_login" timestamp,
	"password_reset_token" text,
	"password_reset_expires" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"price" numeric(10, 2),
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_roadmap_comments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"roadmap_entry_id" varchar,
	"content" text NOT NULL,
	"author_id" uuid NOT NULL,
	"mentions" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_roadmap_entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"content" text,
	"author_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "client_roadmap_entries_client_id_year_month_unique" UNIQUE("client_id","year","month")
);
--> statement-breakpoint
CREATE TABLE "client_tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_date" timestamp,
	"status" text DEFAULT 'pending' NOT NULL,
	"assigned_to" uuid,
	"created_by" uuid NOT NULL,
	"is_recurring" boolean DEFAULT false,
	"recurrence_pattern" jsonb,
	"create_even_if_overdue" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_team_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"staff_id" uuid NOT NULL,
	"position" varchar NOT NULL,
	"assigned_at" timestamp DEFAULT now(),
	"assigned_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "client_team_assignments_client_position_unique" UNIQUE("client_id","position")
);
--> statement-breakpoint
CREATE TABLE "client_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"description" text,
	"status" text NOT NULL,
	"transaction_date" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"company" text,
	"position" text,
	"status" text DEFAULT 'active' NOT NULL,
	"contact_type" text DEFAULT 'client',
	"contact_source" text,
	"address" text,
	"address2" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"website" text,
	"notes" text,
	"tags" text[],
	"contact_owner" uuid,
	"profile_image" text,
	"invoicing_contact" text,
	"invoicing_email" text,
	"payment_terms" text,
	"upside_bonus" numeric(5, 2),
	"brief_background" text,
	"brief_objectives" text,
	"brief_brand_info" text,
	"brief_audience_info" text,
	"brief_products_services" text,
	"brief_competitors" text,
	"brief_marketing_tech" text,
	"brief_miscellaneous" text,
	"growth_os_dashboard" text,
	"story_brand" text,
	"style_guide" text,
	"google_drive_folder" text,
	"testing_log" text,
	"cornerstone_blueprint" text,
	"custom_gpt" text,
	"dnd_all" boolean DEFAULT false,
	"dnd_email" boolean DEFAULT false,
	"dnd_sms" boolean DEFAULT false,
	"dnd_calls" boolean DEFAULT false,
	"group_id" varchar,
	"roadmap" text,
	"custom_field_values" jsonb,
	"followers" varchar[],
	"client_brief" text,
	"last_activity" timestamp,
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "clients_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "comment_files" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" varchar NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_url" text NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "custom_field_file_uploads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"custom_field_id" varchar NOT NULL,
	"file_name" text NOT NULL,
	"original_file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_path" text NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "custom_field_folders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"order" integer DEFAULT 0,
	"is_default" boolean DEFAULT false,
	"can_reorder" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "custom_fields" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"options" text[],
	"required" boolean DEFAULT false,
	"folder_id" varchar,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dashboard_widgets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"icon" text DEFAULT 'LayoutDashboard' NOT NULL,
	"default_width" integer DEFAULT 2 NOT NULL,
	"default_height" integer DEFAULT 2 NOT NULL,
	"min_width" integer DEFAULT 1 NOT NULL,
	"min_height" integer DEFAULT 1 NOT NULL,
	"max_width" integer DEFAULT 4 NOT NULL,
	"max_height" integer DEFAULT 4 NOT NULL,
	"default_settings" jsonb DEFAULT '{}',
	"refresh_interval" integer DEFAULT 300,
	"requires_auth" boolean DEFAULT true,
	"allowed_roles" text[],
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "dashboard_widgets_type_unique" UNIQUE("type")
);
--> statement-breakpoint
CREATE TABLE "dashboards" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"is_default" boolean DEFAULT false,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" varchar NOT NULL,
	"client_id" varchar,
	"name" text NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"mrr" numeric(10, 2),
	"is_recurring" boolean DEFAULT false,
	"contract_term" integer,
	"assigned_to" uuid NOT NULL,
	"won_date" timestamp DEFAULT now() NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"manager_id" varchar,
	"workflow_id" varchar,
	"parent_department_id" varchar,
	"order_index" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "departments_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer,
	"file_url" text NOT NULL,
	"client_id" varchar NOT NULL,
	"uploaded_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_integrations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"name" text DEFAULT 'Primary' NOT NULL,
	"api_key" text NOT NULL,
	"domain" text NOT NULL,
	"from_name" text NOT NULL,
	"from_email" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_test_at" timestamp,
	"connection_errors" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"content" text NOT NULL,
	"plain_text_content" text,
	"preview_text" text,
	"folder_id" varchar,
	"tags" text[],
	"is_public" boolean DEFAULT false,
	"usage_count" integer DEFAULT 0,
	"last_used" timestamp,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "enhanced_tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category_id" varchar,
	"template_id" varchar,
	"client_id" varchar,
	"campaign_id" varchar,
	"workflow_id" varchar,
	"parent_task_id" varchar,
	"assigned_to" uuid,
	"created_by" varchar NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'todo' NOT NULL,
	"progress" integer DEFAULT 0,
	"estimated_hours" numeric(5, 2),
	"actual_hours" numeric(5, 2),
	"due_date" timestamp,
	"start_date" timestamp,
	"completed_at" timestamp,
	"tags" text[],
	"checklist" jsonb,
	"attachments" jsonb,
	"dependencies" text[],
	"followers" text[],
	"custom_fields" jsonb,
	"time_entries" jsonb,
	"comments" jsonb,
	"reminder_settings" jsonb,
	"is_recurring" boolean DEFAULT false,
	"recurrence_pattern" jsonb,
	"recurring_group_id" text,
	"automation_data" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_time_entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"calendar_event_id" varchar NOT NULL,
	"user_id" uuid NOT NULL,
	"client_id" varchar,
	"title" text NOT NULL,
	"description" text,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"duration" integer NOT NULL,
	"source" text DEFAULT 'auto',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "expense_report_form_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fields" jsonb NOT NULL,
	"updated_by" uuid NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "expense_report_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"supervisor_id" uuid,
	"purpose" text,
	"expense_type" text,
	"expense_date" date,
	"expense_total" numeric(10, 2),
	"department_team" text,
	"client_id" varchar,
	"reimbursement" text,
	"payment_method" text,
	"notes" text,
	"receipt_files" text[],
	"status" text DEFAULT 'pending' NOT NULL,
	"submitted_by_id" uuid,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"submitted_at" timestamp DEFAULT now(),
	"custom_field_data" jsonb
);
--> statement-breakpoint
CREATE TABLE "form_fields" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" varchar NOT NULL,
	"type" text NOT NULL,
	"label" text,
	"placeholder" text,
	"required" boolean DEFAULT false,
	"options" text[],
	"validation" jsonb DEFAULT '{}'::jsonb,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"custom_field_id" varchar,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "form_folders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"order" integer DEFAULT 0,
	"is_default" boolean DEFAULT false,
	"can_reorder" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "form_submissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" varchar NOT NULL,
	"data" jsonb NOT NULL,
	"submitter_email" text,
	"submitter_name" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "forms" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"folder_id" varchar,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gohighlevel_integration" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_token" text NOT NULL,
	"name" text DEFAULT 'GoHighLevel' NOT NULL,
	"is_active" boolean DEFAULT true,
	"default_source" text DEFAULT 'GoHighLevel',
	"default_stage_id" varchar,
	"assign_to_staff_id" uuid,
	"trigger_workflows" boolean DEFAULT true,
	"field_mappings" jsonb,
	"leads_received" integer DEFAULT 0,
	"last_lead_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "gohighlevel_integration_webhook_token_unique" UNIQUE("webhook_token")
);
--> statement-breakpoint
CREATE TABLE "granular_permissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" varchar NOT NULL,
	"module" text NOT NULL,
	"permission_key" text NOT NULL,
	"enabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "granular_permissions_role_id_permission_key_unique" UNIQUE("role_id","permission_key")
);
--> statement-breakpoint
CREATE TABLE "image_annotations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_id" varchar NOT NULL,
	"x" numeric(5, 2) NOT NULL,
	"y" numeric(5, 2) NOT NULL,
	"content" text NOT NULL,
	"mentions" text[] DEFAULT '{}',
	"author_id" uuid NOT NULL,
	"is_completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" text NOT NULL,
	"client_id" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"tax" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"issue_date" timestamp DEFAULT now(),
	"due_date" timestamp,
	"paid_date" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "job_application_comments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" varchar NOT NULL,
	"content" text NOT NULL,
	"author_id" uuid NOT NULL,
	"author_name" text NOT NULL,
	"is_internal" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_application_form_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fields" jsonb NOT NULL,
	"updated_by" varchar NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_application_watchers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" varchar NOT NULL,
	"staff_id" uuid NOT NULL,
	"added_by" uuid NOT NULL,
	"added_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_applications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"position_id" varchar,
	"position_title" varchar NOT NULL,
	"applicant_name" text NOT NULL,
	"applicant_email" text NOT NULL,
	"applicant_phone" text,
	"resume_url" text,
	"cover_letter_url" text,
	"portfolio_url" text,
	"stage" text DEFAULT 'new' NOT NULL,
	"rating" integer DEFAULT 0,
	"notes" text,
	"assigned_recruiter" uuid,
	"applied_at" timestamp DEFAULT now(),
	"last_updated" timestamp DEFAULT now(),
	"scheduled_interview_date" timestamp,
	"salary_expectation" numeric(10, 2),
	"experience" text,
	"source" text,
	"custom_field_data" jsonb
);
--> statement-breakpoint
CREATE TABLE "job_openings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" varchar NOT NULL,
	"position_id" varchar NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"hiring_manager_id" uuid NOT NULL,
	"employment_type" text NOT NULL,
	"compensation" numeric(12, 2),
	"compensation_type" text DEFAULT 'annual',
	"job_description" text,
	"requirements" text,
	"benefits" text,
	"created_by_id" uuid NOT NULL,
	"approval_status" text DEFAULT 'pending' NOT NULL,
	"approved_by_id" uuid,
	"approved_at" timestamp,
	"rejection_reason" text,
	"is_public" boolean DEFAULT false,
	"external_posting_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "knowledge_base_article_versions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" varchar NOT NULL,
	"version" integer NOT NULL,
	"title" text NOT NULL,
	"content" jsonb NOT NULL,
	"change_description" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "knowledge_base_articles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" jsonb NOT NULL,
	"excerpt" text,
	"category_id" varchar,
	"parent_id" varchar,
	"slug" text NOT NULL,
	"order" integer DEFAULT 0,
	"status" text DEFAULT 'published' NOT NULL,
	"featured_image" text,
	"tags" text[],
	"view_count" integer DEFAULT 0,
	"like_count" integer DEFAULT 0,
	"is_public" boolean DEFAULT true,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"last_viewed_at" timestamp,
	CONSTRAINT "knowledge_base_articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "knowledge_base_bookmarks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" varchar NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "knowledge_base_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"parent_id" varchar,
	"order" integer DEFAULT 0,
	"icon" text,
	"color" text,
	"is_visible" boolean DEFAULT true,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "knowledge_base_comments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" varchar NOT NULL,
	"parent_id" varchar,
	"content" text NOT NULL,
	"mentions" text[],
	"author_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "knowledge_base_likes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" varchar NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "knowledge_base_permissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" varchar NOT NULL,
	"access_type" text NOT NULL,
	"access_id" text NOT NULL,
	"permission" text DEFAULT 'read' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "knowledge_base_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"updated_by" uuid NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "knowledge_base_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "knowledge_base_views" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" varchar NOT NULL,
	"user_id" uuid,
	"viewed_at" timestamp DEFAULT now(),
	"ip_address" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "lead_appointments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" varchar NOT NULL,
	"calendar_id" varchar NOT NULL,
	"assigned_to" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"location" text,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"activity_type" text DEFAULT 'appointment' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lead_note_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"content" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lead_notes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"lead_id" varchar NOT NULL,
	"author_id" uuid NOT NULL,
	"is_locked" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lead_pipeline_stages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#6b7280' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lead_sources" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "lead_sources_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "lead_stage_transitions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" varchar NOT NULL,
	"from_stage_id" varchar,
	"to_stage_id" varchar NOT NULL,
	"transitioned_at" timestamp DEFAULT now() NOT NULL,
	"transitioned_by" uuid
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"company" text,
	"source" text,
	"status" text DEFAULT 'Open' NOT NULL,
	"stage_id" varchar,
	"value" numeric(10, 2),
	"probability" integer DEFAULT 0,
	"notes" text,
	"assigned_to" uuid,
	"created_at" timestamp DEFAULT now(),
	"last_contact_date" timestamp,
	"custom_field_data" jsonb,
	"stage_history" jsonb DEFAULT '[]'::jsonb,
	"tags" text[] DEFAULT '{}'
);
--> statement-breakpoint
CREATE TABLE "new_hire_onboarding_form_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fields" jsonb NOT NULL,
	"updated_by" varchar NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "new_hire_onboarding_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"phone_number" text,
	"date_of_birth" date,
	"start_date" date,
	"emergency_contact_name" text,
	"emergency_contact_number" text,
	"emergency_contact_relationship" text,
	"tshirt_size" text,
	"payment_platform" text,
	"payment_email" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"notes" text,
	"submitted_at" timestamp DEFAULT now(),
	"custom_field_data" jsonb
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"client_id" varchar NOT NULL,
	"author_id" varchar NOT NULL,
	"is_locked" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notification_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"client_assigned_in_app" boolean DEFAULT true,
	"client_assigned_email" boolean DEFAULT true,
	"client_assigned_sms" boolean DEFAULT false,
	"chat_added_in_app" boolean DEFAULT true,
	"chat_added_email" boolean DEFAULT false,
	"chat_added_sms" boolean DEFAULT false,
	"chat_messages_in_app" boolean DEFAULT true,
	"mentioned_in_app" boolean DEFAULT true,
	"mentioned_email" boolean DEFAULT true,
	"mentioned_sms" boolean DEFAULT false,
	"mention_follow_up_in_app" boolean DEFAULT true,
	"mention_follow_up_email" boolean DEFAULT false,
	"mention_follow_up_sms" boolean DEFAULT false,
	"task_assigned_in_app" boolean DEFAULT true,
	"task_assigned_email" boolean DEFAULT true,
	"task_assigned_sms" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"priority" text DEFAULT 'normal',
	"is_read" boolean DEFAULT false,
	"read_at" timestamp,
	"action_url" text,
	"action_text" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "offboarding_form_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fields" jsonb NOT NULL,
	"updated_by" uuid NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "offboarding_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"department_team" text,
	"position" text,
	"employment_end_date" date,
	"account_suspension_date" date,
	"pay_off_ramp" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"submitted_by_id" uuid,
	"completed_by" uuid,
	"completed_at" timestamp,
	"submitted_at" timestamp DEFAULT now(),
	"custom_field_data" jsonb
);
--> statement-breakpoint
CREATE TABLE "one_on_one_action_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" varchar NOT NULL,
	"content" text NOT NULL,
	"assigned_to" uuid,
	"due_date" date,
	"is_completed" boolean DEFAULT false,
	"completed_at" timestamp,
	"task_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "one_on_one_comments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" varchar NOT NULL,
	"author_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "one_on_one_goals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" varchar,
	"direct_report_id" uuid NOT NULL,
	"content" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "one_on_one_meeting_kpi_statuses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" varchar NOT NULL,
	"position_kpi_id" varchar NOT NULL,
	"status" text DEFAULT 'on_track' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "one_on_one_meetings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"manager_id" uuid NOT NULL,
	"direct_report_id" uuid NOT NULL,
	"meeting_date" date NOT NULL,
	"meeting_time" text DEFAULT '09:00' NOT NULL,
	"meeting_duration" integer DEFAULT 30 NOT NULL,
	"week_of" date NOT NULL,
	"calendar_appointment_id" varchar,
	"calendar_event_id" varchar,
	"feeling" text,
	"performance_feedback" text,
	"performance_points" integer,
	"bonus_points" integer DEFAULT 0,
	"progression_status" text,
	"hobbies" text,
	"family" text,
	"private_notes" text,
	"recording_link" text,
	"is_recurring" boolean DEFAULT false,
	"recurring_frequency" text,
	"recurring_end_type" text,
	"recurring_end_date" date,
	"recurring_occurrences" integer,
	"recurring_parent_id" varchar,
	"meeting_started_at" timestamp,
	"meeting_ended_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "one_on_one_progression_statuses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"value" varchar(100) NOT NULL,
	"label" varchar(100) NOT NULL,
	"color" varchar(100) NOT NULL,
	"order_index" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "one_on_one_progression_statuses_value_unique" UNIQUE("value")
);
--> statement-breakpoint
CREATE TABLE "one_on_one_talking_points" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" varchar NOT NULL,
	"content" text NOT NULL,
	"added_by" uuid NOT NULL,
	"order_index" integer DEFAULT 0,
	"is_completed" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "one_on_one_wins" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" varchar NOT NULL,
	"content" text NOT NULL,
	"added_by" uuid NOT NULL,
	"order_index" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_chart_node_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" varchar NOT NULL,
	"staff_id" uuid NOT NULL,
	"assignment_type" varchar(50) DEFAULT 'primary',
	"effective_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "org_chart_node_assignments_node_id_assignment_type_unique" UNIQUE("node_id","assignment_type")
);
--> statement-breakpoint
CREATE TABLE "org_chart_nodes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"structure_id" varchar NOT NULL,
	"title" varchar(200) NOT NULL,
	"department" varchar(100),
	"position" varchar(100),
	"role_type" varchar(50) DEFAULT 'standard',
	"notes" text,
	"parent_id" varchar,
	"order_index" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_chart_structures" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT false,
	"created_by_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "package_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_id" varchar NOT NULL,
	"product_id" varchar,
	"bundle_id" varchar,
	"item_type" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "permission_audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audit_type" text NOT NULL,
	"role_id" varchar,
	"role_name" text,
	"target_user_id" uuid,
	"target_user_name" text,
	"module_affected" text,
	"permissions_before" jsonb,
	"permissions_after" jsonb,
	"changes_summary" text NOT NULL,
	"changes_count" integer DEFAULT 0,
	"performed_by" uuid,
	"performed_by_name" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"session_id" text,
	"risk_level" text DEFAULT 'low',
	"is_elevated_permission" boolean DEFAULT false,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permission_change_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audit_log_id" varchar NOT NULL,
	"module" text NOT NULL,
	"permission_type" text NOT NULL,
	"old_value" boolean,
	"new_value" boolean NOT NULL,
	"change_type" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" varchar NOT NULL,
	"module" text NOT NULL,
	"can_view" boolean DEFAULT false,
	"can_create" boolean DEFAULT false,
	"can_edit" boolean DEFAULT false,
	"can_delete" boolean DEFAULT false,
	"can_manage" boolean DEFAULT false,
	"can_export" boolean DEFAULT false,
	"can_import" boolean DEFAULT false,
	"data_access_level" text DEFAULT 'own' NOT NULL,
	"restricted_fields" text[],
	"read_only_fields" text[],
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "position_kpis" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"position_id" varchar NOT NULL,
	"kpi_name" varchar(200) NOT NULL,
	"benchmark" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "positions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"department_id" varchar,
	"description" text,
	"level" text,
	"parent_position_id" varchar,
	"order_index" integer DEFAULT 0,
	"in_org_chart" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_bundles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "product_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "product_packages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"build_fee" numeric(10, 2),
	"monthly_retail_price" numeric(10, 2),
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(10, 2),
	"cost" numeric(10, 2),
	"type" text NOT NULL,
	"category_id" varchar,
	"status" text DEFAULT 'active' NOT NULL,
	"usage_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "px_meeting_attendees" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "px_meetings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"meeting_date" date NOT NULL,
	"meeting_time" text NOT NULL,
	"meeting_duration" integer NOT NULL,
	"recording_link" text,
	"client_id" varchar,
	"tags" text[],
	"whats_working_kpis" text,
	"sales_opportunities" text,
	"areas_of_opportunities" text,
	"action_plan" text,
	"action_items" text,
	"notes" text,
	"is_private" boolean DEFAULT false,
	"facilitator_id" uuid,
	"note_taker_id" uuid,
	"enabled_elements" text[],
	"is_recurring" boolean DEFAULT false,
	"recurring_frequency" text,
	"recurring_end_type" text,
	"recurring_end_date" date,
	"recurring_occurrences" integer,
	"recurring_parent_id" varchar,
	"meeting_started_at" timestamp,
	"meeting_ended_at" timestamp,
	"created_by_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quote_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" varchar NOT NULL,
	"product_id" varchar,
	"bundle_id" varchar,
	"package_id" varchar,
	"item_type" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_cost" numeric(10, 2) NOT NULL,
	"total_cost" numeric(10, 2) NOT NULL,
	"custom_quantities" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar,
	"lead_id" varchar,
	"name" text NOT NULL,
	"client_budget" numeric(10, 2) NOT NULL,
	"desired_margin" numeric(5, 2) NOT NULL,
	"total_cost" numeric(10, 2) DEFAULT '0',
	"status" text DEFAULT 'draft' NOT NULL,
	"notes" text,
	"view_count" integer DEFAULT 0,
	"created_by" uuid NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "round_robin_tracking" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"calendar_id" varchar NOT NULL,
	"last_assigned_staff_id" uuid,
	"assignment_count" jsonb,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "salary_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_id" uuid NOT NULL,
	"previous_salary" numeric(12, 2),
	"new_salary" numeric(12, 2),
	"effective_date" timestamp DEFAULT now(),
	"notes" text,
	"changed_by" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sales_activities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" varchar NOT NULL,
	"type" text NOT NULL,
	"outcome" text,
	"notes" text,
	"assigned_to" uuid NOT NULL,
	"scheduled_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sales_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"minimum_margin_threshold" numeric(5, 2) DEFAULT '35.00' NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sales_targets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"target_amount" numeric(12, 2) NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "sales_targets_year_month_unique" UNIQUE("year","month")
);
--> statement-breakpoint
CREATE TABLE "scheduled_emails" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"from_user_id" varchar NOT NULL,
	"to_email" text NOT NULL,
	"cc_emails" text[],
	"bcc_emails" text[],
	"subject" text NOT NULL,
	"content" text NOT NULL,
	"plain_text_content" text,
	"template_id" varchar,
	"scheduled_for" timestamp NOT NULL,
	"timezone" text DEFAULT 'America/New_York' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp,
	"failure_reason" text,
	"retry_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slack_workspaces" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"team_id" text,
	"team_name" text,
	"bot_token" text NOT NULL,
	"bot_user_id" text,
	"signing_secret" text,
	"is_active" boolean DEFAULT true,
	"is_default" boolean DEFAULT false,
	"last_test_at" timestamp,
	"connection_errors" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "smart_lists" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"entity_type" text DEFAULT 'clients' NOT NULL,
	"filters" jsonb NOT NULL,
	"created_by" uuid NOT NULL,
	"visibility" text DEFAULT 'personal' NOT NULL,
	"shared_with" text[],
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sms_integrations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"name" text DEFAULT 'Primary' NOT NULL,
	"account_sid" text NOT NULL,
	"auth_token" text NOT NULL,
	"phone_number" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_test_at" timestamp,
	"connection_errors" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sms_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"content" text NOT NULL,
	"folder_id" varchar,
	"tags" text[],
	"is_public" boolean DEFAULT false,
	"usage_count" integer DEFAULT 0,
	"last_used" timestamp,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "social_media_accounts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"platform" text NOT NULL,
	"account_name" text NOT NULL,
	"username" text NOT NULL,
	"account_id" text,
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"is_active" boolean DEFAULT true,
	"last_sync" timestamp,
	"followers" integer DEFAULT 0,
	"following" integer DEFAULT 0,
	"posts" integer DEFAULT 0,
	"profile_image" text,
	"bio" text,
	"website" text,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "social_media_analytics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" varchar NOT NULL,
	"date" timestamp NOT NULL,
	"followers" integer DEFAULT 0,
	"following" integer DEFAULT 0,
	"posts" integer DEFAULT 0,
	"total_likes" integer DEFAULT 0,
	"total_comments" integer DEFAULT 0,
	"total_shares" integer DEFAULT 0,
	"total_impressions" integer DEFAULT 0,
	"total_reach" integer DEFAULT 0,
	"total_clicks" integer DEFAULT 0,
	"total_saves" integer DEFAULT 0,
	"engagement_rate" numeric(5, 2) DEFAULT '0',
	"impression_reach_ratio" numeric(5, 2) DEFAULT '0',
	"platform_data" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "social_media_posts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"campaign_id" varchar,
	"account_id" varchar NOT NULL,
	"content" text NOT NULL,
	"hashtags" text[],
	"mentions" text[],
	"media_urls" text[],
	"media_type" text,
	"link_url" text,
	"link_preview" jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"scheduled_at" timestamp,
	"published_at" timestamp,
	"platform_post_id" text,
	"platform_data" jsonb,
	"likes" integer DEFAULT 0,
	"comments" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"impressions" integer DEFAULT 0,
	"reach" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"saves" integer DEFAULT 0,
	"requires_approval" boolean DEFAULT false,
	"approved_by" varchar,
	"approved_at" timestamp,
	"rejected_by" varchar,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"author_id" varchar NOT NULL,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "social_media_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text,
	"platforms" text[],
	"content_template" text NOT NULL,
	"hashtag_suggestions" text[],
	"media_requirements" jsonb,
	"is_public" boolean DEFAULT false,
	"client_id" varchar,
	"author_id" varchar NOT NULL,
	"usage_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"replit_auth_sub" varchar(255),
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"role_id" varchar,
	"profile_image_path" text,
	"address" text,
	"city" varchar(100),
	"state" varchar(50),
	"zip" varchar(20),
	"country" varchar(100),
	"hire_date" date,
	"department" varchar(100),
	"position" varchar(100),
	"manager_id" uuid,
	"birthdate" date,
	"shirt_size" varchar(10),
	"assigned_calendar_id" varchar,
	"emergency_contact_name" varchar(200),
	"emergency_contact_phone" varchar(20),
	"emergency_contact_relationship" varchar(100),
	"time_off_policy_id" varchar,
	"vacation_days_annually" integer DEFAULT 15,
	"sick_days_annually" integer DEFAULT 10,
	"personal_days_annually" integer DEFAULT 3,
	"annual_salary" numeric(12, 2),
	"fathom_api_key" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "staff_replit_auth_sub_unique" UNIQUE("replit_auth_sub"),
	CONSTRAINT "staff_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "staff_linked_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"google_sub" varchar(255),
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "staff_linked_emails_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "survey_fields" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" varchar NOT NULL,
	"slide_id" varchar NOT NULL,
	"type" text NOT NULL,
	"label" text,
	"placeholder" text,
	"short_label" text,
	"query_key" text,
	"required" boolean DEFAULT false,
	"hidden" boolean DEFAULT false,
	"options" text[],
	"validation" jsonb DEFAULT '{}'::jsonb,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "survey_folders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "survey_logic_rules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" varchar NOT NULL,
	"source_field_id" varchar NOT NULL,
	"operator" text NOT NULL,
	"comparison_value" text,
	"action_type" text NOT NULL,
	"target_field_id" varchar,
	"target_slide_id" varchar,
	"order" integer DEFAULT 0,
	"enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "survey_slides" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" varchar NOT NULL,
	"title" text,
	"description" text,
	"order" integer DEFAULT 0 NOT NULL,
	"button_text" text DEFAULT 'Next',
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "survey_submission_answers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" varchar NOT NULL,
	"field_id" varchar NOT NULL,
	"value" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "survey_submissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" varchar NOT NULL,
	"submitter_email" text,
	"submitter_name" text,
	"ip_address" text,
	"user_agent" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"status" text DEFAULT 'completed',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "surveys" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"short_code" text,
	"folder_id" varchar,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"styling" jsonb DEFAULT '{}'::jsonb,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "surveys_short_code_unique" UNIQUE("short_code")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#46a1a0',
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "task_activities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" varchar NOT NULL,
	"action_type" varchar NOT NULL,
	"field_name" varchar,
	"old_value" text,
	"new_value" text,
	"user_id" varchar,
	"user_name" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task_attachments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" varchar NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_url" text NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text NOT NULL,
	"icon" text,
	"workflow_id" varchar,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task_comment_reactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" varchar NOT NULL,
	"user_id" uuid NOT NULL,
	"emoji" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task_comments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" varchar NOT NULL,
	"content" text NOT NULL,
	"author_id" uuid NOT NULL,
	"mentions" text[],
	"parent_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task_dependencies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" varchar NOT NULL,
	"depends_on_task_id" varchar NOT NULL,
	"dependency_type" text DEFAULT 'finish_to_start' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" varchar NOT NULL,
	"action" text NOT NULL,
	"field" text,
	"old_value" jsonb,
	"new_value" jsonb,
	"user_id" varchar NOT NULL,
	"timestamp" timestamp NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "task_intake_answers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" varchar NOT NULL,
	"question_id" varchar NOT NULL,
	"section_id" varchar,
	"answer_value" text,
	"was_visible" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task_intake_assignment_rules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" varchar NOT NULL,
	"name" text NOT NULL,
	"conditions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"assign_to_role" text,
	"assign_to_staff_id" uuid,
	"set_category_id" varchar,
	"set_tags" text[] DEFAULT '{}',
	"priority" integer DEFAULT 10,
	"enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task_intake_forms" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text DEFAULT 'Task Submission Form' NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task_intake_logic_rules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" varchar NOT NULL,
	"source_question_id" varchar NOT NULL,
	"conditions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"target_question_id" varchar,
	"is_end_form" boolean DEFAULT false,
	"order" integer DEFAULT 0,
	"enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task_intake_options" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" varchar NOT NULL,
	"option_text" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task_intake_questions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" varchar NOT NULL,
	"section_id" varchar,
	"question_text" text NOT NULL,
	"question_type" text NOT NULL,
	"help_text" text,
	"tooltip" text,
	"internal_label" text,
	"is_required" boolean DEFAULT true,
	"order" integer DEFAULT 0 NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task_intake_sections" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" varchar NOT NULL,
	"section_name" text NOT NULL,
	"internal_label" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"visibility_conditions" jsonb,
	"description_template" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task_intake_submissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" varchar,
	"form_id" varchar NOT NULL,
	"submitted_by" uuid NOT NULL,
	"submitted_at" timestamp DEFAULT now(),
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task_priorities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"value" text NOT NULL,
	"color" text DEFAULT '#6b7280' NOT NULL,
	"icon" text DEFAULT 'flag',
	"description" text,
	"sort_order" integer DEFAULT 0,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"is_system_priority" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "task_priorities_name_unique" UNIQUE("name"),
	CONSTRAINT "task_priorities_value_unique" UNIQUE("value")
);
--> statement-breakpoint
CREATE TABLE "task_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"setting_key" text NOT NULL,
	"setting_value" jsonb NOT NULL,
	"description" text,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "task_settings_setting_key_unique" UNIQUE("setting_key")
);
--> statement-breakpoint
CREATE TABLE "task_statuses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"value" text NOT NULL,
	"color" text DEFAULT '#6b7280' NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"is_system_status" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "task_statuses_name_unique" UNIQUE("name"),
	CONSTRAINT "task_statuses_value_unique" UNIQUE("value")
);
--> statement-breakpoint
CREATE TABLE "task_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category_id" varchar,
	"priority" text DEFAULT 'medium' NOT NULL,
	"estimated_duration" integer,
	"instructions" text,
	"checklist" jsonb,
	"required_fields" jsonb,
	"assignee_role" text,
	"tags" text[],
	"is_recurring" boolean DEFAULT false,
	"recurrence_pattern" jsonb,
	"template_data" jsonb,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'todo' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"category_id" varchar,
	"workflow_id" varchar,
	"assigned_to" uuid,
	"client_id" varchar,
	"project_id" varchar,
	"lead_id" varchar,
	"campaign_id" varchar,
	"due_date" timestamp,
	"start_date" timestamp,
	"due_time" text,
	"time_estimate" integer,
	"time_tracked" integer DEFAULT 0,
	"parent_task_id" varchar,
	"level" integer DEFAULT 0,
	"task_path" text,
	"has_sub_tasks" boolean DEFAULT false,
	"is_recurring" boolean DEFAULT false,
	"recurring_interval" integer,
	"recurring_unit" text,
	"recurring_end_type" text,
	"recurring_end_date" timestamp,
	"recurring_end_occurrences" integer,
	"create_if_overdue" boolean DEFAULT false,
	"visible_to_client" boolean DEFAULT false,
	"requires_client_approval" boolean DEFAULT false,
	"client_approval_status" text DEFAULT 'pending',
	"client_approval_notes" text,
	"client_approval_date" timestamp,
	"fathom_recording_url" text,
	"calendar_event_id" varchar,
	"one_on_one_meeting_id" varchar,
	"tags" text[] DEFAULT '{}',
	"status_history" jsonb DEFAULT '[]',
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team_positions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"in_org_chart" boolean DEFAULT false,
	"parent_position_id" varchar,
	"org_chart_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "team_positions_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "team_workflow_statuses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" varchar NOT NULL,
	"status_id" varchar NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"is_required" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team_workflows" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "template_folders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"parent_id" varchar,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ticket_attachments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" varchar NOT NULL,
	"comment_id" varchar,
	"file_name" text NOT NULL,
	"file_type" text,
	"file_size" integer,
	"file_url" text NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ticket_comments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" varchar NOT NULL,
	"author_id" uuid NOT NULL,
	"content" text NOT NULL,
	"is_internal" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ticket_routing_rules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"priority" integer DEFAULT 0,
	"conditions" text DEFAULT '{}' NOT NULL,
	"assign_to_user_id" uuid,
	"assign_to_team" text,
	"auto_set_priority" text,
	"auto_add_tags" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_number" serial NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" text DEFAULT 'bug' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"submitted_by" uuid NOT NULL,
	"assigned_to" uuid,
	"tags" text[],
	"loom_video_url" text,
	"screenshots" text[],
	"first_response_at" timestamp,
	"resolved_at" timestamp,
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "time_off_balances" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"vacation_days" integer DEFAULT 20,
	"sick_days" integer DEFAULT 10,
	"personal_days" integer DEFAULT 5,
	"vacation_used" integer DEFAULT 0,
	"sick_used" integer DEFAULT 0,
	"personal_used" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "time_off_policies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"vacation_days_default" integer DEFAULT 15,
	"sick_days_default" integer DEFAULT 10,
	"personal_days_default" integer DEFAULT 3,
	"carry_over_allowed" boolean DEFAULT false,
	"max_carry_over_days" integer DEFAULT 0,
	"policy_document" text,
	"effective_date" date NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "time_off_request_days" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"time_off_request_id" varchar NOT NULL,
	"date" date NOT NULL,
	"hours" numeric(5, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "time_off_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_id" uuid NOT NULL,
	"time_off_type_id" varchar,
	"type" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"total_days" integer NOT NULL,
	"total_hours" numeric(5, 2) DEFAULT '0' NOT NULL,
	"reason" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"rejection_reason" text,
	"manager_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "time_off_types" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_id" varchar NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"default_days_per_year" integer DEFAULT 0 NOT NULL,
	"allow_carry_over" boolean DEFAULT false,
	"max_carry_over_days" integer DEFAULT 0,
	"color" varchar(50) DEFAULT 'bg-blue-100 text-blue-800',
	"is_active" boolean DEFAULT true,
	"order_index" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tool_directory_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"color" text,
	"order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tool_directory_tools" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"url" text NOT NULL,
	"logo_url" text,
	"category_id" varchar,
	"tags" text[],
	"is_featured" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"order" integer DEFAULT 0,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "training_assignment_submissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" varchar NOT NULL,
	"user_id" uuid NOT NULL,
	"enrollment_id" varchar NOT NULL,
	"submission_text" text,
	"files" jsonb,
	"status" text DEFAULT 'submitted',
	"grade" integer,
	"feedback" text,
	"graded_by" uuid,
	"submitted_at" timestamp DEFAULT now(),
	"graded_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "training_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"instructions" text,
	"allowed_file_types" text[],
	"max_file_size" integer DEFAULT 10,
	"max_files" integer DEFAULT 1,
	"is_required" boolean DEFAULT true,
	"template_files" jsonb,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "training_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#3B82F6',
	"order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "training_course_permissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" varchar NOT NULL,
	"access_type" text NOT NULL,
	"access_id" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "training_courses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"short_description" text,
	"category_id" varchar,
	"tags" text[],
	"thumbnail_url" text,
	"estimated_duration" integer,
	"difficulty" text DEFAULT 'beginner',
	"is_published" boolean DEFAULT false,
	"order" integer DEFAULT 0,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "training_discussion_likes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"discussion_id" varchar NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "training_discussions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" varchar,
	"lesson_id" varchar,
	"user_id" uuid NOT NULL,
	"parent_id" varchar,
	"content" text NOT NULL,
	"is_instructor" boolean DEFAULT false,
	"is_pinned" boolean DEFAULT false,
	"likes_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "training_enrollments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" varchar NOT NULL,
	"user_id" uuid NOT NULL,
	"status" text DEFAULT 'enrolled',
	"progress" integer DEFAULT 0,
	"completed_lessons" integer DEFAULT 0,
	"total_lessons" integer DEFAULT 0,
	"enrolled_at" timestamp DEFAULT now(),
	"started_at" timestamp,
	"completed_at" timestamp,
	"last_accessed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "training_lesson_resources" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" varchar NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"url" text,
	"file_name" text,
	"file_size" integer,
	"order" integer DEFAULT 0,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "training_lessons" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" varchar NOT NULL,
	"module_id" varchar,
	"title" text NOT NULL,
	"description" text,
	"content" text,
	"content_type" text NOT NULL,
	"video_url" text,
	"video_embed_id" text,
	"video_duration" integer,
	"pdf_url" text,
	"order" integer DEFAULT 0,
	"is_required" boolean DEFAULT true,
	"is_locked" boolean DEFAULT false,
	"can_download" boolean DEFAULT false,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "training_modules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"order" integer DEFAULT 0,
	"is_required" boolean DEFAULT true,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "training_progress" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrollment_id" varchar NOT NULL,
	"lesson_id" varchar NOT NULL,
	"user_id" uuid NOT NULL,
	"status" text DEFAULT 'not_started',
	"watch_time" integer DEFAULT 0,
	"completion_percentage" integer DEFAULT 0,
	"first_started_at" timestamp,
	"last_accessed_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "training_quiz_attempts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quiz_id" varchar NOT NULL,
	"user_id" uuid NOT NULL,
	"enrollment_id" varchar NOT NULL,
	"score" integer DEFAULT 0,
	"total_points" integer DEFAULT 0,
	"earned_points" integer DEFAULT 0,
	"answers" jsonb,
	"is_passed" boolean DEFAULT false,
	"attempt_number" integer DEFAULT 1,
	"started_at" timestamp DEFAULT now(),
	"submitted_at" timestamp,
	"time_spent" integer
);
--> statement-breakpoint
CREATE TABLE "training_quiz_questions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quiz_id" varchar NOT NULL,
	"question" text NOT NULL,
	"question_type" text DEFAULT 'multiple_choice',
	"options" jsonb,
	"correct_answer" text NOT NULL,
	"explanation" text,
	"points" integer DEFAULT 1,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "training_quizzes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"passing_score" integer DEFAULT 70,
	"max_attempts" integer DEFAULT 3,
	"time_limit" integer,
	"shuffle_questions" boolean DEFAULT false,
	"show_correct_answers" boolean DEFAULT true,
	"is_required" boolean DEFAULT true,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_dashboard_widgets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"dashboard_id" varchar NOT NULL,
	"widget_type" text NOT NULL,
	"x" integer DEFAULT 0 NOT NULL,
	"y" integer DEFAULT 0 NOT NULL,
	"width" integer DEFAULT 2 NOT NULL,
	"height" integer DEFAULT 2 NOT NULL,
	"settings" jsonb DEFAULT '{}',
	"is_visible" boolean DEFAULT true,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" varchar NOT NULL,
	"assigned_by" uuid,
	"assigned_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_view_preferences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"view_type" text NOT NULL,
	"preferences" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_view_preferences_user_id_view_type_unique" UNIQUE("user_id","view_type")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"extension" text,
	"role" text DEFAULT 'User' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"profile_image" text,
	"signature" text,
	"signature_enabled" boolean DEFAULT false,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "workflow_action_analytics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" varchar NOT NULL,
	"action_type" text NOT NULL,
	"emails_sent" integer DEFAULT 0,
	"emails_delivered" integer DEFAULT 0,
	"emails_opened" integer DEFAULT 0,
	"emails_clicked" integer DEFAULT 0,
	"emails_replied" integer DEFAULT 0,
	"emails_bounced" integer DEFAULT 0,
	"emails_unsubscribed" integer DEFAULT 0,
	"emails_accepted" integer DEFAULT 0,
	"emails_rejected" integer DEFAULT 0,
	"emails_complained" integer DEFAULT 0,
	"sms_sent" integer DEFAULT 0,
	"sms_delivered" integer DEFAULT 0,
	"sms_clicked" integer DEFAULT 0,
	"sms_failed" integer DEFAULT 0,
	"sms_opted_out" integer DEFAULT 0,
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workflow_executions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" varchar NOT NULL,
	"contact_id" varchar,
	"trigger_data" jsonb,
	"status" text NOT NULL,
	"current_step" integer DEFAULT 0,
	"total_steps" integer NOT NULL,
	"execution_log" jsonb,
	"error_message" text,
	"started_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"next_run_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "workflow_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"industry" text,
	"use_case" text,
	"triggers" jsonb DEFAULT '[]' NOT NULL,
	"actions" jsonb NOT NULL,
	"conditions" jsonb,
	"settings" jsonb,
	"is_public" boolean DEFAULT false,
	"usage_count" integer DEFAULT 0,
	"rating" numeric(3, 2),
	"tags" text[],
	"workflow_id" varchar NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "workflow_templates_workflow_id_unique" UNIQUE("workflow_id")
);
--> statement-breakpoint
CREATE TABLE "workflows" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"folder_id" varchar,
	"client_id" varchar,
	"category" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"triggers" jsonb DEFAULT '[]' NOT NULL,
	"actions" jsonb DEFAULT '[]' NOT NULL,
	"conditions" jsonb,
	"settings" jsonb,
	"is_template" boolean DEFAULT false,
	"template_category" text,
	"version" integer DEFAULT 1,
	"last_run" timestamp,
	"total_runs" integer DEFAULT 0,
	"successful_runs" integer DEFAULT 0,
	"failed_runs" integer DEFAULT 0,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_staff_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_stage_history" ADD CONSTRAINT "application_stage_history_application_id_job_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."job_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_stage_history" ADD CONSTRAINT "application_stage_history_changed_by_staff_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_reminders" ADD CONSTRAINT "appointment_reminders_appointment_id_calendar_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."calendar_appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_scheduled_by_users_id_fk" FOREIGN KEY ("scheduled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_staff_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_users" ADD CONSTRAINT "auth_users_user_id_staff_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_products" ADD CONSTRAINT "bundle_products_bundle_id_product_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."product_bundles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_products" ADD CONSTRAINT "bundle_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_appointments" ADD CONSTRAINT "calendar_appointments_calendar_id_calendars_id_fk" FOREIGN KEY ("calendar_id") REFERENCES "public"."calendars"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_appointments" ADD CONSTRAINT "calendar_appointments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_appointments" ADD CONSTRAINT "calendar_appointments_assigned_to_staff_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_appointments" ADD CONSTRAINT "calendar_appointments_cancelled_by_staff_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_availability" ADD CONSTRAINT "calendar_availability_calendar_id_calendars_id_fk" FOREIGN KEY ("calendar_id") REFERENCES "public"."calendars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_availability" ADD CONSTRAINT "calendar_availability_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_connections" ADD CONSTRAINT "calendar_connections_user_id_staff_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_date_overrides" ADD CONSTRAINT "calendar_date_overrides_calendar_id_calendars_id_fk" FOREIGN KEY ("calendar_id") REFERENCES "public"."calendars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_date_overrides" ADD CONSTRAINT "calendar_date_overrides_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event_cache" ADD CONSTRAINT "calendar_event_cache_user_id_staff_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_connection_id_calendar_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."calendar_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_appointment_id_calendar_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."calendar_appointments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_integrations" ADD CONSTRAINT "calendar_integrations_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_staff" ADD CONSTRAINT "calendar_staff_calendar_id_calendars_id_fk" FOREIGN KEY ("calendar_id") REFERENCES "public"."calendars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_staff" ADD CONSTRAINT "calendar_staff_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_sync_state" ADD CONSTRAINT "calendar_sync_state_connection_id_calendar_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."calendar_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendars" ADD CONSTRAINT "calendars_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_center_time_entries" ADD CONSTRAINT "call_center_time_entries_user_id_staff_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_center_time_entries" ADD CONSTRAINT "call_center_time_entries_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capacity_settings" ADD CONSTRAINT "capacity_settings_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capacity_settings" ADD CONSTRAINT "capacity_settings_updated_by_staff_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_appointments" ADD CONSTRAINT "client_appointments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_appointments" ADD CONSTRAINT "client_appointments_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_brief_values" ADD CONSTRAINT "client_brief_values_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_brief_values" ADD CONSTRAINT "client_brief_values_section_id_client_brief_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."client_brief_sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_bundles" ADD CONSTRAINT "client_bundles_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_bundles" ADD CONSTRAINT "client_bundles_bundle_id_product_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."product_bundles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_uploaded_by_staff_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_health_scores" ADD CONSTRAINT "client_health_scores_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_notes" ADD CONSTRAINT "client_notes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_notes" ADD CONSTRAINT "client_notes_created_by_id_staff_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_notes" ADD CONSTRAINT "client_notes_edited_by_staff_id_fk" FOREIGN KEY ("edited_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_packages" ADD CONSTRAINT "client_packages_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_packages" ADD CONSTRAINT "client_packages_package_id_product_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."product_packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_portal_users" ADD CONSTRAINT "client_portal_users_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_products" ADD CONSTRAINT "client_products_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_products" ADD CONSTRAINT "client_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_roadmap_comments" ADD CONSTRAINT "client_roadmap_comments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_roadmap_comments" ADD CONSTRAINT "client_roadmap_comments_roadmap_entry_id_client_roadmap_entries_id_fk" FOREIGN KEY ("roadmap_entry_id") REFERENCES "public"."client_roadmap_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_roadmap_comments" ADD CONSTRAINT "client_roadmap_comments_author_id_staff_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_roadmap_entries" ADD CONSTRAINT "client_roadmap_entries_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_roadmap_entries" ADD CONSTRAINT "client_roadmap_entries_author_id_staff_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_tasks" ADD CONSTRAINT "client_tasks_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_tasks" ADD CONSTRAINT "client_tasks_assigned_to_staff_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_tasks" ADD CONSTRAINT "client_tasks_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_team_assignments" ADD CONSTRAINT "client_team_assignments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_team_assignments" ADD CONSTRAINT "client_team_assignments_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_team_assignments" ADD CONSTRAINT "client_team_assignments_position_team_positions_id_fk" FOREIGN KEY ("position") REFERENCES "public"."team_positions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_team_assignments" ADD CONSTRAINT "client_team_assignments_assigned_by_staff_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_transactions" ADD CONSTRAINT "client_transactions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_contact_owner_staff_id_fk" FOREIGN KEY ("contact_owner") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_group_id_client_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."client_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_files" ADD CONSTRAINT "comment_files_comment_id_task_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."task_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_files" ADD CONSTRAINT "comment_files_uploaded_by_staff_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_field_file_uploads" ADD CONSTRAINT "custom_field_file_uploads_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_field_file_uploads" ADD CONSTRAINT "custom_field_file_uploads_custom_field_id_custom_fields_id_fk" FOREIGN KEY ("custom_field_id") REFERENCES "public"."custom_fields"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_field_file_uploads" ADD CONSTRAINT "custom_field_file_uploads_uploaded_by_staff_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_fields" ADD CONSTRAINT "custom_fields_folder_id_custom_field_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."custom_field_folders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboards" ADD CONSTRAINT "dashboards_user_id_staff_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_assigned_to_staff_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_workflow_id_team_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."team_workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_folder_id_template_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."template_folders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enhanced_tasks" ADD CONSTRAINT "enhanced_tasks_category_id_task_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."task_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enhanced_tasks" ADD CONSTRAINT "enhanced_tasks_template_id_task_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."task_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enhanced_tasks" ADD CONSTRAINT "enhanced_tasks_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enhanced_tasks" ADD CONSTRAINT "enhanced_tasks_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enhanced_tasks" ADD CONSTRAINT "enhanced_tasks_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enhanced_tasks" ADD CONSTRAINT "enhanced_tasks_assigned_to_staff_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enhanced_tasks" ADD CONSTRAINT "enhanced_tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_time_entries" ADD CONSTRAINT "event_time_entries_calendar_event_id_calendar_events_id_fk" FOREIGN KEY ("calendar_event_id") REFERENCES "public"."calendar_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_time_entries" ADD CONSTRAINT "event_time_entries_user_id_staff_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_time_entries" ADD CONSTRAINT "event_time_entries_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_report_form_config" ADD CONSTRAINT "expense_report_form_config_updated_by_staff_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_report_submissions" ADD CONSTRAINT "expense_report_submissions_supervisor_id_staff_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_report_submissions" ADD CONSTRAINT "expense_report_submissions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_report_submissions" ADD CONSTRAINT "expense_report_submissions_submitted_by_id_staff_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_report_submissions" ADD CONSTRAINT "expense_report_submissions_reviewed_by_staff_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_custom_field_id_custom_fields_id_fk" FOREIGN KEY ("custom_field_id") REFERENCES "public"."custom_fields"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_folder_id_form_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."form_folders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_updated_by_staff_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gohighlevel_integration" ADD CONSTRAINT "gohighlevel_integration_assign_to_staff_id_staff_id_fk" FOREIGN KEY ("assign_to_staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "granular_permissions" ADD CONSTRAINT "granular_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_annotations" ADD CONSTRAINT "image_annotations_author_id_staff_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_application_comments" ADD CONSTRAINT "job_application_comments_application_id_job_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."job_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_application_comments" ADD CONSTRAINT "job_application_comments_author_id_staff_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_application_form_config" ADD CONSTRAINT "job_application_form_config_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_application_watchers" ADD CONSTRAINT "job_application_watchers_application_id_job_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."job_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_application_watchers" ADD CONSTRAINT "job_application_watchers_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_application_watchers" ADD CONSTRAINT "job_application_watchers_added_by_staff_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_assigned_recruiter_staff_id_fk" FOREIGN KEY ("assigned_recruiter") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_openings" ADD CONSTRAINT "job_openings_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_openings" ADD CONSTRAINT "job_openings_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_openings" ADD CONSTRAINT "job_openings_hiring_manager_id_staff_id_fk" FOREIGN KEY ("hiring_manager_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_openings" ADD CONSTRAINT "job_openings_created_by_id_staff_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_openings" ADD CONSTRAINT "job_openings_approved_by_id_staff_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base_article_versions" ADD CONSTRAINT "knowledge_base_article_versions_article_id_knowledge_base_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."knowledge_base_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base_article_versions" ADD CONSTRAINT "knowledge_base_article_versions_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base_articles" ADD CONSTRAINT "knowledge_base_articles_category_id_knowledge_base_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."knowledge_base_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base_articles" ADD CONSTRAINT "knowledge_base_articles_parent_id_knowledge_base_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."knowledge_base_articles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base_articles" ADD CONSTRAINT "knowledge_base_articles_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base_bookmarks" ADD CONSTRAINT "knowledge_base_bookmarks_article_id_knowledge_base_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."knowledge_base_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base_bookmarks" ADD CONSTRAINT "knowledge_base_bookmarks_user_id_staff_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base_categories" ADD CONSTRAINT "knowledge_base_categories_parent_id_knowledge_base_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."knowledge_base_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base_categories" ADD CONSTRAINT "knowledge_base_categories_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base_comments" ADD CONSTRAINT "knowledge_base_comments_article_id_knowledge_base_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."knowledge_base_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base_comments" ADD CONSTRAINT "knowledge_base_comments_parent_id_knowledge_base_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."knowledge_base_comments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base_comments" ADD CONSTRAINT "knowledge_base_comments_author_id_staff_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base_likes" ADD CONSTRAINT "knowledge_base_likes_article_id_knowledge_base_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."knowledge_base_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base_likes" ADD CONSTRAINT "knowledge_base_likes_user_id_staff_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base_settings" ADD CONSTRAINT "knowledge_base_settings_updated_by_staff_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base_views" ADD CONSTRAINT "knowledge_base_views_article_id_knowledge_base_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."knowledge_base_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base_views" ADD CONSTRAINT "knowledge_base_views_user_id_staff_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_appointments" ADD CONSTRAINT "lead_appointments_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_appointments" ADD CONSTRAINT "lead_appointments_calendar_id_calendars_id_fk" FOREIGN KEY ("calendar_id") REFERENCES "public"."calendars"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_appointments" ADD CONSTRAINT "lead_appointments_assigned_to_staff_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_appointments" ADD CONSTRAINT "lead_appointments_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_author_id_staff_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_stage_transitions" ADD CONSTRAINT "lead_stage_transitions_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_stage_transitions" ADD CONSTRAINT "lead_stage_transitions_from_stage_id_lead_pipeline_stages_id_fk" FOREIGN KEY ("from_stage_id") REFERENCES "public"."lead_pipeline_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_stage_transitions" ADD CONSTRAINT "lead_stage_transitions_to_stage_id_lead_pipeline_stages_id_fk" FOREIGN KEY ("to_stage_id") REFERENCES "public"."lead_pipeline_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_stage_transitions" ADD CONSTRAINT "lead_stage_transitions_transitioned_by_staff_id_fk" FOREIGN KEY ("transitioned_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_stage_id_lead_pipeline_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."lead_pipeline_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_staff_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "new_hire_onboarding_form_config" ADD CONSTRAINT "new_hire_onboarding_form_config_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "new_hire_onboarding_submissions" ADD CONSTRAINT "new_hire_onboarding_submissions_reviewed_by_staff_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_staff_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offboarding_form_config" ADD CONSTRAINT "offboarding_form_config_updated_by_staff_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offboarding_submissions" ADD CONSTRAINT "offboarding_submissions_submitted_by_id_staff_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offboarding_submissions" ADD CONSTRAINT "offboarding_submissions_completed_by_staff_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "one_on_one_action_items" ADD CONSTRAINT "one_on_one_action_items_meeting_id_one_on_one_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."one_on_one_meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "one_on_one_action_items" ADD CONSTRAINT "one_on_one_action_items_assigned_to_staff_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "one_on_one_action_items" ADD CONSTRAINT "one_on_one_action_items_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "one_on_one_comments" ADD CONSTRAINT "one_on_one_comments_meeting_id_one_on_one_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."one_on_one_meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "one_on_one_comments" ADD CONSTRAINT "one_on_one_comments_author_id_staff_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "one_on_one_goals" ADD CONSTRAINT "one_on_one_goals_meeting_id_one_on_one_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."one_on_one_meetings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "one_on_one_goals" ADD CONSTRAINT "one_on_one_goals_direct_report_id_staff_id_fk" FOREIGN KEY ("direct_report_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "one_on_one_meeting_kpi_statuses" ADD CONSTRAINT "one_on_one_meeting_kpi_statuses_meeting_id_one_on_one_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."one_on_one_meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "one_on_one_meeting_kpi_statuses" ADD CONSTRAINT "one_on_one_meeting_kpi_statuses_position_kpi_id_position_kpis_id_fk" FOREIGN KEY ("position_kpi_id") REFERENCES "public"."position_kpis"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "one_on_one_meetings" ADD CONSTRAINT "one_on_one_meetings_manager_id_staff_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "one_on_one_meetings" ADD CONSTRAINT "one_on_one_meetings_direct_report_id_staff_id_fk" FOREIGN KEY ("direct_report_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "one_on_one_meetings" ADD CONSTRAINT "one_on_one_meetings_calendar_appointment_id_calendar_appointments_id_fk" FOREIGN KEY ("calendar_appointment_id") REFERENCES "public"."calendar_appointments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "one_on_one_talking_points" ADD CONSTRAINT "one_on_one_talking_points_meeting_id_one_on_one_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."one_on_one_meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "one_on_one_talking_points" ADD CONSTRAINT "one_on_one_talking_points_added_by_staff_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "one_on_one_wins" ADD CONSTRAINT "one_on_one_wins_meeting_id_one_on_one_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."one_on_one_meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "one_on_one_wins" ADD CONSTRAINT "one_on_one_wins_added_by_staff_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_chart_node_assignments" ADD CONSTRAINT "org_chart_node_assignments_node_id_org_chart_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."org_chart_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_chart_node_assignments" ADD CONSTRAINT "org_chart_node_assignments_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_chart_nodes" ADD CONSTRAINT "org_chart_nodes_structure_id_org_chart_structures_id_fk" FOREIGN KEY ("structure_id") REFERENCES "public"."org_chart_structures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_chart_structures" ADD CONSTRAINT "org_chart_structures_created_by_id_staff_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_items" ADD CONSTRAINT "package_items_package_id_product_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."product_packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_items" ADD CONSTRAINT "package_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_items" ADD CONSTRAINT "package_items_bundle_id_product_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."product_bundles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_audit_logs" ADD CONSTRAINT "permission_audit_logs_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_audit_logs" ADD CONSTRAINT "permission_audit_logs_target_user_id_staff_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_audit_logs" ADD CONSTRAINT "permission_audit_logs_performed_by_staff_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_change_history" ADD CONSTRAINT "permission_change_history_audit_log_id_permission_audit_logs_id_fk" FOREIGN KEY ("audit_log_id") REFERENCES "public"."permission_audit_logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_kpis" ADD CONSTRAINT "position_kpis_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "px_meeting_attendees" ADD CONSTRAINT "px_meeting_attendees_meeting_id_px_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."px_meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "px_meeting_attendees" ADD CONSTRAINT "px_meeting_attendees_user_id_staff_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "px_meetings" ADD CONSTRAINT "px_meetings_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "px_meetings" ADD CONSTRAINT "px_meetings_facilitator_id_staff_id_fk" FOREIGN KEY ("facilitator_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "px_meetings" ADD CONSTRAINT "px_meetings_note_taker_id_staff_id_fk" FOREIGN KEY ("note_taker_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "px_meetings" ADD CONSTRAINT "px_meetings_created_by_id_staff_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_bundle_id_product_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."product_bundles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_package_id_product_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."product_packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_approved_by_staff_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round_robin_tracking" ADD CONSTRAINT "round_robin_tracking_calendar_id_calendars_id_fk" FOREIGN KEY ("calendar_id") REFERENCES "public"."calendars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round_robin_tracking" ADD CONSTRAINT "round_robin_tracking_last_assigned_staff_id_staff_id_fk" FOREIGN KEY ("last_assigned_staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_history" ADD CONSTRAINT "salary_history_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_history" ADD CONSTRAINT "salary_history_changed_by_staff_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_activities" ADD CONSTRAINT "sales_activities_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_activities" ADD CONSTRAINT "sales_activities_assigned_to_staff_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_settings" ADD CONSTRAINT "sales_settings_updated_by_staff_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_targets" ADD CONSTRAINT "sales_targets_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_targets" ADD CONSTRAINT "sales_targets_updated_by_staff_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_emails" ADD CONSTRAINT "scheduled_emails_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_emails" ADD CONSTRAINT "scheduled_emails_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_emails" ADD CONSTRAINT "scheduled_emails_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "smart_lists" ADD CONSTRAINT "smart_lists_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_templates" ADD CONSTRAINT "sms_templates_folder_id_template_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."template_folders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_templates" ADD CONSTRAINT "sms_templates_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_accounts" ADD CONSTRAINT "social_media_accounts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_analytics" ADD CONSTRAINT "social_media_analytics_account_id_social_media_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."social_media_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_posts" ADD CONSTRAINT "social_media_posts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_posts" ADD CONSTRAINT "social_media_posts_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_posts" ADD CONSTRAINT "social_media_posts_account_id_social_media_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."social_media_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_posts" ADD CONSTRAINT "social_media_posts_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_posts" ADD CONSTRAINT "social_media_posts_rejected_by_users_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_posts" ADD CONSTRAINT "social_media_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_templates" ADD CONSTRAINT "social_media_templates_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_templates" ADD CONSTRAINT "social_media_templates_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_time_off_policy_id_time_off_policies_id_fk" FOREIGN KEY ("time_off_policy_id") REFERENCES "public"."time_off_policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_linked_emails" ADD CONSTRAINT "staff_linked_emails_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_fields" ADD CONSTRAINT "survey_fields_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_fields" ADD CONSTRAINT "survey_fields_slide_id_survey_slides_id_fk" FOREIGN KEY ("slide_id") REFERENCES "public"."survey_slides"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_logic_rules" ADD CONSTRAINT "survey_logic_rules_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_logic_rules" ADD CONSTRAINT "survey_logic_rules_source_field_id_survey_fields_id_fk" FOREIGN KEY ("source_field_id") REFERENCES "public"."survey_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_logic_rules" ADD CONSTRAINT "survey_logic_rules_target_field_id_survey_fields_id_fk" FOREIGN KEY ("target_field_id") REFERENCES "public"."survey_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_logic_rules" ADD CONSTRAINT "survey_logic_rules_target_slide_id_survey_slides_id_fk" FOREIGN KEY ("target_slide_id") REFERENCES "public"."survey_slides"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_slides" ADD CONSTRAINT "survey_slides_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_submission_answers" ADD CONSTRAINT "survey_submission_answers_submission_id_survey_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."survey_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_submission_answers" ADD CONSTRAINT "survey_submission_answers_field_id_survey_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."survey_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_submissions" ADD CONSTRAINT "survey_submissions_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_folder_id_survey_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."survey_folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_updated_by_staff_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_activities" ADD CONSTRAINT "task_activities_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_uploaded_by_staff_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_categories" ADD CONSTRAINT "task_categories_workflow_id_team_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."team_workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_comment_reactions" ADD CONSTRAINT "task_comment_reactions_comment_id_task_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."task_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_comment_reactions" ADD CONSTRAINT "task_comment_reactions_user_id_staff_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_author_id_staff_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_depends_on_task_id_tasks_id_fk" FOREIGN KEY ("depends_on_task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_history" ADD CONSTRAINT "task_history_task_id_enhanced_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."enhanced_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_history" ADD CONSTRAINT "task_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_intake_answers" ADD CONSTRAINT "task_intake_answers_submission_id_task_intake_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."task_intake_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_intake_answers" ADD CONSTRAINT "task_intake_answers_question_id_task_intake_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."task_intake_questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_intake_answers" ADD CONSTRAINT "task_intake_answers_section_id_task_intake_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."task_intake_sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_intake_assignment_rules" ADD CONSTRAINT "task_intake_assignment_rules_form_id_task_intake_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."task_intake_forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_intake_assignment_rules" ADD CONSTRAINT "task_intake_assignment_rules_assign_to_staff_id_staff_id_fk" FOREIGN KEY ("assign_to_staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_intake_assignment_rules" ADD CONSTRAINT "task_intake_assignment_rules_set_category_id_task_categories_id_fk" FOREIGN KEY ("set_category_id") REFERENCES "public"."task_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_intake_forms" ADD CONSTRAINT "task_intake_forms_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_intake_forms" ADD CONSTRAINT "task_intake_forms_updated_by_staff_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_intake_logic_rules" ADD CONSTRAINT "task_intake_logic_rules_form_id_task_intake_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."task_intake_forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_intake_logic_rules" ADD CONSTRAINT "task_intake_logic_rules_source_question_id_task_intake_questions_id_fk" FOREIGN KEY ("source_question_id") REFERENCES "public"."task_intake_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_intake_logic_rules" ADD CONSTRAINT "task_intake_logic_rules_target_question_id_task_intake_questions_id_fk" FOREIGN KEY ("target_question_id") REFERENCES "public"."task_intake_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_intake_options" ADD CONSTRAINT "task_intake_options_question_id_task_intake_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."task_intake_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_intake_questions" ADD CONSTRAINT "task_intake_questions_form_id_task_intake_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."task_intake_forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_intake_questions" ADD CONSTRAINT "task_intake_questions_section_id_task_intake_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."task_intake_sections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_intake_sections" ADD CONSTRAINT "task_intake_sections_form_id_task_intake_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."task_intake_forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_intake_submissions" ADD CONSTRAINT "task_intake_submissions_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_intake_submissions" ADD CONSTRAINT "task_intake_submissions_form_id_task_intake_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."task_intake_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_intake_submissions" ADD CONSTRAINT "task_intake_submissions_submitted_by_staff_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_settings" ADD CONSTRAINT "task_settings_updated_by_staff_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_category_id_task_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."task_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_category_id_task_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."task_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_workflow_id_team_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."team_workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_staff_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_workflow_statuses" ADD CONSTRAINT "team_workflow_statuses_workflow_id_team_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."team_workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_workflow_statuses" ADD CONSTRAINT "team_workflow_statuses_status_id_task_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."task_statuses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_comment_id_ticket_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."ticket_comments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_uploaded_by_staff_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_author_id_staff_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_routing_rules" ADD CONSTRAINT "ticket_routing_rules_assign_to_user_id_staff_id_fk" FOREIGN KEY ("assign_to_user_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_submitted_by_staff_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assigned_to_staff_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off_balances" ADD CONSTRAINT "time_off_balances_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off_request_days" ADD CONSTRAINT "time_off_request_days_time_off_request_id_time_off_requests_id_fk" FOREIGN KEY ("time_off_request_id") REFERENCES "public"."time_off_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_time_off_type_id_time_off_types_id_fk" FOREIGN KEY ("time_off_type_id") REFERENCES "public"."time_off_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_approved_by_staff_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off_types" ADD CONSTRAINT "time_off_types_policy_id_time_off_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."time_off_policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_directory_categories" ADD CONSTRAINT "tool_directory_categories_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_directory_tools" ADD CONSTRAINT "tool_directory_tools_category_id_tool_directory_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."tool_directory_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_directory_tools" ADD CONSTRAINT "tool_directory_tools_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_assignment_submissions" ADD CONSTRAINT "training_assignment_submissions_assignment_id_training_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."training_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_assignment_submissions" ADD CONSTRAINT "training_assignment_submissions_user_id_staff_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_assignment_submissions" ADD CONSTRAINT "training_assignment_submissions_enrollment_id_training_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."training_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_assignment_submissions" ADD CONSTRAINT "training_assignment_submissions_graded_by_staff_id_fk" FOREIGN KEY ("graded_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_assignments" ADD CONSTRAINT "training_assignments_lesson_id_training_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."training_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_assignments" ADD CONSTRAINT "training_assignments_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_course_permissions" ADD CONSTRAINT "training_course_permissions_course_id_training_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."training_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_courses" ADD CONSTRAINT "training_courses_category_id_training_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."training_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_courses" ADD CONSTRAINT "training_courses_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_courses" ADD CONSTRAINT "training_courses_updated_by_staff_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_discussion_likes" ADD CONSTRAINT "training_discussion_likes_discussion_id_training_discussions_id_fk" FOREIGN KEY ("discussion_id") REFERENCES "public"."training_discussions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_discussion_likes" ADD CONSTRAINT "training_discussion_likes_user_id_staff_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_discussions" ADD CONSTRAINT "training_discussions_course_id_training_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."training_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_discussions" ADD CONSTRAINT "training_discussions_lesson_id_training_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."training_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_discussions" ADD CONSTRAINT "training_discussions_user_id_staff_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_discussions" ADD CONSTRAINT "training_discussions_parent_id_training_discussions_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."training_discussions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_enrollments" ADD CONSTRAINT "training_enrollments_course_id_training_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."training_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_enrollments" ADD CONSTRAINT "training_enrollments_user_id_staff_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_lesson_resources" ADD CONSTRAINT "training_lesson_resources_lesson_id_training_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."training_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_lesson_resources" ADD CONSTRAINT "training_lesson_resources_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_lessons" ADD CONSTRAINT "training_lessons_course_id_training_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."training_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_lessons" ADD CONSTRAINT "training_lessons_module_id_training_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."training_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_lessons" ADD CONSTRAINT "training_lessons_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_lessons" ADD CONSTRAINT "training_lessons_updated_by_staff_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_modules" ADD CONSTRAINT "training_modules_course_id_training_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."training_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_modules" ADD CONSTRAINT "training_modules_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_modules" ADD CONSTRAINT "training_modules_updated_by_staff_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_progress" ADD CONSTRAINT "training_progress_enrollment_id_training_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."training_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_progress" ADD CONSTRAINT "training_progress_lesson_id_training_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."training_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_progress" ADD CONSTRAINT "training_progress_user_id_staff_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_quiz_attempts" ADD CONSTRAINT "training_quiz_attempts_quiz_id_training_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."training_quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_quiz_attempts" ADD CONSTRAINT "training_quiz_attempts_user_id_staff_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_quiz_attempts" ADD CONSTRAINT "training_quiz_attempts_enrollment_id_training_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."training_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_quiz_questions" ADD CONSTRAINT "training_quiz_questions_quiz_id_training_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."training_quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_quizzes" ADD CONSTRAINT "training_quizzes_lesson_id_training_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."training_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_quizzes" ADD CONSTRAINT "training_quizzes_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_dashboard_widgets" ADD CONSTRAINT "user_dashboard_widgets_user_id_staff_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_dashboard_widgets" ADD CONSTRAINT "user_dashboard_widgets_dashboard_id_dashboards_id_fk" FOREIGN KEY ("dashboard_id") REFERENCES "public"."dashboards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_staff_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_staff_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_view_preferences" ADD CONSTRAINT "user_view_preferences_user_id_staff_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_action_analytics" ADD CONSTRAINT "workflow_action_analytics_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_contact_id_clients_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_templates" ADD CONSTRAINT "workflow_templates_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_templates" ADD CONSTRAINT "workflow_templates_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_folder_id_template_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."template_folders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_calendar_connections_user_id" ON "calendar_connections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_event_cache_user_date" ON "calendar_event_cache" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "idx_calendar_events_connection_id" ON "calendar_events" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "idx_calendar_events_google_event_id" ON "calendar_events" USING btree ("google_event_id");--> statement-breakpoint
CREATE INDEX "idx_calendar_events_appointment_id" ON "calendar_events" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX "idx_calendar_events_client_id" ON "calendar_events" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_calendar_events_time_range" ON "calendar_events" USING btree ("start_time","end_time");--> statement-breakpoint
CREATE INDEX "idx_calendar_events_user_time" ON "calendar_events" USING btree ("connection_id","start_time","end_time");--> statement-breakpoint
CREATE INDEX "idx_calendar_sync_state_connection_id" ON "calendar_sync_state" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "idx_call_center_time_entries_user" ON "call_center_time_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_call_center_time_entries_client" ON "call_center_time_entries" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_call_center_time_entries_date" ON "call_center_time_entries" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "idx_call_center_time_entries_running" ON "call_center_time_entries" USING btree ("user_id","is_running");--> statement-breakpoint
CREATE INDEX "idx_deals_rep" ON "deals" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "idx_deals_won_date" ON "deals" USING btree ("won_date");--> statement-breakpoint
CREATE INDEX "idx_deals_lead" ON "deals" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "idx_deals_rep_won_date" ON "deals" USING btree ("assigned_to","won_date");--> statement-breakpoint
CREATE INDEX "idx_event_time_entries_calendar_event" ON "event_time_entries" USING btree ("calendar_event_id");--> statement-breakpoint
CREATE INDEX "idx_event_time_entries_user" ON "event_time_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_event_time_entries_client" ON "event_time_entries" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_event_time_entries_date" ON "event_time_entries" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "idx_stage_transitions_lead" ON "lead_stage_transitions" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "idx_stage_transitions_date" ON "lead_stage_transitions" USING btree ("transitioned_at");--> statement-breakpoint
CREATE INDEX "idx_stage_transitions_stages" ON "lead_stage_transitions" USING btree ("from_stage_id","to_stage_id");--> statement-breakpoint
CREATE INDEX "idx_lead_stage_transitions_to_stage_date" ON "lead_stage_transitions" USING btree ("to_stage_id","transitioned_at");--> statement-breakpoint
CREATE INDEX "idx_lead_stage_transitions_from_stage_date" ON "lead_stage_transitions" USING btree ("from_stage_id","transitioned_at");--> statement-breakpoint
CREATE INDEX "idx_px_meeting_attendees_meeting" ON "px_meeting_attendees" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "idx_px_meeting_attendees_user" ON "px_meeting_attendees" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_salary_history_staff" ON "salary_history" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "idx_sales_activities_lead" ON "sales_activities" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "idx_sales_activities_rep" ON "sales_activities" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "idx_sales_activities_type" ON "sales_activities" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_sales_activities_rep_date" ON "sales_activities" USING btree ("assigned_to","created_at");--> statement-breakpoint
CREATE INDEX "idx_sales_activities_lead_date" ON "sales_activities" USING btree ("lead_id","created_at");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "idx_survey_fields_survey" ON "survey_fields" USING btree ("survey_id");--> statement-breakpoint
CREATE INDEX "idx_survey_fields_slide" ON "survey_fields" USING btree ("slide_id");--> statement-breakpoint
CREATE INDEX "idx_survey_logic_rules_survey" ON "survey_logic_rules" USING btree ("survey_id");--> statement-breakpoint
CREATE INDEX "idx_survey_logic_rules_source_field" ON "survey_logic_rules" USING btree ("source_field_id");--> statement-breakpoint
CREATE INDEX "idx_survey_slides_survey" ON "survey_slides" USING btree ("survey_id");--> statement-breakpoint
CREATE INDEX "idx_survey_submission_answers_submission" ON "survey_submission_answers" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "idx_survey_submission_answers_field" ON "survey_submission_answers" USING btree ("field_id");--> statement-breakpoint
CREATE INDEX "idx_survey_submissions_survey" ON "survey_submissions" USING btree ("survey_id");--> statement-breakpoint
CREATE INDEX "idx_survey_submissions_status" ON "survey_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_surveys_folder" ON "surveys" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "idx_surveys_status" ON "surveys" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_surveys_short_code" ON "surveys" USING btree ("short_code");--> statement-breakpoint
CREATE INDEX "idx_task_intake_answers_submission" ON "task_intake_answers" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "idx_task_intake_answers_question" ON "task_intake_answers" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "idx_task_intake_assignment_form" ON "task_intake_assignment_rules" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "idx_task_intake_assignment_priority" ON "task_intake_assignment_rules" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_task_intake_logic_form" ON "task_intake_logic_rules" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "idx_task_intake_logic_source" ON "task_intake_logic_rules" USING btree ("source_question_id");--> statement-breakpoint
CREATE INDEX "idx_task_intake_options_question" ON "task_intake_options" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "idx_task_intake_questions_form" ON "task_intake_questions" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "idx_task_intake_questions_order" ON "task_intake_questions" USING btree ("order");--> statement-breakpoint
CREATE INDEX "idx_task_intake_questions_section" ON "task_intake_questions" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "idx_task_intake_sections_form" ON "task_intake_sections" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "idx_task_intake_sections_order" ON "task_intake_sections" USING btree ("order_index");--> statement-breakpoint
CREATE INDEX "idx_task_intake_submissions_task" ON "task_intake_submissions" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_task_intake_submissions_form" ON "task_intake_submissions" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "idx_task_intake_submissions_user" ON "task_intake_submissions" USING btree ("submitted_by");--> statement-breakpoint
CREATE INDEX "idx_ticket_attachments_ticket" ON "ticket_attachments" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "idx_ticket_comments_ticket" ON "ticket_comments" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "idx_tickets_status" ON "tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tickets_type" ON "tickets" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_tickets_priority" ON "tickets" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_tickets_submitted_by" ON "tickets" USING btree ("submitted_by");--> statement-breakpoint
CREATE INDEX "idx_tickets_assigned_to" ON "tickets" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "idx_tool_directory_tools_category" ON "tool_directory_tools" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_workflow_action_analytics_workflow_id" ON "workflow_action_analytics" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "idx_workflow_action_analytics_workflow_action" ON "workflow_action_analytics" USING btree ("workflow_id","action_type");
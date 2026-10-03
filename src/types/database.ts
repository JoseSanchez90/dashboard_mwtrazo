import type { UserRole } from "@/types/auth";
import type { ProjectStatus } from "@/types/project";
import type { TaskPriority, TaskStatus } from "@/types/task";
import type { EventType } from "@/types/event";
import type { ProjectFileCategory } from "@/types/project-file";
import type { PaymentStatus } from "@/types/finance";
import type { ActivityAction, ActivityEntityType } from "@/types/activity";
import type { NotificationEntityType, NotificationType } from "@/types/notification";
import type { Currency, DateFormat, Timezone, WeekStartsOn } from "@/types/preferences";
import type { WorkspaceSettings } from "@/types/workspace-settings";

export type Database = {
  public: {
    Tables: {
      notification_preferences: {
        Row: { user_id: string; task_assigned: boolean; task_completed: boolean; task_due_soon: boolean; task_overdue: boolean; event_upcoming: boolean; delivery_upcoming: boolean; file_uploaded: boolean; project_updated: boolean; payment_due_soon: boolean; payment_overdue: boolean; created_at: string; updated_at: string };
        Insert: { user_id: string; task_assigned?: boolean; task_completed?: boolean; task_due_soon?: boolean; task_overdue?: boolean; event_upcoming?: boolean; delivery_upcoming?: boolean; file_uploaded?: boolean; project_updated?: boolean; payment_due_soon?: boolean; payment_overdue?: boolean; created_at?: string; updated_at?: string };
        Update: { task_assigned?: boolean; task_completed?: boolean; task_due_soon?: boolean; task_overdue?: boolean; event_upcoming?: boolean; delivery_upcoming?: boolean; file_uploaded?: boolean; project_updated?: boolean; payment_due_soon?: boolean; payment_overdue?: boolean };
        Relationships: [{ foreignKeyName: "notification_preferences_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "profiles"; referencedColumns: ["id"] }];
      };
      workspace_settings: {
        Row: WorkspaceSettings;
        Insert: { id?: number; studio_name?: string; logo_path?: string | null; email?: string | null; phone?: string | null; address?: string | null; city?: string; country?: string; updated_by?: string | null; created_at?: string; updated_at?: string };
        Update: { studio_name?: string; logo_path?: string | null; email?: string | null; phone?: string | null; address?: string | null; city?: string; country?: string; updated_by?: string | null };
        Relationships: [{ foreignKeyName: "workspace_settings_updated_by_fkey"; columns: ["updated_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }];
      };
      user_preferences: {
        Row: { user_id: string; timezone: Timezone; date_format: DateFormat; week_starts_on: WeekStartsOn; currency: Currency; created_at: string; updated_at: string };
        Insert: { user_id: string; timezone?: Timezone; date_format?: DateFormat; week_starts_on?: WeekStartsOn; currency?: Currency; created_at?: string; updated_at?: string };
        Update: { timezone?: Timezone; date_format?: DateFormat; week_starts_on?: WeekStartsOn; currency?: Currency };
        Relationships: [{ foreignKeyName: "user_preferences_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "profiles"; referencedColumns: ["id"] }];
      };
      notifications: {
        Row: { id: string; user_id: string; type: NotificationType; title: string; message: string; entity_type: NotificationEntityType | null; entity_id: string | null; read_at: string | null; created_at: string; dedupe_key: string };
        Insert: { id?: string; user_id: string; type: NotificationType; title: string; message: string; entity_type?: NotificationEntityType | null; entity_id?: string | null; read_at?: string | null; created_at?: string; dedupe_key: string };
        Update: { read_at?: string | null };
        Relationships: [{ foreignKeyName: "notifications_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }];
      };
      activity_logs: {
        Row: { id: string; user_id: string | null; entity_type: ActivityEntityType; entity_id: string; action: ActivityAction; metadata: Record<string, unknown>; created_at: string };
        Insert: { id?: string; user_id: string; entity_type: ActivityEntityType; entity_id: string; action: ActivityAction; metadata?: Record<string, unknown>; created_at?: string };
        Update: Record<string, never>;
        Relationships: [{ foreignKeyName: "activity_logs_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }];
      };
      project_payments: {
        Row: { id: string; project_id: string; concept: string; amount: number; due_date: string | null; paid_at: string | null; status: PaymentStatus; notes: string | null; created_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; project_id: string; concept: string; amount: number; due_date?: string | null; paid_at?: string | null; status?: PaymentStatus; notes?: string | null; created_by: string; created_at?: string; updated_at?: string };
        Update: { project_id?: string; concept?: string; amount?: number; due_date?: string | null; paid_at?: string | null; status?: PaymentStatus; notes?: string | null };
        Relationships: [{ foreignKeyName: "project_payments_project_id_fkey"; columns: ["project_id"]; isOneToOne: false; referencedRelation: "projects"; referencedColumns: ["id"] }, { foreignKeyName: "project_payments_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }];
      };
      project_expenses: {
        Row: { id: string; project_id: string; concept: string; amount: number; expense_date: string; notes: string | null; created_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; project_id: string; concept: string; amount: number; expense_date: string; notes?: string | null; created_by: string; created_at?: string; updated_at?: string };
        Update: { project_id?: string; concept?: string; amount?: number; expense_date?: string; notes?: string | null };
        Relationships: [{ foreignKeyName: "project_expenses_project_id_fkey"; columns: ["project_id"]; isOneToOne: false; referencedRelation: "projects"; referencedColumns: ["id"] }, { foreignKeyName: "project_expenses_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }];
      };
      project_files: {
        Row: { id: string; project_id: string; uploaded_by: string | null; file_name: string; file_path: string; file_type: string; file_size: number; stored_size: number; compression: "none" | "gzip"; category: ProjectFileCategory; created_at: string };
        Insert: { id?: string; project_id: string; uploaded_by: string; file_name: string; file_path: string; file_type: string; file_size: number; stored_size: number; compression?: "none" | "gzip"; category?: ProjectFileCategory; created_at?: string };
        Update: Record<string, never>;
        Relationships: [
          { foreignKeyName: "project_files_project_id_fkey"; columns: ["project_id"]; isOneToOne: false; referencedRelation: "projects"; referencedColumns: ["id"] },
          { foreignKeyName: "project_files_uploaded_by_fkey"; columns: ["uploaded_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      events: {
        Row: { id: string; project_id: string | null; client_id: string | null; title: string; description: string | null; type: EventType; start_at: string; end_at: string; all_day: boolean; location: string | null; created_by: string | null; assigned_to: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; project_id?: string | null; client_id?: string | null; title: string; description?: string | null; type?: EventType; start_at: string; end_at: string; all_day?: boolean; location?: string | null; created_by: string; assigned_to?: string | null; created_at?: string; updated_at?: string };
        Update: { project_id?: string | null; client_id?: string | null; title?: string; description?: string | null; type?: EventType; start_at?: string; end_at?: string; all_day?: boolean; location?: string | null; assigned_to?: string | null };
        Relationships: [
          { foreignKeyName: "events_project_id_fkey"; columns: ["project_id"]; isOneToOne: false; referencedRelation: "projects"; referencedColumns: ["id"] },
          { foreignKeyName: "events_client_id_fkey"; columns: ["client_id"]; isOneToOne: false; referencedRelation: "clients"; referencedColumns: ["id"] },
          { foreignKeyName: "events_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "events_assigned_to_fkey"; columns: ["assigned_to"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      tasks: {
        Row: { id: string; project_id: string | null; title: string; description: string | null; assigned_to: string | null; created_by: string | null; status: TaskStatus; priority: TaskPriority; start_date: string | null; due_date: string | null; completed_by: string | null; completed_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; project_id?: string | null; title: string; description?: string | null; assigned_to?: string | null; created_by: string; status?: TaskStatus; priority?: TaskPriority; start_date?: string | null; due_date?: string | null; completed_by?: string | null; completed_at?: string | null; created_at?: string; updated_at?: string };
        Update: { project_id?: string | null; title?: string; description?: string | null; assigned_to?: string | null; status?: TaskStatus; priority?: TaskPriority; start_date?: string | null; due_date?: string | null; completed_by?: string | null; completed_at?: string | null };
        Relationships: [
          { foreignKeyName: "tasks_project_id_fkey"; columns: ["project_id"]; isOneToOne: false; referencedRelation: "projects"; referencedColumns: ["id"] },
          { foreignKeyName: "tasks_assigned_to_fkey"; columns: ["assigned_to"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "tasks_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "tasks_completed_by_fkey"; columns: ["completed_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      clients: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string | null;
          document_type: string | null;
          document_number: string | null;
          company: string | null;
          address: string | null;
          district: string | null;
          city: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          document_type?: string | null;
          document_number?: string | null;
          company?: string | null;
          address?: string | null;
          district?: string | null;
          city?: string | null;
          notes?: string | null;
          created_by: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          email?: string | null;
          phone?: string | null;
          document_type?: string | null;
          document_number?: string | null;
          company?: string | null;
          address?: string | null;
          district?: string | null;
          city?: string | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          role: UserRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          avatar_url?: string | null;
          role?: UserRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          avatar_url?: string | null;
          role?: UserRole;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_members: {
        Row: {
          project_id: string;
          user_id: string;
          participation_role: string | null;
          is_lead: boolean;
          created_at: string;
        };
        Insert: {
          project_id: string;
          user_id: string;
          participation_role?: string | null;
          is_lead?: boolean;
          created_at?: string;
        };
        Update: {
          participation_role?: string | null;
          is_lead?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      project_phase_templates: {
        Row: {
          id: string;
          name: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          sort_order: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          sort_order?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      project_phases: {
        Row: {
          project_id: string;
          phase_template_id: string;
          name: string;
          sort_order: number;
          is_active: boolean;
          progress: number;
          is_current: boolean;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          project_id: string;
          phase_template_id: string;
          name: string;
          sort_order: number;
          is_active?: boolean;
          progress?: number;
          is_current?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          sort_order?: number;
          is_active?: boolean;
          progress?: number;
          is_current?: boolean;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "project_phases_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_phases_phase_template_id_fkey";
            columns: ["phase_template_id"];
            isOneToOne: false;
            referencedRelation: "project_phase_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          code: string;
          description: string | null;
          project_type: string | null;
          service_type: string | null;
          address: string | null;
          district: string | null;
          city: string | null;
          area_m2: number | null;
          status: ProjectStatus;
          phase: string | null;
          start_date: string | null;
          due_date: string | null;
          progress: number;
          fee: number | null;
          cover_image: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          code: string;
          description?: string | null;
          project_type?: string | null;
          service_type?: string | null;
          address?: string | null;
          district?: string | null;
          city?: string | null;
          area_m2?: number | null;
          status?: ProjectStatus;
          phase?: string | null;
          start_date?: string | null;
          due_date?: string | null;
          progress?: number;
          fee?: number | null;
          cover_image?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          client_id?: string;
          name?: string;
          code?: string;
          description?: string | null;
          project_type?: string | null;
          service_type?: string | null;
          address?: string | null;
          district?: string | null;
          city?: string | null;
          area_m2?: number | null;
          status?: ProjectStatus;
          phase?: string | null;
          start_date?: string | null;
          due_date?: string | null;
          progress?: number;
          fee?: number | null;
          cover_image?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      replace_project_members: {
        Args: {
          target_project_id: string;
          member_ids: string[];
          lead_id?: string | null;
        };
        Returns: undefined;
      };
      set_project_phase_progress: {
        Args: {
          target_project_id: string;
          target_phase_definition_id: string;
          phase_progress: number;
          make_current: boolean;
        };
        Returns: undefined;
      };
      reorder_project_phase_templates: {
        Args: { template_ids: string[] };
        Returns: undefined;
      };
    };
    Enums: {
      notification_type: NotificationType;
      project_payment_status: PaymentStatus;
      project_file_category: ProjectFileCategory;
      event_type: EventType;
      project_status: ProjectStatus;
      user_role: UserRole;
    };
    CompositeTypes: Record<string, never>;
  };
};


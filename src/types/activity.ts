export type ActivityEntityType = "client" | "project" | "task" | "file" | "event" | "payment";
export type ActivityAction = "created" | "updated" | "completed" | "uploaded" | "registered";
export type ActivityLog = { id: string; user_id: string | null; entity_type: ActivityEntityType; entity_id: string; action: ActivityAction; metadata: Record<string, unknown>; created_at: string; user_name: string; label: string; entity_label: string; href: string };


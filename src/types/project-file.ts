export const PROJECT_FILE_CATEGORIES = ["plans", "renders", "contracts", "budgets", "references", "deliverables", "others"] as const;
export type ProjectFileCategory = (typeof PROJECT_FILE_CATEGORIES)[number];
export const PROJECT_FILE_CATEGORY_LABELS: Record<ProjectFileCategory, string> = { plans: "Planos", renders: "Renders", contracts: "Contratos", budgets: "Presupuestos", references: "Referencias", deliverables: "Entregables", others: "Otros" };
export type ProjectFile = { id: string; project_id: string; uploaded_by: string; file_name: string; file_path: string; file_type: string; file_size: number; category: ProjectFileCategory; created_at: string; project_name: string; uploader_name: string };
export type ProjectFileOptions = { projects: Array<{ id: string; name: string }> };


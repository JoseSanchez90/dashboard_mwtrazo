import { createHash } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const TARGETS = { 2024: 52, 2025: 60, 2026: 62 };
const PHASES = ["Evaluación inicial", "Cotización y alcance", "Contratación", "Levantamiento técnico", "Revisión documental", "Elaboración del expediente", "Ingreso a entidad", "Subsanación de observaciones", "Inscripción y entrega"];
const DISTRICTS = ["Miraflores", "San Isidro", "Santiago de Surco", "La Molina", "Barranco", "San Borja", "Jesús María", "Pueblo Libre", "Magdalena del Mar", "Chorrillos", "Lince", "San Miguel", "Ate", "Surquillo", "Lima"];
const PROJECT_KINDS = [
  ["Declaratoria de fábrica", "Saneamiento físico legal", "Declaratoria de fábrica vía regularización", 1500, 3300],
  ["Independización de unidades", "Saneamiento físico legal", "Independización de departamentos y unidades", 1400, 3000],
  ["Subdivisión de predio", "Saneamiento físico legal", "Subdivisión de predios", 1600, 3150],
  ["Levantamiento de cargas técnicas", "Saneamiento físico legal", "Levantamiento de cargas técnicas", 750, 1700],
];
const FIRST_NAMES = ["Adriana", "Alejandro", "Beatriz", "Bruno", "Carolina", "César", "Daniela", "Eduardo", "Fernanda", "Gabriel", "Jimena", "Jorge", "Luciana", "Martín", "Natalia", "Óscar", "Paola", "Renzo", "Sofía", "Víctor"];
const LAST_NAMES = ["Aguilar", "Benavides", "Cabrera", "Delgado", "Espinoza", "Fuentes", "Gamarra", "Herrera", "Ibarra", "Lagos", "Medina", "Navarro", "Ortega", "Peña", "Quispe", "Ramírez", "Silva", "Tello", "Valdivia", "Zamora"];
const COMPANY_NAMES = ["Inversiones Andenes", "Grupo Urbano Prisma", "Desarrollos Lima Norte", "Servicios Integrales Pacífico", "Corporación Valle Verde", "Gestión Inmobiliaria Central"];
const TASK_TITLES = ["Revisar partida y antecedentes", "Realizar levantamiento técnico", "Preparar planos y memoria descriptiva", "Completar expediente para la entidad", "Atender observaciones registrales"];
const EXPENSES = [
  ["Movilidad para visita técnica", 68],
  ["Alimentación en jornada de coordinación", 96],
  ["Impresiones de planos para reunión", 145],
  ["Taxi para gestión municipal", 54],
];

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}.`);
  return value;
}

function stableId(key) {
  const hex = createHash("sha256").update(`mwtrazo-history-v1:${key}`).digest("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function hashNumber(key) {
  return Number.parseInt(createHash("sha256").update(key).digest("hex").slice(0, 8), 16);
}

function isSupport(profile) {
  return /(^|\s)soporte(\s|$)/i.test(profile.full_name.trim());
}

function dateOnly(value) {
  return value?.slice(0, 10) ?? null;
}

function addDays(date, days) {
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function timestamp(date, hour = 15) {
  return `${date}T${String(hour).padStart(2, "0")}:00:00.000Z`;
}

function slug(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");
}

function chunks(values, size = 100) {
  const result = [];
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size));
  return result;
}

async function insertMissing(client, table, rows) {
  let inserted = 0;
  for (const group of chunks(rows)) {
    const ids = group.map((row) => row.id);
    const { data: existing, error: selectError } = await client.from(table).select("id").in("id", ids);
    if (selectError) throw new Error(`No se pudo comprobar ${table}: ${selectError.message}`);
    const existingIds = new Set(existing.map((row) => row.id));
    const missing = group.filter((row) => !existingIds.has(row.id));
    if (missing.length === 0) continue;
    const { error } = await client.from(table).insert(missing);
    if (error) throw new Error(`No se pudo insertar en ${table}: ${error.message}`);
    inserted += missing.length;
  }
  return inserted;
}

async function authenticateOperationalAdmin(client, admin) {
  const { data: profiles, error: profileError } = await admin.from("profiles").select("id,full_name,role,is_active").eq("role", "admin").eq("is_active", true);
  if (profileError) throw new Error(`No se pudieron consultar administradores: ${profileError.message}`);
  const profile = profiles.find((item) => !isSupport(item));
  if (!profile) throw new Error("No existe un administrador operativo distinto de Soporte.");
  const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const user = usersData?.users.find((item) => item.id === profile.id);
  if (usersError || !user?.email) throw new Error("No se encontró la identidad Auth del administrador operativo.");
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email: user.email });
  const tokenHash = linkData?.properties?.hashed_token;
  if (linkError || !tokenHash) throw new Error("No fue posible crear una sesión administrativa temporal.");
  const { data, error } = await client.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
  if (error || !data.user) throw new Error("No fue posible iniciar la sesión administrativa temporal.");
  return data.user;
}

function projectState(year, sequence) {
  if (year < 2026) {
    if (sequence % 13 === 0) return { status: "cancelled", phase: "Cotización y alcance", phaseProgress: 30 };
    return { status: "completed", phase: "Inscripción y entrega", phaseProgress: 100 };
  }
  const variant = sequence % 10;
  if (variant < 2) return { status: "completed", phase: "Inscripción y entrega", phaseProgress: 100 };
  if (variant === 8) return { status: "on_hold", phase: "Revisión documental", phaseProgress: 55 };
  if (variant === 9) return { status: "draft", phase: "Cotización y alcance", phaseProgress: 25 };
  const activePhases = ["Elaboración del expediente", "Ingreso a entidad", "Subsanación de observaciones"];
  return { status: "active", phase: activePhases[sequence % activePhases.length], phaseProgress: 35 + (sequence * 7) % 55 };
}

function projectProgress(state) {
  if (state.status === "completed") return 100;
  const index = PHASES.indexOf(state.phase);
  return Math.round((index * 100 + state.phaseProgress) / PHASES.length);
}

function startDateFor(year, sequence, status) {
  const maxMonth = year === 2026 ? 10 : 12;
  const month = status === "completed" && year === 2026 ? (sequence % 4) + 1 : ((sequence * 5) % maxMonth) + 1;
  const day = ((sequence * 7) % 20) + 2;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function buildMissingHistory(existingProjects, adminId) {
  const existingCodes = new Set(existingProjects.map((project) => project.code));
  const clients = [];
  const projects = [];
  for (const [yearText, target] of Object.entries(TARGETS)) {
    const year = Number(yearText);
    const current = existingProjects.filter((project) => Number(dateOnly(project.start_date)?.slice(0, 4)) === year).length;
    const missing = Math.max(target - current, 0);
    let sequence = 1;
    while (projects.filter((project) => project.year === year).length < missing) {
      const code = `HIST-${String(year).slice(2)}-${String(sequence).padStart(3, "0")}`;
      if (existingCodes.has(code)) { sequence += 1; continue; }
      const state = projectState(year, sequence);
      const startDate = startDateFor(year, sequence, state.status);
      const duration = state.status === "completed" ? 125 + (sequence % 4) * 25 : state.status === "cancelled" ? 80 : 260 + (sequence % 5) * 35;
      const dueDate = addDays(startDate, duration);
      const clientId = stableId(`client:${year}:${sequence}`);
      const projectId = stableId(`project:${year}:${sequence}`);
      const district = DISTRICTS[(sequence + year) % DISTRICTS.length];
      const companyClient = sequence % 5 === 0;
      const clientName = companyClient
        ? `${COMPANY_NAMES[sequence % COMPANY_NAMES.length]} ${String(year).slice(2)} SAC`
        : `${FIRST_NAMES[(sequence + year) % FIRST_NAMES.length]} ${LAST_NAMES[(sequence * 3) % LAST_NAMES.length]} ${LAST_NAMES[(sequence * 7 + 2) % LAST_NAMES.length]}`;
      const number = String((hashNumber(`${year}:${sequence}`) % 100000000) + 10000000).slice(0, 8);
      clients.push({
        id: clientId, name: clientName, email: `${slug(clientName)}.${String(sequence).padStart(3, "0")}@example.test`,
        phone: `9${String(hashNumber(clientId) % 100000000).padStart(8, "0")}`,
        document_type: companyClient ? "RUC" : "DNI", document_number: companyClient ? `206${String(hashNumber(code) % 100000000).padStart(8, "0")}` : number,
        company: companyClient ? clientName : null, address: `Av. Referencial ${100 + sequence}, ${district}`, district, city: "Lima",
        notes: "Cliente ficticio del historial operativo 2024-2026.", created_by: adminId,
        created_at: timestamp(addDays(startDate, -25)), updated_at: timestamp(addDays(startDate, -25)),
      });
      const [kind, projectType, serviceType, minimumFee, maximumFee] = PROJECT_KINDS[sequence % PROJECT_KINDS.length];
      projects.push({
        year, phaseProgress: state.phaseProgress,
        id: projectId, client_id: clientId, name: `${kind} ${district}`, code,
        description: "Proyecto ficticio histórico generado para representar la operación continua del estudio.",
        project_type: projectType, service_type: serviceType, address: `Sector urbano de ${district}`, district, city: "Lima",
        area_m2: 70 + (sequence * 37) % 350, status: state.status, phase: state.phase,
        start_date: startDate, due_date: dueDate, progress: projectProgress(state), fee: minimumFee + ((sequence * 150) % (maximumFee - minimumFee + 50)),
        cover_image: null, created_by: adminId, created_at: timestamp(addDays(startDate, -14)), updated_at: timestamp(startDate),
      });
      existingCodes.add(code);
      sequence += 1;
    }
  }
  return { clients, projects };
}

async function syncPhases(admin, projects) {
  for (const projectGroup of chunks(projects, 60)) {
    const ids = projectGroup.map((project) => project.id);
    const { data: snapshots, error } = await admin.from("project_phases").select("project_id,phase_template_id,name,sort_order,is_active").in("project_id", ids);
    if (error) throw new Error(`No se pudieron consultar fases históricas: ${error.message}`);
    const updates = [];
    for (const project of projectGroup) {
      const projectPhases = snapshots.filter((phase) => phase.project_id === project.id).sort((a, b) => a.sort_order - b.sort_order);
      const currentIndex = projectPhases.findIndex((phase) => phase.name === project.phase);
      for (let index = 0; index < projectPhases.length; index += 1) {
        const phase = projectPhases[index];
        const progress = project.status === "completed" || index < currentIndex ? 100 : index === currentIndex ? project.phaseProgress : 0;
        updates.push({ ...phase, progress, is_current: index === currentIndex, completed_at: progress === 100 ? timestamp(project.due_date) : null, updated_at: timestamp(project.start_date) });
      }
    }
    for (const updateGroup of chunks(updates)) {
      const { error: upsertError } = await admin.from("project_phases").upsert(updateGroup, { onConflict: "project_id,phase_template_id" });
      if (upsertError) throw new Error(`No se pudieron sincronizar fases: ${upsertError.message}`);
    }
  }
}

function rowsByProject(rows) {
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.project_id)) map.set(row.project_id, []);
    map.get(row.project_id).push(row);
  }
  return map;
}

function availableSlot(existingIds, prefix, projectId, start = 1) {
  let slot = start;
  while (existingIds.has(stableId(`${prefix}:${projectId}:${slot}`))) slot += 1;
  return slot;
}

async function enrichProjects(client, admin, projects, operationalIds, adminId) {
  const [tasksResult, eventsResult, paymentsResult, expensesResult] = await Promise.all([
    admin.from("tasks").select("id,project_id"), admin.from("events").select("id,project_id"),
    admin.from("project_payments").select("id,project_id"), admin.from("project_expenses").select("id,project_id"),
  ]);
  for (const result of [tasksResult, eventsResult, paymentsResult, expensesResult]) if (result.error) throw new Error(`No se pudo auditar el historial relacionado: ${result.error.message}`);
  const taskMap = rowsByProject(tasksResult.data); const eventMap = rowsByProject(eventsResult.data); const paymentMap = rowsByProject(paymentsResult.data); const expenseMap = rowsByProject(expensesResult.data);
  const taskIds = new Set(tasksResult.data.map((row) => row.id)); const eventIds = new Set(eventsResult.data.map((row) => row.id));
  const paymentIds = new Set(paymentsResult.data.map((row) => row.id)); const expenseIds = new Set(expensesResult.data.map((row) => row.id));
  const tasks = []; const events = []; const payments = []; const expenses = [];
  const today = new Date().toISOString().slice(0, 10);
  projects.forEach((project, projectIndex) => {
    const start = project.start_date ?? dateOnly(project.created_at) ?? today;
    const due = project.due_date ?? addDays(start, 180);
    const currentTasks = taskMap.get(project.id)?.length ?? 0;
    let taskSlot = availableSlot(taskIds, "task", project.id);
    for (let index = currentTasks; index < 3; index += 1) {
      const id = stableId(`task:${project.id}:${taskSlot}`); taskIds.add(id);
      const historical = project.status === "completed" || project.status === "cancelled" || due < today;
      const status = historical || index === 0 ? "completed" : index === 1 ? "in_progress" : "todo";
      const taskStart = historical ? addDays(start, 18 + index * 35) : index === 0 ? addDays(start, 20) : addDays(today, 3 + index * 12 + projectIndex % 8);
      const taskDue = historical ? addDays(taskStart, 12) : addDays(taskStart, 10 + index * 4);
      tasks.push({ id, project_id: project.id, title: TASK_TITLES[(projectIndex + index) % TASK_TITLES.length], description: "Tarea ficticia del historial operativo del proyecto.", assigned_to: operationalIds[(projectIndex + index) % operationalIds.length], created_by: adminId, status, priority: index === 2 ? "high" : "medium", start_date: taskStart, due_date: taskDue, created_at: timestamp(addDays(taskStart, -2)), updated_at: timestamp(taskStart) });
      taskSlot += 1;
    }
    const currentEvents = eventMap.get(project.id)?.length ?? 0;
    let eventSlot = availableSlot(eventIds, "event", project.id);
    for (let index = currentEvents; index < 2; index += 1) {
      const id = stableId(`event:${project.id}:${eventSlot}`); eventIds.add(id);
      const historical = project.status === "completed" || project.status === "cancelled";
      const eventDate = index === 0 ? addDays(start, 7) : historical ? addDays(due, -5) : addDays(today, 14 + projectIndex % 45);
      const startAt = new Date(`${eventDate}T${index === 0 ? "10" : "16"}:00:00-05:00`);
      events.push({ id, project_id: project.id, client_id: project.client_id, title: index === 0 ? "Reunión de inicio del proyecto" : historical ? "Entrega y cierre del proyecto" : "Revisión de avance con cliente", description: "Evento ficticio vinculado al seguimiento del proyecto.", type: index === 0 ? "meeting" : historical ? "delivery" : "site_visit", start_at: startAt.toISOString(), end_at: new Date(startAt.getTime() + 60 * 60000).toISOString(), all_day: false, location: project.district ?? "Lima", created_by: adminId, assigned_to: operationalIds[(projectIndex + index) % operationalIds.length], created_at: timestamp(addDays(eventDate, -6)), updated_at: timestamp(addDays(eventDate, -6)) });
      eventSlot += 1;
    }
    if ((paymentMap.get(project.id)?.length ?? 0) < 1) {
      const slot = availableSlot(paymentIds, "payment", project.id); const id = stableId(`payment:${project.id}:${slot}`); paymentIds.add(id);
      const historical = project.status === "completed" || project.status === "cancelled";
      const paymentDue = historical ? due : addDays(today, 25 + projectIndex % 35);
      const amount = Math.max(Math.round(((project.fee ?? 5000) * 0.35) / 10) * 10, 500);
      payments.push({ id, project_id: project.id, concept: historical ? "Saldo por entrega del proyecto" : "Cuota de avance del proyecto", amount, due_date: paymentDue, paid_at: historical ? timestamp(addDays(paymentDue, -1)) : null, status: historical ? "paid" : "pending", notes: "Pago ficticio coherente con el historial del proyecto.", created_by: adminId, created_at: timestamp(addDays(paymentDue, -20)), updated_at: timestamp(historical ? paymentDue : addDays(paymentDue, -20)) });
    }
    if ((expenseMap.get(project.id)?.length ?? 0) < 1) {
      const slot = availableSlot(expenseIds, "expense", project.id); const id = stableId(`expense:${project.id}:${slot}`); expenseIds.add(id);
      const [concept, baseAmount] = EXPENSES[projectIndex % EXPENSES.length];
      const expenseDate = project.status === "completed" || project.status === "cancelled" ? addDays(start, 35 + projectIndex % 50) : addDays(today, -(projectIndex % 45));
      expenses.push({ id, project_id: project.id, concept, amount: baseAmount + projectIndex % 37, expense_date: expenseDate, notes: "Gasto operativo ficticio asociado al proyecto.", created_by: adminId, created_at: timestamp(expenseDate), updated_at: timestamp(expenseDate) });
    }
  });
  return {
    tasks: await insertMissing(client, "tasks", tasks), events: await insertMissing(client, "events", events),
    payments: await insertMissing(client, "project_payments", payments), expenses: await insertMissing(client, "project_expenses", expenses),
  };
}

async function main() {
  const url = process.env.SUPABASE_URL ?? requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const client = createClient(url, requiredEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
  const admin = createClient(url, requiredEnv("SUPABASE_SECRET_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
  const authUser = await authenticateOperationalAdmin(client, admin);
  const { data: profiles, error: profileError } = await admin.from("profiles").select("id,full_name,is_active").eq("is_active", true);
  if (profileError) throw new Error(`No se pudieron consultar perfiles: ${profileError.message}`);
  const supportIds = profiles.filter(isSupport).map((profile) => profile.id);
  const operationalIds = profiles.filter((profile) => !isSupport(profile)).map((profile) => profile.id);
  if (operationalIds.length === 0) throw new Error("No existen usuarios operativos para asignar el historial.");
  const { data: existingProjects, error: projectError } = await admin.from("projects").select("id,client_id,name,code,status,phase,progress,start_date,due_date,district,fee,created_at");
  if (projectError) throw new Error(`No se pudieron consultar proyectos: ${projectError.message}`);
  const before = Object.fromEntries(Object.keys(TARGETS).map((year) => [year, existingProjects.filter((project) => dateOnly(project.start_date)?.startsWith(year)).length]));
  const missingHistory = buildMissingHistory(existingProjects, authUser.id);
  console.log("Proyectos por año antes de completar:", before);
  console.log("Proyectos que faltan para alcanzar los objetivos:", Object.fromEntries(Object.keys(TARGETS).map((year) => [year, missingHistory.projects.filter((project) => project.year === Number(year)).length])));
  if (!APPLY) { console.log("Auditoría terminada. Ejecuta con --apply para completar el historial."); return; }

  const insertedClients = await insertMissing(admin, "clients", missingHistory.clients.map((clientRow) =>
    Object.fromEntries(Object.entries(clientRow).filter(([key]) => key !== "year")),
  ));
  const insertedProjects = await insertMissing(admin, "projects", missingHistory.projects.map((projectRow) =>
    Object.fromEntries(Object.entries(projectRow).filter(([key]) => !["year", "phaseProgress"].includes(key))),
  ));
  await syncPhases(admin, missingHistory.projects);

  const { data: allProjects, error: allProjectsError } = await admin.from("projects").select("id,client_id,name,code,status,phase,progress,start_date,due_date,district,fee,created_at");
  if (allProjectsError) throw new Error(`No se pudieron recargar proyectos: ${allProjectsError.message}`);
  if (supportIds.length > 0) {
    const { error } = await admin.from("project_members").delete().in("user_id", supportIds);
    if (error) throw new Error(`No se pudo retirar a Soporte de los proyectos: ${error.message}`);
  }
  const { data: members, error: memberReadError } = await admin.from("project_members").select("project_id,user_id,is_lead");
  if (memberReadError) throw new Error(`No se pudieron consultar miembros: ${memberReadError.message}`);
  const memberships = [];
  allProjects.forEach((project, index) => {
    const projectMembers = members.filter((member) => member.project_id === project.id && operationalIds.includes(member.user_id));
    if (projectMembers.length === 0) memberships.push({ project_id: project.id, user_id: operationalIds[index % operationalIds.length], participation_role: "Responsable principal", is_lead: true, created_at: timestamp(project.start_date ?? dateOnly(project.created_at)) });
    else if (!projectMembers.some((member) => member.is_lead)) memberships.push({ project_id: project.id, user_id: projectMembers[0].user_id, participation_role: "Responsable principal", is_lead: true, created_at: timestamp(project.start_date ?? dateOnly(project.created_at)) });
  });
  if (memberships.length > 0) {
    const { error } = await admin.from("project_members").upsert(memberships, { onConflict: "project_id,user_id" });
    if (error) throw new Error(`No se pudieron completar responsables: ${error.message}`);
  }

  if (supportIds.length > 0) {
    const [{ data: supportTasks }, { data: supportEvents }] = await Promise.all([
      admin.from("tasks").select("id").in("assigned_to", supportIds), admin.from("events").select("id").in("assigned_to", supportIds),
    ]);
    for (const [index, task] of (supportTasks ?? []).entries()) await client.from("tasks").update({ assigned_to: operationalIds[index % operationalIds.length] }).eq("id", task.id);
    for (const [index, event] of (supportEvents ?? []).entries()) await client.from("events").update({ assigned_to: operationalIds[index % operationalIds.length] }).eq("id", event.id);
  }

  const related = await enrichProjects(client, admin, allProjects, operationalIds, authUser.id);
  const { data: contacts, error: contactError } = await admin.from("clients").select("id,name,email,phone");
  if (contactError) throw new Error(`No se pudieron validar clientes: ${contactError.message}`);
  for (const contact of contacts.filter((item) => !item.email || !item.phone)) {
    const { error } = await admin.from("clients").update({ email: contact.email ?? `${slug(contact.name)}.${contact.id.slice(0, 4)}@example.test`, phone: contact.phone ?? `9${String(hashNumber(contact.id) % 100000000).padStart(8, "0")}` }).eq("id", contact.id);
    if (error) throw new Error(`No se pudo completar el contacto de ${contact.name}: ${error.message}`);
  }

  const { data: finalProjects, error: finalError } = await admin.from("projects").select("id,start_date");
  if (finalError) throw new Error(`No se pudo validar el total final: ${finalError.message}`);
  const finalCounts = Object.fromEntries(Object.keys(TARGETS).map((year) => [year, finalProjects.filter((project) => dateOnly(project.start_date)?.startsWith(year)).length]));
  const [taskCheck, eventCheck, paymentCheck, expenseCheck, supportMemberCheck, supportTaskCheck, supportEventCheck] = await Promise.all([
    admin.from("tasks").select("project_id"), admin.from("events").select("project_id"), admin.from("project_payments").select("project_id"), admin.from("project_expenses").select("project_id"),
    supportIds.length ? admin.from("project_members").select("project_id", { count: "exact", head: true }).in("user_id", supportIds) : Promise.resolve({ count: 0, error: null }),
    supportIds.length ? admin.from("tasks").select("id", { count: "exact", head: true }).in("assigned_to", supportIds) : Promise.resolve({ count: 0, error: null }),
    supportIds.length ? admin.from("events").select("id", { count: "exact", head: true }).in("assigned_to", supportIds) : Promise.resolve({ count: 0, error: null }),
  ]);
  const missingRelations = {
    projectsWithoutTasks: finalProjects.filter((project) => !taskCheck.data?.some((row) => row.project_id === project.id)).length,
    projectsWithoutEvents: finalProjects.filter((project) => !eventCheck.data?.some((row) => row.project_id === project.id)).length,
    projectsWithoutPayments: finalProjects.filter((project) => !paymentCheck.data?.some((row) => row.project_id === project.id)).length,
    projectsWithoutExpenses: finalProjects.filter((project) => !expenseCheck.data?.some((row) => row.project_id === project.id)).length,
    supportProjectMemberships: supportMemberCheck.count ?? 0,
    supportTaskAssignments: supportTaskCheck.count ?? 0,
    supportEventAssignments: supportEventCheck.count ?? 0,
  };
  console.log("Resultado de la carga:", { insertedClients, insertedProjects, ...related });
  console.log("Proyectos finales por año:", finalCounts);
  console.log("Validación de congruencia:", missingRelations);
  await client.auth.signOut();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

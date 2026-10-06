import { createHash } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const PROJECT_TYPE = "Saneamiento físico legal";
const SERVICES = [
  {
    key: "declaratoria",
    label: "Declaratoria de fábrica vía regularización",
    title: "Declaratoria de fábrica",
    minFee: 1500,
    maxFee: 3300,
    minArea: 70,
    maxArea: 320,
    duration: 85,
    description: "Regularización de la edificación existente, levantamiento arquitectónico, elaboración de planos y expediente técnico para su inscripción.",
    tasks: ["Revisar partida registral y antecedentes", "Realizar levantamiento arquitectónico", "Preparar expediente de declaratoria", "Atender observaciones registrales"],
  },
  {
    key: "independizacion",
    label: "Independización de departamentos y unidades",
    title: "Independización de unidades",
    minFee: 1400,
    maxFee: 3000,
    minArea: 90,
    maxArea: 360,
    duration: 75,
    description: "Definición de unidades exclusivas y áreas comunes, planos de independización, memoria descriptiva y coordinación del reglamento interno.",
    tasks: ["Verificar declaratoria de fábrica inscrita", "Definir unidades y áreas comunes", "Elaborar planos de independización", "Revisar reglamento interno"],
  },
  {
    key: "subdivision",
    label: "Subdivisión de predios",
    title: "Subdivisión de predio",
    minFee: 1600,
    maxFee: 3150,
    minArea: 120,
    maxArea: 480,
    duration: 70,
    description: "Evaluación del lote matriz, levantamiento técnico, propuesta de sublotes y elaboración del expediente de subdivisión para gestión municipal y registral.",
    tasks: ["Revisar parámetros y partida matriz", "Realizar levantamiento del lote", "Preparar propuesta de sublotes", "Completar expediente de subdivisión"],
  },
  {
    key: "cargas",
    label: "Levantamiento de cargas técnicas",
    title: "Levantamiento de cargas técnicas",
    minFee: 750,
    maxFee: 1700,
    minArea: 65,
    maxArea: 300,
    duration: 45,
    description: "Evaluación de las cargas inscritas, verificación del cumplimiento técnico y preparación de la documentación sustentatoria para su levantamiento.",
    tasks: ["Identificar cargas inscritas", "Verificar sustento técnico", "Preparar informe de verificación", "Gestionar levantamiento registral"],
  },
];
const PHASE_RENAMES = new Map([
  ["Contacto inicial", "Evaluación inicial"],
  ["Propuesta", "Cotización y alcance"],
  ["Contrato", "Contratación"],
  ["Levantamiento", "Levantamiento técnico"],
  ["Anteproyecto", "Revisión documental"],
  ["Desarrollo", "Elaboración del expediente"],
  ["Expediente", "Ingreso a entidad"],
  ["Ejecución", "Subsanación de observaciones"],
  ["Entrega", "Inscripción y entrega"],
]);
const EXPENSES = [
  ["Taxi para visita técnica", 48],
  ["Movilidad para gestión registral", 36],
  ["Impresión de planos y memoria", 82],
  ["Copias certificadas del expediente", 65],
  ["Alimentación en jornada de levantamiento", 58],
];

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}.`);
  return value;
}

function hashNumber(value) {
  return Number.parseInt(createHash("sha256").update(value).digest("hex").slice(0, 8), 16);
}

function isSupport(profile) {
  return /(^|\s)soporte(\s|$)/i.test(profile.full_name.trim());
}

function addDays(value, days) {
  const date = new Date(`${value.slice(0, 10)}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function clampFee(service, seed) {
  const steps = Math.floor((service.maxFee - service.minFee) / 50);
  return service.minFee + (seed % (steps + 1)) * 50;
}

function serviceFor(project) {
  return SERVICES[hashNumber(project.id) % SERVICES.length];
}

function phaseFor(project) {
  const renamed = PHASE_RENAMES.get(project.phase);
  if (renamed) return renamed;
  if (project.status === "completed") return "Inscripción y entrega";
  if (project.status === "cancelled" || project.status === "draft") return "Cotización y alcance";
  if (project.status === "on_hold") return "Revisión documental";
  return "Elaboración del expediente";
}

function paymentAmounts(total, count) {
  if (count === 1) return [total];
  const weights = count === 2 ? [0.5, 0.5] : count === 3 ? [0.4, 0.35, 0.25] : Array.from({ length: count }, () => 1 / count);
  const amounts = [];
  let assigned = 0;
  for (let index = 0; index < count; index += 1) {
    const amount = index === count - 1 ? total - assigned : Math.round(total * weights[index] / 10) * 10;
    amounts.push(amount);
    assigned += amount;
  }
  return amounts;
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
}

async function updateRows(client, table, rows) {
  let updated = 0;
  for (const row of rows) {
    const { id, ...values } = row;
    const { error } = await client.from(table).update(values).eq("id", id);
    if (error) throw new Error(`No se pudo actualizar ${table} (${id}): ${error.message}`);
    updated += 1;
  }
  return updated;
}

async function main() {
  const url = process.env.SUPABASE_URL ?? requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const client = createClient(url, requiredEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
  const admin = createClient(url, requiredEnv("SUPABASE_SECRET_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
  await authenticateOperationalAdmin(client, admin);

  const [projectsResult, clientsResult, paymentsResult, expensesResult, tasksResult, eventsResult, templatesResult, phasesResult] = await Promise.all([
    admin.from("projects").select("id,client_id,name,code,status,phase,progress,start_date,due_date,district,city,address,area_m2,project_type,service_type,fee"),
    admin.from("clients").select("id,name"),
    admin.from("project_payments").select("id,project_id,concept,amount,due_date,status,created_at").order("due_date"),
    admin.from("project_expenses").select("id,project_id,concept,amount,expense_date,created_at").order("expense_date"),
    admin.from("tasks").select("id,project_id,title,created_at").order("created_at"),
    admin.from("events").select("id,project_id,title,start_at").order("start_at"),
    admin.from("project_phase_templates").select("id,name,sort_order"),
    admin.from("project_phases").select("project_id,phase_template_id,name,sort_order"),
  ]);
  const results = [projectsResult, clientsResult, paymentsResult, expensesResult, tasksResult, eventsResult, templatesResult, phasesResult];
  const failed = results.find((result) => result.error);
  if (failed?.error) throw new Error(`No se pudo auditar la información: ${failed.error.message}`);

  const clients = new Map(clientsResult.data.map((item) => [item.id, item.name]));
  const proposedProjects = projectsResult.data.map((project) => {
    const seed = hashNumber(project.id);
    const service = serviceFor(project);
    const fee = clampFee(service, seed);
    const area = service.minArea + seed % (service.maxArea - service.minArea + 1);
    const clientName = clients.get(project.client_id) ?? "Cliente";
    const baseDue = addDays(project.start_date ?? new Date().toISOString(), service.duration + seed % 45);
    const futureDue = addDays(new Date().toISOString(), 15 + seed % 75);
    const dueDate = ["active", "on_hold", "draft"].includes(project.status) && baseDue < new Date().toISOString().slice(0, 10) ? futureDue : baseDue;
    return {
      id: project.id,
      name: `${service.title} – ${clientName}`,
      description: `${service.description} Honorarios profesionales; las tasas municipales, notariales y registrales se cotizan por separado.`,
      project_type: PROJECT_TYPE,
      service_type: service.label,
      area_m2: area,
      phase: phaseFor(project),
      due_date: dueDate,
      fee,
      service,
    };
  });

  const distribution = Object.fromEntries(SERVICES.map((service) => [service.label, proposedProjects.filter((project) => project.service.key === service.key).length]));
  const fees = proposedProjects.map((project) => project.fee);
  const paymentTotals = new Map();
  for (const payment of paymentsResult.data) paymentTotals.set(payment.project_id, (paymentTotals.get(payment.project_id) ?? 0) + Number(payment.amount));
  const currentValidation = {
    projectsByYear: Object.fromEntries([2024, 2025, 2026].map((year) => [year, projectsResult.data.filter((project) => project.start_date?.startsWith(String(year))).length])),
    invalidServices: projectsResult.data.filter((project) => !SERVICES.some((service) => service.label === project.service_type)).length,
    excessiveFees: projectsResult.data.filter((project) => Number(project.fee) > 3300).length,
    mismatchedPaymentTotals: projectsResult.data.filter((project) => paymentTotals.has(project.id) && Math.abs(paymentTotals.get(project.id) - Number(project.fee)) > 0.01).length,
    excessiveExpenses: expensesResult.data.filter((expense) => Number(expense.amount) > 250).length,
  };
  console.log("Proyectos auditados:", proposedProjects.length);
  console.log("Estado actual:", currentValidation);
  console.log("Distribución propuesta:", distribution);
  console.log("Rango de honorarios propuesto:", { minimum: Math.min(...fees), maximum: Math.max(...fees), average: Math.round(fees.reduce((sum, fee) => sum + fee, 0) / fees.length) });
  if (!APPLY) {
    console.log("Auditoría terminada. Ejecuta con --apply para alinear proyectos y finanzas.");
    return;
  }

  for (const template of templatesResult.data) {
    const name = PHASE_RENAMES.get(template.name);
    if (!name) continue;
    const { error } = await admin.from("project_phase_templates").update({ name }).eq("id", template.id);
    if (error) throw new Error(`No se pudo renombrar la fase ${template.name}: ${error.message}`);
  }
  for (const phase of phasesResult.data) {
    const name = PHASE_RENAMES.get(phase.name);
    if (!name) continue;
    const { error } = await admin.from("project_phases").update({ name }).eq("project_id", phase.project_id).eq("phase_template_id", phase.phase_template_id);
    if (error) throw new Error(`No se pudo actualizar una fase histórica: ${error.message}`);
  }

  const projectUpdates = proposedProjects.map((project) => Object.fromEntries(Object.entries(project).filter(([key]) => key !== "service")));
  const updatedProjects = await updateRows(client, "projects", projectUpdates);
  const projectData = new Map(proposedProjects.map((project) => [project.id, project]));

  const groupedPayments = new Map();
  for (const payment of paymentsResult.data) {
    if (!groupedPayments.has(payment.project_id)) groupedPayments.set(payment.project_id, []);
    groupedPayments.get(payment.project_id).push(payment);
  }
  const paymentUpdates = [];
  for (const [projectId, payments] of groupedPayments) {
    const project = projectData.get(projectId);
    if (!project) continue;
    const amounts = paymentAmounts(project.fee, payments.length);
    payments.forEach((payment, index) => paymentUpdates.push({
      id: payment.id,
      amount: amounts[index],
      concept: payments.length === 1 ? `Honorarios por ${project.service.title.toLocaleLowerCase("es")}` : index === 0 ? "Adelanto de honorarios" : index === payments.length - 1 ? "Saldo de honorarios" : `Cuota ${index + 1} de honorarios`,
    }));
  }

  const groupedTasks = new Map();
  for (const task of tasksResult.data) {
    if (!task.project_id) continue;
    if (!groupedTasks.has(task.project_id)) groupedTasks.set(task.project_id, []);
    groupedTasks.get(task.project_id).push(task);
  }
  const taskUpdates = [];
  for (const [projectId, tasks] of groupedTasks) {
    const project = projectData.get(projectId);
    if (!project) continue;
    tasks.forEach((task, index) => taskUpdates.push({ id: task.id, title: project.service.tasks[index % project.service.tasks.length], description: `Actividad del servicio de ${project.service.label.toLocaleLowerCase("es")}.` }));
  }

  const eventUpdates = eventsResult.data.filter((event) => event.project_id && projectData.has(event.project_id)).map((event, index) => {
    const project = projectData.get(event.project_id);
    const titles = ["Evaluación inicial con el cliente", "Visita y levantamiento técnico", "Revisión del expediente", "Entrega de documentación"];
    return { id: event.id, title: titles[index % titles.length], description: `Seguimiento del servicio de ${project.service.label.toLocaleLowerCase("es")}.` };
  });
  const expenseUpdates = expensesResult.data.filter((expense) => projectData.has(expense.project_id)).map((expense, index) => {
    const [concept, base] = EXPENSES[(hashNumber(expense.id) + index) % EXPENSES.length];
    return { id: expense.id, concept, amount: base + hashNumber(expense.id) % 35, notes: "Gasto operativo menor asociado a la atención del expediente." };
  });

  const updatedPayments = await updateRows(client, "project_payments", paymentUpdates);
  const updatedExpenses = await updateRows(client, "project_expenses", expenseUpdates);
  const updatedTasks = await updateRows(client, "tasks", taskUpdates);
  const updatedEvents = await updateRows(client, "events", eventUpdates);

  const { data: validation, error: validationError } = await admin.from("projects").select("id,service_type,fee");
  if (validationError) throw new Error(`No se pudo validar el resultado: ${validationError.message}`);
  const invalidServices = validation.filter((project) => !SERVICES.some((service) => service.label === project.service_type)).length;
  const excessiveFees = validation.filter((project) => Number(project.fee) > 3300).length;
  console.log("Actualización completada:", { projects: updatedProjects, payments: updatedPayments, expenses: updatedExpenses, tasks: updatedTasks, events: updatedEvents });
  console.log("Validación final:", { invalidServices, excessiveFees, supportAssignmentsChanged: 0 });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

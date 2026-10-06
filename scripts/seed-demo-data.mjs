import { createHash } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const DEMO_NAMESPACE = "mwtrazo-demo-v1";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}.`);
  return value;
}

function demoId(key) {
  const hex = createHash("sha256").update(`${DEMO_NAMESPACE}:${key}`).digest("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function iso(date) {
  return `${date}T15:00:00.000Z`;
}

function plusDays(date, amount) {
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

const clientSpecs = [
  ["c2401", 2024, "Constructora Horizonte Andino SAC", "RUC", "20609124011", "Constructora Horizonte Andino SAC", "proyectos@horizonte-andino.example", "987410201", "Miraflores"],
  ["c2402", 2024, "Valeria Paredes Núñez", "DNI", "74218530", null, "valeria.paredes@example.test", "986420315", "Santiago de Surco"],
  ["c2403", 2024, "Grupo Comercial Alameda EIRL", "RUC", "20609124029", "Grupo Comercial Alameda EIRL", "administracion@alameda.example", "985330426", "San Isidro"],
  ["c2404", 2024, "Javier Montes Rivas", "DNI", "71520486", null, "javier.montes@example.test", "984240537", "Lince"],
  ["c2501", 2025, "Inversiones Costa Verde SAC", "RUC", "20610235017", "Inversiones Costa Verde SAC", "contacto@costaverde.example", "983150648", "Magdalena del Mar"],
  ["c2502", 2025, "Camila Rojas Salazar", "DNI", "76843125", null, "camila.rojas@example.test", "982160759", "La Molina"],
  ["c2503", 2025, "Desarrollos Urbanos Altura SAC", "RUC", "20610235025", "Desarrollos Urbanos Altura SAC", "proyectos@altura.example", "981270860", "Jesús María"],
  ["c2504", 2025, "Rodrigo Vega Cornejo", "CE", "001284635", null, "rodrigo.vega@example.test", "980380971", "Barranco"],
  ["c2505", 2025, "Clínica Santa Elena", "RUC", "20610235033", "Servicios Médicos Santa Elena SAC", "gerencia@santaelena.example", "979491082", "Pueblo Libre"],
  ["c2506", 2025, "Mariela Torres Cárdenas", "DNI", "73196584", null, "mariela.torres@example.test", "978502193", "San Borja"],
  ["c2601", 2026, "Corporación Nexo Sur SAC", "RUC", "20611346013", "Corporación Nexo Sur SAC", "obras@nexosur.example", "977613204", "Chorrillos"],
  ["c2602", 2026, "Andrea Chávez Landa", "DNI", "75420819", null, "andrea.chavez@example.test", "976724315", "Miraflores"],
  ["c2603", 2026, "Hotel Boutique Barranco SAC", "RUC", "20611346021", "Hotel Boutique Barranco SAC", "administracion@hotelbarranco.example", "975835426", "Barranco"],
  ["c2604", 2026, "Felipe del Solar Ames", "DNI", "70918463", null, "felipe.delsolar@example.test", "974946537", "Asia"],
  ["c2605", 2026, "Centro Educativo Nuevo Horizonte", "RUC", "20611346048", "Promotora Educativa Nuevo Horizonte SAC", "direccion@nuevohorizonte.example", "973057648", "Ate"],
  ["c2606", 2026, "Renata Flores Palomino", "DNI", "78531642", null, "renata.flores@example.test", "972168759", "San Miguel"],
  ["c2405", 2024, "Mariana Salas Quiroz", "DNI", "72641958", null, "mariana.salas@example.test", "971279860", "Surquillo"],
  ["c2406", 2024, "Estudio Legal Rivera SAC", "RUC", "20609124037", "Estudio Legal Rivera SAC", "contacto@rivera.example", "970380971", "San Isidro"],
  ["c2407", 2024, "Diego Campos León", "DNI", "74820361", null, "diego.campos@example.test", "969491082", "Pueblo Libre"],
  ["c2408", 2024, "Asociación Cultural Amanecer", "RUC", "20609124045", "Asociación Cultural Amanecer", "gestion@amanecer.example", "968502193", "Breña"],
  ["c2507", 2025, "Nova Retail Perú SAC", "RUC", "20610235041", "Nova Retail Perú SAC", "operaciones@novaretail.example", "967613204", "La Victoria"],
  ["c2508", 2025, "Patricia Montalvo Ruiz", "DNI", "77240916", null, "patricia.montalvo@example.test", "966724315", "San Luis"],
  ["c2509", 2025, "Inmobiliaria Parque Central SAC", "RUC", "20610235050", "Inmobiliaria Parque Central SAC", "proyectos@parquecentral.example", "965835426", "Lima"],
  ["c2607", 2026, "Laboratorio BioVida SAC", "RUC", "20611346056", "Laboratorio BioVida SAC", "infraestructura@biovida.example", "964946537", "San Borja"],
  ["c2608", 2026, "Sebastián Núñez Prado", "DNI", "71953648", null, "sebastian.nunez@example.test", "963057648", "Jesús María"],
  ["c2609", 2026, "Cafetería Origen Lima SAC", "RUC", "20611346064", "Cafetería Origen Lima SAC", "administracion@origenlima.example", "962168759", "Miraflores"],
];

const projectSpecs = [
  { key: "p2401", client: "c2401", year: 2024, name: "Remodelación integral Miraflores", code: "DEMO-24-01", type: "Comercial", service: "Diseño y supervisión", district: "Miraflores", area: 420, status: "completed", phase: "Entrega", phaseProgress: 100, start: "2024-01-15", due: "2024-06-28", fee: 68000 },
  { key: "p2402", client: "c2403", year: 2024, name: "Oficinas corporativas Alameda", code: "DEMO-24-02", type: "Corporativo", service: "Diseño interior", district: "San Isidro", area: 310, status: "completed", phase: "Entrega", phaseProgress: 100, start: "2024-03-04", due: "2024-08-16", fee: 52500 },
  { key: "p2403", client: "c2402", year: 2024, name: "Ampliación vivienda Los Álamos", code: "DEMO-24-03", type: "Residencial", service: "Diseño y expediente", district: "Santiago de Surco", area: 185, status: "completed", phase: "Entrega", phaseProgress: 100, start: "2024-05-20", due: "2024-11-08", fee: 38500 },
  { key: "p2404", client: "c2404", year: 2024, name: "Local comercial Parque Castilla", code: "DEMO-24-04", type: "Comercial", service: "Anteproyecto", district: "Lince", area: 96, status: "cancelled", phase: "Propuesta", phaseProgress: 25, start: "2024-09-02", due: "2024-12-06", fee: 14800 },
  { key: "p2501", client: "c2502", year: 2025, name: "Casa patio La Molina", code: "DEMO-25-01", type: "Residencial", service: "Diseño integral", district: "La Molina", area: 360, status: "completed", phase: "Entrega", phaseProgress: 100, start: "2025-01-13", due: "2025-09-26", fee: 74500 },
  { key: "p2502", client: "c2505", year: 2025, name: "Consultorios Clínica Santa Elena", code: "DEMO-25-02", type: "Salud", service: "Diseño y compatibilización", district: "Pueblo Libre", area: 275, status: "completed", phase: "Entrega", phaseProgress: 100, start: "2025-02-17", due: "2025-07-25", fee: 61800 },
  { key: "p2503", client: "c2503", year: 2025, name: "Edificio multifamiliar Altura", code: "DEMO-25-03", type: "Multifamiliar", service: "Diseño y supervisión", district: "Jesús María", area: 1280, status: "active", phase: "Ejecución", phaseProgress: 75, start: "2025-04-07", due: "2026-12-18", fee: 186000 },
  { key: "p2504", client: "c2504", year: 2025, name: "Restaurante Patio Barranco", code: "DEMO-25-04", type: "Comercial", service: "Diseño interior", district: "Barranco", area: 210, status: "on_hold", phase: "Desarrollo", phaseProgress: 40, start: "2025-06-02", due: "2026-03-27", fee: 46200 },
  { key: "p2505", client: "c2501", year: 2025, name: "Almacén logístico Costa Verde", code: "DEMO-25-05", type: "Industrial", service: "Expediente municipal", district: "Callao", area: 840, status: "completed", phase: "Entrega", phaseProgress: 100, start: "2025-07-14", due: "2025-12-19", fee: 57500 },
  { key: "p2506", client: "c2506", year: 2025, name: "Centro cultural San Borja", code: "DEMO-25-06", type: "Cultural", service: "Diseño arquitectónico", district: "San Borja", area: 590, status: "active", phase: "Expediente", phaseProgress: 80, start: "2025-09-01", due: "2027-02-26", fee: 98500 },
  { key: "p2601", client: "c2602", year: 2026, name: "Departamento Parque Reducto", code: "DEMO-26-01", type: "Residencial", service: "Remodelación integral", district: "Miraflores", area: 145, status: "active", phase: "Ejecución", phaseProgress: 55, start: "2026-01-12", due: "2026-11-20", fee: 43200 },
  { key: "p2602", client: "c2601", year: 2026, name: "Sede corporativa Nexo Sur", code: "DEMO-26-02", type: "Corporativo", service: "Diseño interior y supervisión", district: "Chorrillos", area: 680, status: "active", phase: "Desarrollo", phaseProgress: 70, start: "2026-02-09", due: "2027-01-29", fee: 112000 },
  { key: "p2603", client: "c2604", year: 2026, name: "Casa de playa Arena Blanca", code: "DEMO-26-03", type: "Residencial", service: "Diseño arquitectónico", district: "Asia", area: 325, status: "draft", phase: "Propuesta", phaseProgress: 35, start: "2026-04-06", due: "2027-04-30", fee: 69500 },
  { key: "p2604", client: "c2603", year: 2026, name: "Hotel boutique Casa República", code: "DEMO-26-04", type: "Hospedaje", service: "Diseño y restauración", district: "Barranco", area: 760, status: "on_hold", phase: "Anteproyecto", phaseProgress: 60, start: "2026-03-16", due: "2027-06-25", fee: 138000 },
  { key: "p2605", client: "c2606", year: 2026, name: "Fachada comercial La Marina", code: "DEMO-26-05", type: "Comercial", service: "Diseño de fachada", district: "San Miguel", area: 118, status: "completed", phase: "Entrega", phaseProgress: 100, start: "2026-02-02", due: "2026-07-17", fee: 27800 },
  { key: "p2606", client: "c2605", year: 2026, name: "Ampliación Colegio Nuevo Horizonte", code: "DEMO-26-06", type: "Educativo", service: "Diseño y expediente", district: "Ate", area: 940, status: "active", phase: "Levantamiento", phaseProgress: 80, start: "2026-06-08", due: "2027-08-27", fee: 124500 },
  { key: "p2607", client: "c2601", year: 2026, name: "Adecuación accesible Nexo Sur", code: "DEMO-26-07", type: "Corporativo", service: "Expediente y supervisión", district: "Chorrillos", area: 230, status: "active", phase: "Expediente", phaseProgress: 45, start: "2026-07-13", due: "2026-12-11", fee: 36500 },
  { key: "p2405", client: "c2405", year: 2024, name: "Departamento familiar Surquillo", code: "DEMO-24-05", type: "Residencial", service: "Diseño interior", district: "Surquillo", area: 112, status: "completed", phase: "Entrega", phaseProgress: 100, start: "2024-02-12", due: "2024-07-12", fee: 29400 },
  { key: "p2406", client: "c2406", year: 2024, name: "Estudio jurídico Rivera", code: "DEMO-24-06", type: "Corporativo", service: "Remodelación de oficinas", district: "San Isidro", area: 195, status: "completed", phase: "Entrega", phaseProgress: 100, start: "2024-04-01", due: "2024-09-13", fee: 41800 },
  { key: "p2407", client: "c2407", year: 2024, name: "Vivienda compacta Pueblo Libre", code: "DEMO-24-07", type: "Residencial", service: "Ampliación y remodelación", district: "Pueblo Libre", area: 168, status: "completed", phase: "Entrega", phaseProgress: 100, start: "2024-06-10", due: "2024-12-06", fee: 36200 },
  { key: "p2408", client: "c2408", year: 2024, name: "Sala cultural Amanecer", code: "DEMO-24-08", type: "Cultural", service: "Diseño arquitectónico", district: "Breña", area: 330, status: "completed", phase: "Entrega", phaseProgress: 100, start: "2024-07-22", due: "2025-02-14", fee: 54900 },
  { key: "p2409", client: "c2401", year: 2024, name: "Terraza corporativa Horizonte", code: "DEMO-24-09", type: "Corporativo", service: "Diseño y supervisión", district: "Miraflores", area: 205, status: "completed", phase: "Entrega", phaseProgress: 100, start: "2024-10-07", due: "2025-03-28", fee: 33500 },
  { key: "p2507", client: "c2507", year: 2025, name: "Tienda insignia Nova Retail", code: "DEMO-25-07", type: "Comercial", service: "Diseño interior y supervisión", district: "La Victoria", area: 450, status: "completed", phase: "Entrega", phaseProgress: 100, start: "2025-02-03", due: "2025-08-29", fee: 68700 },
  { key: "p2508", client: "c2508", year: 2025, name: "Casa urbana San Luis", code: "DEMO-25-08", type: "Residencial", service: "Diseño integral", district: "San Luis", area: 245, status: "completed", phase: "Entrega", phaseProgress: 100, start: "2025-05-12", due: "2026-01-30", fee: 53200 },
  { key: "p2509", client: "c2509", year: 2025, name: "Residencial Parque Central", code: "DEMO-25-09", type: "Multifamiliar", service: "Anteproyecto y expediente", district: "Lima", area: 1560, status: "active", phase: "Ejecución", phaseProgress: 35, start: "2025-07-07", due: "2027-05-28", fee: 204000 },
  { key: "p2510", client: "c2505", year: 2025, name: "Laboratorio clínico Santa Elena", code: "DEMO-25-10", type: "Salud", service: "Diseño especializado", district: "Pueblo Libre", area: 188, status: "completed", phase: "Entrega", phaseProgress: 100, start: "2025-09-15", due: "2026-04-17", fee: 44700 },
  { key: "p2608", client: "c2607", year: 2026, name: "Laboratorio de diagnóstico BioVida", code: "DEMO-26-08", type: "Salud", service: "Diseño y compatibilización", district: "San Borja", area: 390, status: "active", phase: "Desarrollo", phaseProgress: 50, start: "2026-02-23", due: "2027-03-26", fee: 86400 },
  { key: "p2609", client: "c2608", year: 2026, name: "Loft urbano Campo de Marte", code: "DEMO-26-09", type: "Residencial", service: "Remodelación integral", district: "Jesús María", area: 92, status: "active", phase: "Ejecución", phaseProgress: 30, start: "2026-05-04", due: "2026-12-18", fee: 31800 },
  { key: "p2610", client: "c2609", year: 2026, name: "Cafetería Origen Miraflores", code: "DEMO-26-10", type: "Comercial", service: "Diseño interior", district: "Miraflores", area: 126, status: "active", phase: "Expediente", phaseProgress: 65, start: "2026-06-15", due: "2027-01-22", fee: 38900 },
  { key: "p2611", client: "c2605", year: 2026, name: "Biblioteca escolar Nuevo Horizonte", code: "DEMO-26-11", type: "Educativo", service: "Diseño y mobiliario", district: "Ate", area: 280, status: "draft", phase: "Anteproyecto", phaseProgress: 40, start: "2026-08-10", due: "2027-07-30", fee: 51600 },
];

const taskSpecs = [
  ["t2401", "p2401", "Validar levantamiento arquitectónico", "completed", "high", "2024-01-18", "2024-01-26"],
  ["t2402", "p2401", "Aprobar propuesta de distribución", "completed", "medium", "2024-02-05", "2024-02-16"],
  ["t2403", "p2402", "Compatibilizar instalaciones de oficinas", "completed", "high", "2024-04-08", "2024-04-26"],
  ["t2404", "p2402", "Revisar planos de mobiliario", "completed", "medium", "2024-06-03", "2024-06-14"],
  ["t2405", "p2403", "Preparar expediente para licencia", "completed", "urgent", "2024-07-01", "2024-07-19"],
  ["t2406", "p2404", "Presentar alternativas de fachada", "completed", "low", "2024-09-09", "2024-09-20"],
  ["t2501", "p2501", "Definir programa arquitectónico", "completed", "high", "2025-01-20", "2025-02-07"],
  ["t2502", "p2501", "Coordinar especialidad estructural", "completed", "medium", "2025-03-10", "2025-03-28"],
  ["t2503", "p2502", "Validar flujo de atención clínica", "completed", "urgent", "2025-02-24", "2025-03-07"],
  ["t2504", "p2502", "Revisar acabados sanitarios", "completed", "high", "2025-05-05", "2025-05-16"],
  ["t2505", "p2503", "Cerrar planos de arquitectura", "completed", "high", "2025-06-02", "2025-06-27"],
  ["t2506", "p2503", "Coordinar interferencias BIM", "completed", "urgent", "2025-08-04", "2025-08-22"],
  ["t2507", "p2504", "Desarrollar propuesta de iluminación", "completed", "medium", "2025-07-07", "2025-07-25"],
  ["t2508", "p2505", "Subsanar observaciones municipales", "completed", "high", "2025-10-06", "2025-10-24"],
  ["t2509", "p2506", "Preparar memoria descriptiva", "completed", "medium", "2025-11-03", "2025-11-21"],
  ["t2510", "p2506", "Validar presupuesto preliminar", "completed", "high", "2025-12-01", "2025-12-12"],
  ["t2601", "p2601", "Revisar instalación de carpintería", "completed", "medium", "2026-02-09", "2026-02-20"],
  ["t2602", "p2602", "Aprobar layout de estaciones de trabajo", "completed", "high", "2026-03-02", "2026-03-13"],
  ["t2603", "p2605", "Cerrar expediente fotográfico", "completed", "low", "2026-07-06", "2026-07-15"],
  ["t2604", "p2606", "Completar levantamiento del pabellón norte", "completed", "high", "2026-08-03", "2026-08-21"],
  ["t2605", "p2603", "Ajustar propuesta según parámetros urbanos", "in_progress", "high", "2026-09-21", "2026-10-02"],
  ["t2606", "p2601", "Coordinar visita de acabados finales", "in_progress", "urgent", "2026-10-05", "2026-10-09"],
  ["t2607", "p2602", "Entregar cuadro comparativo de proveedores", "in_progress", "medium", "2026-10-05", "2026-10-13"],
  ["t2608", "p2607", "Ingresar expediente de accesibilidad", "todo", "urgent", "2026-10-12", "2026-10-16"],
  ["t2609", "p2606", "Coordinar estudio de evacuación", "todo", "high", "2026-10-19", "2026-10-30"],
  ["t2610", "p2604", "Actualizar presupuesto de restauración", "todo", "medium", "2026-11-02", "2026-11-13"],
  ["t2611", "p2503", "Preparar reporte mensual de obra", "todo", "medium", "2026-11-23", "2026-11-27"],
  ["t2407", "p2405", "Definir paleta de acabados interiores", "completed", "medium", "2024-03-04", "2024-03-15"],
  ["t2408", "p2405", "Revisar planos de iluminación", "completed", "high", "2024-04-22", "2024-05-03"],
  ["t2409", "p2406", "Levantar medidas de oficinas existentes", "completed", "high", "2024-04-03", "2024-04-12"],
  ["t2410", "p2406", "Coordinar mobiliario del directorio", "completed", "medium", "2024-06-17", "2024-06-28"],
  ["t2411", "p2407", "Desarrollar propuesta de ampliación", "completed", "high", "2024-07-08", "2024-07-26"],
  ["t2412", "p2407", "Preparar planos para licencia", "completed", "urgent", "2024-09-02", "2024-09-20"],
  ["t2413", "p2408", "Validar aforo de sala cultural", "completed", "urgent", "2024-08-05", "2024-08-16"],
  ["t2414", "p2408", "Compatibilizar sistema acústico", "completed", "high", "2024-10-14", "2024-11-01"],
  ["t2415", "p2409", "Aprobar paisajismo de terraza", "completed", "medium", "2024-11-11", "2024-11-29"],
  ["t2511", "p2507", "Coordinar exhibidores de tienda", "completed", "high", "2025-03-03", "2025-03-21"],
  ["t2512", "p2507", "Revisar señalética comercial", "completed", "medium", "2025-06-09", "2025-06-20"],
  ["t2513", "p2508", "Definir distribución de dormitorios", "completed", "medium", "2025-06-02", "2025-06-13"],
  ["t2514", "p2508", "Coordinar cálculo estructural", "completed", "high", "2025-08-11", "2025-08-29"],
  ["t2515", "p2509", "Revisar cabida normativa", "completed", "urgent", "2025-07-14", "2025-07-25"],
  ["t2516", "p2509", "Cerrar expediente de especialidades", "completed", "high", "2025-11-10", "2025-12-05"],
  ["t2517", "p2510", "Validar equipamiento de laboratorio", "completed", "urgent", "2025-10-06", "2025-10-24"],
  ["t2612", "p2608", "Coordinar gases y extracción del laboratorio", "in_progress", "urgent", "2026-09-28", "2026-10-12"],
  ["t2613", "p2609", "Revisar instalación de luminarias", "in_progress", "high", "2026-10-05", "2026-10-14"],
  ["t2614", "p2610", "Presentar expediente de anuncio exterior", "todo", "medium", "2026-10-12", "2026-10-23"],
  ["t2615", "p2611", "Validar catálogo de mobiliario escolar", "todo", "medium", "2026-10-19", "2026-11-06"],
  ["t2616", "p2608", "Preparar cuadro de acabados sanitarios", "todo", "high", "2026-11-02", "2026-11-16"],
  ["t2617", "p2609", "Programar sesión fotográfica final", "todo", "low", "2026-11-23", "2026-12-04"],
  ["t2618", "p2610", "Coordinar prueba de iluminación", "todo", "medium", "2026-12-01", "2026-12-11"],
];

const eventSpecs = [
  ["e2401", "p2401", "Reunión de inicio con cliente", "meeting", "2024-01-16", 10, 60, "Sala de reuniones"],
  ["e2402", "p2402", "Visita para levantamiento de oficinas", "site_visit", "2024-03-06", 9, 120, "San Isidro"],
  ["e2403", "p2403", "Entrega de anteproyecto", "delivery", "2024-06-21", 16, 60, "Reunión virtual"],
  ["e2404", "p2401", "Cierre y entrega de obra", "delivery", "2024-06-28", 11, 90, "Miraflores"],
  ["e2501", "p2501", "Taller de necesidades de vivienda", "meeting", "2025-01-18", 10, 90, "La Molina"],
  ["e2502", "p2502", "Inspección de instalaciones clínicas", "site_visit", "2025-03-12", 9, 120, "Pueblo Libre"],
  ["e2503", "p2503", "Presentación de anteproyecto", "delivery", "2025-05-30", 16, 75, "Oficina del cliente"],
  ["e2504", "p2504", "Mesa de trabajo de concepto interior", "meeting", "2025-07-10", 15, 90, "Barranco"],
  ["e2505", "p2505", "Vencimiento de subsanaciones", "deadline", "2025-10-24", 18, 30, "Municipalidad"],
  ["e2506", "p2506", "Revisión del programa cultural", "meeting", "2025-11-14", 11, 60, "San Borja"],
  ["e2507", "p2503", "Visita de control de obra", "site_visit", "2025-12-05", 8, 120, "Jesús María"],
  ["e2508", "p2501", "Entrega final Casa Patio", "delivery", "2025-09-26", 16, 60, "La Molina"],
  ["e2601", "p2602", "Kickoff de sede corporativa", "meeting", "2026-02-10", 10, 60, "Chorrillos"],
  ["e2602", "p2605", "Validación de muestra de fachada", "site_visit", "2026-05-22", 9, 90, "San Miguel"],
  ["e2603", "p2606", "Reunión con dirección académica", "meeting", "2026-07-02", 15, 75, "Ate"],
  ["e2604", "p2603", "Presentación de propuesta de playa", "delivery", "2026-09-18", 17, 60, "Reunión virtual"],
  ["e2605", "p2601", "Visita de acabados finales", "site_visit", "2026-10-07", 9, 120, "Miraflores"],
  ["e2606", "p2602", "Comité de selección de proveedores", "meeting", "2026-10-10", 10, 90, "Chorrillos"],
  ["e2607", "p2607", "Entrega de expediente de accesibilidad", "delivery", "2026-10-16", 16, 60, "Oficina del cliente"],
  ["e2608", "p2603", "Vencimiento de revisión municipal", "deadline", "2026-11-05", 18, 30, "Municipalidad de Asia"],
  ["e2609", "p2606", "Planificación del cierre anual", "internal", "2026-12-12", 9, 120, "Oficina MWTRAZO"],
  ["e2405", "p2405", "Presentación de propuesta interior", "meeting", "2024-03-22", 16, 60, "Surquillo"],
  ["e2406", "p2406", "Visita técnica a estudio jurídico", "site_visit", "2024-04-05", 9, 90, "San Isidro"],
  ["e2407", "p2407", "Revisión municipal de ampliación", "deadline", "2024-09-20", 17, 30, "Pueblo Libre"],
  ["e2408", "p2408", "Taller de programación cultural", "meeting", "2024-08-09", 10, 90, "Breña"],
  ["e2409", "p2408", "Prueba acústica de sala", "site_visit", "2024-11-08", 15, 90, "Breña"],
  ["e2410", "p2409", "Aprobación de terraza corporativa", "delivery", "2024-12-06", 16, 60, "Miraflores"],
  ["e2411", "p2405", "Entrega final de departamento", "delivery", "2024-07-12", 11, 60, "Surquillo"],
  ["e2509", "p2507", "Reunión de visual merchandising", "meeting", "2025-03-14", 10, 75, "La Victoria"],
  ["e2510", "p2507", "Inspección previa a apertura", "site_visit", "2025-08-22", 9, 120, "La Victoria"],
  ["e2511", "p2508", "Presentación de anteproyecto residencial", "delivery", "2025-07-04", 16, 60, "San Luis"],
  ["e2512", "p2509", "Comité de cabida normativa", "meeting", "2025-07-18", 11, 90, "Lima"],
  ["e2513", "p2509", "Entrega de expediente de especialidades", "delivery", "2025-12-05", 16, 60, "Oficina del cliente"],
  ["e2514", "p2510", "Visita de equipamiento clínico", "site_visit", "2025-10-17", 9, 120, "Pueblo Libre"],
  ["e2610", "p2608", "Coordinación técnica de laboratorio", "meeting", "2026-10-12", 11, 75, "San Borja"],
  ["e2611", "p2609", "Inspección de luminarias instaladas", "site_visit", "2026-10-14", 17, 60, "Jesús María"],
  ["e2612", "p2610", "Presentación de diseño de cafetería", "delivery", "2026-10-23", 16, 60, "Miraflores"],
  ["e2613", "p2611", "Taller con docentes y bibliotecaria", "meeting", "2026-11-06", 10, 90, "Ate"],
  ["e2614", "p2608", "Vencimiento de compatibilización", "deadline", "2026-12-18", 18, 30, "Oficina MWTRAZO"],
];

const paymentSpecs = [
  ["pay2401", "p2401", "Adelanto de diseño", 27200, "2024-01-19", "paid"],
  ["pay2402", "p2402", "Saldo por entrega de expediente", 31500, "2024-08-16", "paid"],
  ["pay2501", "p2501", "Cuota de anteproyecto", 29800, "2025-04-04", "paid"],
  ["pay2502", "p2502", "Pago por compatibilización", 24720, "2025-06-20", "paid"],
  ["pay2503", "p2503", "Valorización de diseño ejecutivo", 46500, "2025-12-12", "paid"],
  ["pay2601", "p2601", "Segunda cuota de remodelación", 17280, "2026-08-28", "paid"],
  ["pay2602", "p2602", "Cuota de desarrollo de diseño", 33600, "2026-10-15", "pending"],
  ["pay2603", "p2606", "Adelanto de expediente", 24900, "2026-09-30", "overdue"],
  ["pay2604", "p2607", "Pago por ingreso municipal", 14600, "2026-11-06", "pending"],
  ["pay2403", "p2405", "Cuota de diseño interior", 11760, "2024-04-05", "paid"],
  ["pay2404", "p2406", "Adelanto de remodelación", 16720, "2024-04-12", "paid"],
  ["pay2405", "p2408", "Cuota por anteproyecto cultural", 21960, "2024-10-04", "paid"],
  ["pay2504", "p2507", "Valorización de implementación", 27480, "2025-07-18", "paid"],
  ["pay2505", "p2509", "Cuota de expediente multifamiliar", 61200, "2025-12-19", "paid"],
  ["pay2605", "p2608", "Cuota de compatibilización técnica", 25920, "2026-10-30", "pending"],
  ["pay2606", "p2610", "Adelanto de diseño comercial", 15560, "2026-11-20", "pending"],
];

const expenseSpecs = [
  ["exp2401", "p2401", "Impresiones y muestras de acabados", 1850, "2024-04-12"],
  ["exp2402", "p2403", "Levantamiento topográfico", 2400, "2024-06-07"],
  ["exp2501", "p2502", "Consultoría de instalaciones sanitarias", 4200, "2025-04-18"],
  ["exp2502", "p2503", "Modelado y coordinación BIM", 6850, "2025-08-29"],
  ["exp2503", "p2505", "Tasas y copias de expediente", 1960, "2025-10-10"],
  ["exp2601", "p2602", "Muestras de mobiliario corporativo", 3280, "2026-08-14"],
  ["exp2602", "p2604", "Inspección de especialista en patrimonio", 5600, "2026-09-11"],
  ["exp2603", "p2606", "Estudio de seguridad y evacuación", 4750, "2026-10-02"],
  ["exp2403", "p2406", "Muestras de mobiliario de oficina", 2150, "2024-06-14"],
  ["exp2404", "p2408", "Consultoría de acondicionamiento acústico", 3900, "2024-10-25"],
  ["exp2504", "p2507", "Producción de prototipo de exhibidor", 2860, "2025-05-23"],
  ["exp2505", "p2509", "Estudio de impacto vial preliminar", 7300, "2025-09-12"],
  ["exp2604", "p2608", "Consultoría de instalaciones especiales", 6450, "2026-09-25"],
];

function seededYearCounts() {
  const count = (rows, yearAt) => Object.fromEntries([2024, 2025, 2026].map((year) => [year, rows.filter((row) => yearAt(row) === year).length]));
  const modules = {
    clients: count(clientSpecs, (row) => row[1]),
    projects: count(projectSpecs, (row) => row.year),
    tasks: count(taskSpecs, (row) => Number(row[5].slice(0, 4))),
    events: count(eventSpecs, (row) => Number(row[4].slice(0, 4))),
    finances: count([...paymentSpecs, ...expenseSpecs], (row) => Number(row[4].slice(0, 4))),
  };
  const totals = Object.fromEntries([2024, 2025, 2026].map((year) => [year, Object.values(modules).reduce((sum, values) => sum + values[year], 0)]));
  return { modules, totals };
}

async function selectAll(client, table, columns) {
  const { data, error } = await client.from(table).select(columns);
  if (error) throw new Error(`No se pudo consultar ${table}: ${error.message}`);
  return data;
}

function groupByYear(rows, getDate) {
  const counts = { 2024: 0, 2025: 0, 2026: 0, other: 0 };
  for (const row of rows) {
    const value = getDate(row);
    const year = value ? Number(String(value).slice(0, 4)) : 0;
    if (year in counts) counts[year] += 1;
    else counts.other += 1;
  }
  return counts;
}

async function audit(client) {
  const [clients, projects, tasks, events, payments, expenses] = await Promise.all([
    selectAll(client, "clients", "id,name,created_at"),
    selectAll(client, "projects", "id,name,code,status,due_date,start_date,created_at"),
    selectAll(client, "tasks", "id,title,status,due_date,start_date,created_at"),
    selectAll(client, "events", "id,title,start_at,created_at"),
    selectAll(client, "project_payments", "id,concept,status,due_date,created_at"),
    selectAll(client, "project_expenses", "id,concept,expense_date,created_at"),
  ]);
  const summary = {
    clients: { total: clients.length, years: groupByYear(clients, (row) => row.created_at) },
    projects: { total: projects.length, years: groupByYear(projects, (row) => row.start_date ?? row.created_at) },
    tasks: { total: tasks.length, years: groupByYear(tasks, (row) => row.start_date ?? row.created_at) },
    events: { total: events.length, years: groupByYear(events, (row) => row.start_at ?? row.created_at) },
    payments: { total: payments.length, years: groupByYear(payments, (row) => row.due_date ?? row.created_at) },
    expenses: { total: expenses.length, years: groupByYear(expenses, (row) => row.expense_date ?? row.created_at) },
  };
  console.log(JSON.stringify(summary, null, 2));
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const weekEnd = new Date(now.getTime() + 7 * 86400000).toISOString();
  const indicators = {
    activeProjects: projects.filter((project) => project.status === "active").length,
    pendingTasks: tasks.filter((task) => task.status !== "completed").length,
    overdueTasks: tasks.filter((task) => task.status !== "completed" && task.due_date && task.due_date < today).length,
    futureEvents: events.filter((event) => event.start_at >= now.toISOString()).length,
    eventsNextSevenDays: events.filter((event) => event.start_at >= now.toISOString() && event.start_at <= weekEnd).length,
    pendingPayments: payments.filter((payment) => payment.status === "pending" && (!payment.due_date || payment.due_date >= today)).length,
    overduePayments: payments.filter((payment) => payment.status === "overdue" || (payment.status === "pending" && payment.due_date && payment.due_date < today)).length,
  };
  console.log("Indicadores operativos actuales:");
  console.log(JSON.stringify(indicators, null, 2));
  return summary;
}

async function auditIntegrity(admin) {
  const { data: clients, error: clientError } = await admin.from("clients").select("id,email,phone");
  if (clientError) throw new Error(`No se pudieron validar los contactos: ${clientError.message}`);
  const { data: supportProfiles, error: profileError } = await admin.from("profiles").select("id,full_name").ilike("full_name", "%soporte%");
  if (profileError) throw new Error(`No se pudo validar el usuario Soporte: ${profileError.message}`);
  const supportIds = supportProfiles.filter(isSupportProfile).map((profile) => profile.id);
  const seedProjectIds = projectSpecs.map((project) => demoId(`project:${project.key}`));
  const seedTaskIds = taskSpecs.map(([key]) => demoId(`task:${key}`));
  const seedEventIds = eventSpecs.map(([key]) => demoId(`event:${key}`));
  let supportProjectMemberships = 0;
  let supportTaskAssignments = 0;
  let supportEventAssignments = 0;
  let supportNotifications = 0;
  if (supportIds.length > 0) {
    const [members, tasks, events, notifications] = await Promise.all([
      admin.from("project_members").select("project_id", { count: "exact", head: true }).in("project_id", seedProjectIds).in("user_id", supportIds),
      admin.from("tasks").select("id", { count: "exact", head: true }).in("id", seedTaskIds).in("assigned_to", supportIds),
      admin.from("events").select("id", { count: "exact", head: true }).in("id", seedEventIds).in("assigned_to", supportIds),
      admin.from("notifications").select("id", { count: "exact", head: true }).in("entity_id", [...seedTaskIds, ...seedEventIds]).in("user_id", supportIds),
    ]);
    if (members.error || tasks.error || events.error || notifications.error) throw new Error("No se pudo verificar la exclusión del usuario Soporte.");
    supportProjectMemberships = members.count ?? 0;
    supportTaskAssignments = tasks.count ?? 0;
    supportEventAssignments = events.count ?? 0;
    supportNotifications = notifications.count ?? 0;
  }
  const result = {
    clientsMissingEmail: clients.filter((client) => !client.email).length,
    clientsMissingPhone: clients.filter((client) => !client.phone).length,
    supportProjectMemberships,
    supportTaskAssignments,
    supportEventAssignments,
    supportNotifications,
  };
  console.log("Integridad de contactos y asignaciones:");
  console.log(JSON.stringify(result, null, 2));
  return result;
}

async function insertMissing(client, table, rows) {
  if (rows.length === 0) return 0;
  const ids = rows.map((row) => row.id);
  const { data: existing, error: selectError } = await client.from(table).select("id").in("id", ids);
  if (selectError) throw new Error(`No se pudo comprobar ${table}: ${selectError.message}`);
  const existingIds = new Set(existing.map((row) => row.id));
  const missing = rows.filter((row) => !existingIds.has(row.id));
  if (missing.length === 0) return 0;
  const { error } = await client.from(table).insert(missing);
  if (error) throw new Error(`No se pudo insertar en ${table}: ${error.message}`);
  return missing.length;
}

function isSupportProfile(profile) {
  return /(^|\s)soporte(\s|$)/i.test(profile.full_name.trim());
}

async function fillMissingClientContacts(admin) {
  const { data: clients, error } = await admin.from("clients").select("id,name,email,phone");
  if (error) throw new Error(`No se pudieron consultar los contactos de clientes: ${error.message}`);
  let updated = 0;
  for (const client of clients) {
    if (client.email && client.phone) continue;
    const slug = client.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");
    const numeric = String(Number.parseInt(createHash("sha256").update(client.id).digest("hex").slice(0, 8), 16) % 100000000).padStart(8, "0");
    const values = {
      email: client.email ?? `${slug}.${client.id.slice(0, 4)}@example.test`,
      phone: client.phone ?? `9${numeric}`,
    };
    const { error: updateError } = await admin.from("clients").update(values).eq("id", client.id);
    if (updateError) throw new Error(`No se pudo completar el contacto de ${client.name}: ${updateError.message}`);
    updated += 1;
  }
  return updated;
}

async function authenticateAdmin(client, admin) {
  const email = process.env.MWTRAZO_ADMIN_EMAIL;
  const password = process.env.MWTRAZO_ADMIN_PASSWORD;
  if (email && password) {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (!error && data.user) {
      const { data: profile } = await admin.from("profiles").select("full_name,role,is_active").eq("id", data.user.id).maybeSingle();
      if (profile?.role === "admin" && profile.is_active && !isSupportProfile(profile)) return data.user;
      await client.auth.signOut();
    }
  }

  const { data: adminProfiles, error: profilesError } = await admin
    .from("profiles")
    .select("id,full_name")
    .eq("role", "admin")
    .eq("is_active", true);
  if (profilesError || adminProfiles.length === 0) throw new Error("No existe un administrador activo para ejecutar la carga.");
  const selectedAdmin = adminProfiles.find((profile) => !isSupportProfile(profile));
  if (!selectedAdmin) throw new Error("No existe un administrador operativo distinto del usuario Soporte.");
  const adminId = selectedAdmin.id;
  const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const authUser = usersData?.users.find((user) => user.id === adminId);
  if (usersError || !authUser?.email) throw new Error("No se encontró la identidad Auth del administrador activo.");
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email: authUser.email });
  const tokenHash = linkData?.properties?.hashed_token;
  if (linkError || !tokenHash) throw new Error("No fue posible crear una sesión administrativa temporal.");
  const { data, error } = await client.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
  if (error || !data.user) throw new Error("No fue posible autenticar la sesión administrativa temporal.");
  return data.user;
}

async function main() {
  const url = process.env.SUPABASE_URL ?? requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const publishableKey = requiredEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  const secretKey = requiredEnv("SUPABASE_SECRET_KEY");
  const client = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const authUser = await authenticateAdmin(client, admin);

  console.log("Estado actual por módulo y año:");
  await audit(client);
  await auditIntegrity(admin);
  const expected = seededYearCounts();
  console.log("Distribución de la carga ficticia:");
  console.log(JSON.stringify(expected, null, 2));
  if (!APPLY) {
    console.log("Auditoría terminada. Ejecuta con --apply para insertar la carga ficticia.");
    return;
  }

  const { data: profiles, error: profilesError } = await client.from("profiles").select("id,full_name,is_active").eq("is_active", true).order("full_name");
  if (profilesError || profiles.length === 0) throw new Error("No hay perfiles activos para asignar los registros.");
  const adminId = authUser.id;
  const supportIds = profiles.filter(isSupportProfile).map((profile) => profile.id);
  const assigneeIds = profiles.filter((profile) => !isSupportProfile(profile)).map((profile) => profile.id);
  if (assigneeIds.length === 0) throw new Error("No hay usuarios operativos disponibles para asignar proyectos, tareas y eventos.");
  const clientIds = new Map(clientSpecs.map(([key]) => [key, demoId(`client:${key}`)]));
  const projectIds = new Map(projectSpecs.map(({ key }) => [key, demoId(`project:${key}`)]));
  const phaseOrder = ["Contacto inicial", "Propuesta", "Contrato", "Levantamiento", "Anteproyecto", "Desarrollo", "Expediente", "Ejecución", "Entrega"];

  const clientRows = clientSpecs.map(([key, year, name, documentType, documentNumber, company, clientEmail, phone, district], index) => ({
    id: clientIds.get(key), name, document_type: documentType, document_number: documentNumber, company,
    email: clientEmail, phone, address: `Av. Principal ${120 + index}, ${district}`, district, city: "Lima",
    notes: "Cliente ficticio generado para demostración y validación del dashboard.", created_by: adminId,
    created_at: iso(`${year}-${String((index % 9) + 1).padStart(2, "0")}-${String((index % 18) + 3).padStart(2, "0")}`),
    updated_at: iso(`${year}-${String((index % 9) + 1).padStart(2, "0")}-${String((index % 18) + 3).padStart(2, "0")}`),
  }));
  const inserted = {};
  inserted.clients = await insertMissing(admin, "clients", clientRows);
  inserted.clientContactsCompleted = await fillMissingClientContacts(admin);

  const projectRows = projectSpecs.map((project) => {
    const currentIndex = phaseOrder.indexOf(project.phase);
    const progress = project.status === "completed" ? 100 : Math.round((currentIndex * 100 + project.phaseProgress) / phaseOrder.length);
    return {
      id: projectIds.get(project.key), client_id: clientIds.get(project.client), name: project.name, code: project.code,
      description: `Proyecto ficticio de ${project.type.toLowerCase()} para mostrar planificación, seguimiento y resultados del estudio.`,
      project_type: project.type, service_type: project.service, address: `Zona urbana de ${project.district}`,
      district: project.district, city: "Lima", area_m2: project.area, status: project.status, phase: project.phase,
      start_date: project.start, due_date: project.due, progress, fee: project.fee, cover_image: null,
      created_by: adminId, created_at: iso(plusDays(project.start, -7)), updated_at: iso(project.start),
    };
  });
  inserted.projects = await insertMissing(admin, "projects", projectRows);

  const { data: phaseRows, error: phaseError } = await admin.from("project_phases").select("project_id,phase_template_id,name").in("project_id", [...projectIds.values()]);
  if (phaseError) throw new Error(`No se pudieron consultar las fases: ${phaseError.message}`);
  for (const project of projectSpecs) {
    const projectId = projectIds.get(project.key);
    const snapshots = phaseRows.filter((phase) => phase.project_id === projectId);
    const currentIndex = phaseOrder.indexOf(project.phase);
    const phaseUpdates = snapshots.map((phase) => {
      const index = phaseOrder.indexOf(phase.name);
      const progress = project.status === "completed" || index < currentIndex ? 100 : index === currentIndex ? project.phaseProgress : 0;
      return {
        project_id: projectId, phase_template_id: phase.phase_template_id, name: phase.name,
        sort_order: (index + 1) * 10, is_active: true, progress, is_current: index === currentIndex,
        completed_at: progress === 100 ? iso(project.due) : null, updated_at: iso(project.start),
      };
    });
    if (phaseUpdates.length > 0) {
      const { error } = await admin.from("project_phases").upsert(phaseUpdates, { onConflict: "project_id,phase_template_id" });
      if (error) throw new Error(`No se pudieron ajustar fases de ${project.code}: ${error.message}`);
    }
  }

  const seedProjectIds = [...projectIds.values()];
  const { error: clearLeadError } = await admin.from("project_members").update({ is_lead: false }).in("project_id", seedProjectIds);
  if (clearLeadError) throw new Error(`No se pudieron normalizar responsables de proyectos: ${clearLeadError.message}`);
  if (supportIds.length > 0) {
    const { error: removeSupportError } = await admin.from("project_members").delete().in("project_id", seedProjectIds).in("user_id", supportIds);
    if (removeSupportError) throw new Error(`No se pudo retirar a Soporte de los proyectos ficticios: ${removeSupportError.message}`);
  }
  const memberships = projectSpecs.flatMap((project, index) => {
    const lead = assigneeIds[index % assigneeIds.length];
    return assigneeIds.map((userId) => ({ project_id: projectIds.get(project.key), user_id: userId, participation_role: userId === lead ? "Responsable principal" : "Apoyo de proyecto", is_lead: userId === lead, created_at: iso(project.start) }));
  });
  const { error: memberError } = await admin.from("project_members").upsert(memberships, { onConflict: "project_id,user_id" });
  if (memberError) throw new Error(`No se pudieron asignar miembros: ${memberError.message}`);

  const taskRows = taskSpecs.map(([key, projectKey, title, status, priority, startDate, dueDate], index) => ({
    id: demoId(`task:${key}`), project_id: projectIds.get(projectKey), title,
    description: "Actividad ficticia de coordinación y seguimiento del proyecto.", assigned_to: assigneeIds[index % assigneeIds.length],
    created_by: adminId, status, priority, start_date: startDate, due_date: dueDate,
    created_at: iso(plusDays(startDate, -3)), updated_at: iso(status === "completed" ? dueDate : startDate),
  }));
  inserted.tasks = await insertMissing(client, "tasks", taskRows);
  if (supportIds.length > 0) {
    for (const task of taskRows) {
      const { error } = await client.from("tasks").update({ assigned_to: task.assigned_to }).eq("id", task.id).in("assigned_to", supportIds);
      if (error) throw new Error(`No se pudo retirar a Soporte de la tarea ${task.title}: ${error.message}`);
    }
  }

  const projectByKey = new Map(projectSpecs.map((project) => [project.key, project]));
  const eventRows = eventSpecs.map(([key, projectKey, title, type, date, hour, duration, location], index) => {
    const start = new Date(`${date}T${String(hour).padStart(2, "0")}:00:00-05:00`);
    const end = new Date(start.getTime() + duration * 60000);
    const project = projectByKey.get(projectKey);
    return {
      id: demoId(`event:${key}`), project_id: projectIds.get(projectKey), client_id: clientIds.get(project.client), title,
      description: "Evento ficticio de la agenda operativa del estudio.", type, start_at: start.toISOString(), end_at: end.toISOString(),
      all_day: false, location, created_by: adminId, assigned_to: assigneeIds[(index + 1) % assigneeIds.length],
      created_at: iso(plusDays(date, -7)), updated_at: iso(plusDays(date, -7)),
    };
  });
  inserted.events = await insertMissing(client, "events", eventRows);
  if (supportIds.length > 0) {
    for (const event of eventRows) {
      const { error } = await client.from("events").update({ assigned_to: event.assigned_to }).eq("id", event.id).in("assigned_to", supportIds);
      if (error) throw new Error(`No se pudo retirar a Soporte del evento ${event.title}: ${error.message}`);
    }
  }

  const paymentRows = paymentSpecs.map(([key, projectKey, concept, amount, dueDate, status]) => ({
    id: demoId(`payment:${key}`), project_id: projectIds.get(projectKey), concept, amount, due_date: dueDate,
    paid_at: status === "paid" ? iso(plusDays(dueDate, -1)) : null, status,
    notes: "Movimiento ficticio generado para demostración financiera.", created_by: adminId,
    created_at: iso(plusDays(dueDate, -21)), updated_at: iso(status === "paid" ? dueDate : plusDays(dueDate, -21)),
  }));
  inserted.payments = await insertMissing(client, "project_payments", paymentRows);

  const expenseRows = expenseSpecs.map(([key, projectKey, concept, amount, expenseDate]) => ({
    id: demoId(`expense:${key}`), project_id: projectIds.get(projectKey), concept, amount, expense_date: expenseDate,
    notes: "Gasto ficticio generado para demostración financiera.", created_by: adminId,
    created_at: iso(expenseDate), updated_at: iso(expenseDate),
  }));
  inserted.expenses = await insertMissing(client, "project_expenses", expenseRows);

  const sourceDates = new Map([
    ...clientRows.map((row) => [row.id, row.created_at]), ...projectRows.map((row) => [row.id, row.created_at]),
    ...taskRows.map((row) => [row.id, row.created_at]), ...eventRows.map((row) => [row.id, row.created_at]),
    ...paymentRows.map((row) => [row.id, row.created_at]),
  ]);
  const entityIds = [...sourceDates.keys()];
  const { data: logs, error: logsError } = await admin.from("activity_logs").select("id,entity_id").in("entity_id", entityIds);
  if (!logsError) {
    for (const log of logs) {
      const createdAt = sourceDates.get(log.entity_id);
      if (createdAt) await admin.from("activity_logs").update({ created_at: createdAt }).eq("id", log.id);
    }
  }
  const notificationSources = new Map([...taskRows, ...eventRows].map((row) => [row.id, row]));
  const { data: notifications, error: notificationsError } = await admin.from("notifications").select("id,entity_id").in("entity_id", [...notificationSources.keys()]);
  if (!notificationsError) {
    for (const notification of notifications) {
      const source = notificationSources.get(notification.entity_id);
      if (!source) continue;
      const referenceDate = "due_date" in source ? source.due_date : source.start_at;
      const isPast = new Date(referenceDate).getTime() < Date.now();
      await admin.from("notifications").update({ created_at: source.created_at, read_at: isPast ? source.updated_at : null }).eq("id", notification.id);
    }
  }
  if (supportIds.length > 0) {
    await admin.from("notifications").delete().in("entity_id", [...notificationSources.keys()]).in("user_id", supportIds);
  }

  console.log("Registros nuevos insertados:");
  console.log(JSON.stringify(inserted, null, 2));
  console.log("Estado final por módulo y año:");
  await audit(client);
  await auditIntegrity(admin);
  await client.auth.signOut();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

export type BloodType =
  | 'O_POSITIVE' | 'O_NEGATIVE'
  | 'A_POSITIVE' | 'A_NEGATIVE'
  | 'B_POSITIVE' | 'B_NEGATIVE'
  | 'AB_POSITIVE' | 'AB_NEGATIVE'

export type ComponentType = 'WHOLE_BLOOD' | 'PLATELETS' | 'PLASMA'
export type UrgencyLevel = 'NORMAL' | 'ALTA' | 'CRITICA'

export const BLOOD_LABELS: Record<BloodType, string> = {
  O_POSITIVE: 'O+', O_NEGATIVE: 'O-',
  A_POSITIVE: 'A+', A_NEGATIVE: 'A-',
  B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-',
}

export const COMPONENT_LABELS: Record<ComponentType, string> = {
  WHOLE_BLOOD: 'Sangre Entera',
  PLATELETS: 'Plaquetas',
  PLASMA: 'Plasma',
}

// LatAm/Caribe demographics (Rh+ 93%, Rh- 7%)
export const DEMOGRAPHICS: Record<BloodType, number> = {
  O_POSITIVE:  0.55,
  A_POSITIVE:  0.26,
  B_POSITIVE:  0.10,
  AB_POSITIVE: 0.03,
  O_NEGATIVE:  0.04,
  A_NEGATIVE:  0.015,
  B_NEGATIVE:  0.005,
  AB_NEGATIVE: 0.002,
}

// RBC + Platelets: patient blood type → acceptable donor types (priority order)
const GR_COMPAT: Record<BloodType, BloodType[]> = {
  O_NEGATIVE:  ['O_NEGATIVE'],
  O_POSITIVE:  ['O_POSITIVE', 'O_NEGATIVE'],
  A_NEGATIVE:  ['A_NEGATIVE', 'O_NEGATIVE'],
  A_POSITIVE:  ['A_POSITIVE', 'A_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'],
  B_NEGATIVE:  ['B_NEGATIVE', 'O_NEGATIVE'],
  B_POSITIVE:  ['B_POSITIVE', 'B_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'],
  AB_NEGATIVE: ['AB_NEGATIVE', 'A_NEGATIVE', 'B_NEGATIVE', 'O_NEGATIVE'],
  AB_POSITIVE: ['AB_POSITIVE', 'AB_NEGATIVE', 'A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'],
}

// Plasma: inverted ABO rules — patient blood type → acceptable donor types
const PLASMA_COMPAT: Record<BloodType, BloodType[]> = {
  O_NEGATIVE:  ['O_NEGATIVE', 'O_POSITIVE'],
  O_POSITIVE:  ['O_POSITIVE', 'O_NEGATIVE'],
  A_NEGATIVE:  ['A_NEGATIVE', 'A_POSITIVE', 'AB_NEGATIVE', 'AB_POSITIVE'],
  A_POSITIVE:  ['A_POSITIVE', 'A_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE'],
  B_NEGATIVE:  ['B_NEGATIVE', 'B_POSITIVE', 'AB_NEGATIVE', 'AB_POSITIVE'],
  B_POSITIVE:  ['B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE'],
  AB_NEGATIVE: ['AB_NEGATIVE', 'AB_POSITIVE'],
  AB_POSITIVE: ['AB_POSITIVE', 'AB_NEGATIVE'],
}

export function getCompatibleDonorTypes(patientBloodType: BloodType, component: ComponentType): BloodType[] {
  if (component === 'PLASMA') return PLASMA_COMPAT[patientBloodType] ?? []
  return GR_COMPAT[patientBloodType] ?? []
}

export function getRecommendedMethod(component: ComponentType): 'APHERESIS' | 'SANGRE_TOTAL' {
  return component === 'PLATELETS' ? 'APHERESIS' : 'SANGRE_TOTAL'
}

// Activar difusión prioritaria para grupos críticos y plaquetas (vida útil 5-7 días)
export function isUrgentCase(patientBloodType: BloodType, component: ComponentType): boolean {
  return patientBloodType.includes('NEGATIVE') || component === 'PLATELETS'
}

// Estimar alcance en la base de donantes
export function projectDonors(compatibleTypes: BloodType[], totalDonors: number, conversionRate = 0.12) {
  const fraction = compatibleTypes.reduce((s, t) => s + (DEMOGRAPHICS[t] ?? 0), 0)
  const estimated = Math.round(totalDonors * fraction)
  const responses = Math.round(estimated * conversionRate)
  return { estimated, responses, fraction }
}

// Genera template de mensaje de emergencia en español
export function buildMessageTemplate(
  patientBloodType: BloodType,
  component: ComponentType,
  urgency: UrgencyLevel,
  compatibleTypes: BloodType[],
): string {
  const prefix =
    urgency === 'CRITICA' ? '🚨 ALERTA CRÍTICA — Sanguis'
    : urgency === 'ALTA'   ? '⚠️ Alerta urgente — Sanguis'
    :                        'Convocatoria — Sanguis'
  const componentLabel = COMPONENT_LABELS[component].toLowerCase()
  const patientLabel = BLOOD_LABELS[patientBloodType]
  const compatLabels = compatibleTypes.slice(0, 4).map(t => BLOOD_LABELS[t]).join(', ')
  return `${prefix}: necesitamos ${componentLabel} para paciente tipo ${patientLabel}. Tu sangre (${compatLabels}) es compatible. ¿Puedes donar hoy? Contáctanos al regresar este mensaje.`
}

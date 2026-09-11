export type BloodType =
  | 'O_POSITIVE' | 'O_NEGATIVE'
  | 'A_POSITIVE' | 'A_NEGATIVE'
  | 'B_POSITIVE' | 'B_NEGATIVE'
  | 'AB_POSITIVE' | 'AB_NEGATIVE'

export const BLOOD_LABELS: Record<BloodType, string> = {
  O_POSITIVE: 'O+', O_NEGATIVE: 'O-',
  A_POSITIVE: 'A+', A_NEGATIVE: 'A-',
  B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-',
}

export const BLOOD_TYPES: BloodType[] = [
  'O_POSITIVE', 'O_NEGATIVE', 'A_POSITIVE', 'A_NEGATIVE',
  'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE',
]

export interface Donor {
  id: string
  name: string
  email: string
  phone: string
  idNumber: string
  bloodType: BloodType
  pointsBalance: number
  category: 'CASUAL' | 'RECURRENT' | 'VIP'
  referralCode: string
  lastDonationDate: string | null
  isActive: boolean
  city: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  appointments?: Appointment[]
}

export type ProductType = 'WHOLE_BLOOD' | 'PLATELETS' | 'PLASMA'

export const PRODUCT_LABELS: Record<ProductType, string> = {
  WHOLE_BLOOD: 'Sangre completa', PLATELETS: 'Plaquetas', PLASMA: 'Plasma',
}

export const PRODUCT_TYPES: ProductType[] = ['WHOLE_BLOOD', 'PLATELETS', 'PLASMA']

export interface BloodUnit {
  id: string
  productType: string
  collectionDate: string
  status: string
  bloodType: BloodType
  volumeMl: number
}

export interface DonationEvent {
  id: string
  name: string
  type: string
  description: string | null
  startDatetime: string
  endDatetime: string
  locationAddress: string
  capacity: number
  registeredCount: number
  status: string
}

export interface Appointment {
  id: string
  eventId: string
  scheduledTime: string
  productType: ProductType
  status: 'SCHEDULED' | 'CHECKED_IN' | 'CANCELLED' | 'NO_SHOW' | 'COMPLETED'
  qrCode: string
  event?: DonationEvent
}

export interface Partner {
  id: string
  name: string
  category: string
  address: string | null
  availableRewards: { name: string; points: number }[] | null
  isActive: boolean
}

export interface PointTransaction {
  id: string
  type: string
  points: number
  balanceAfter: number
  description: string | null
  createdAt: string
}

export interface Notification {
  id: string
  type: string
  subject: string | null
  body: string
  status: string
  createdAt: string
}

export interface TestResult {
  id: string
  testType: string
  result: string
  conductedAt: string
  notes: string | null
}

export type RootStackParamList = {
  Login: undefined
  Register: undefined
  MainTabs: undefined
  EventDetail: { id: string; name: string }
  BookAppointment: { eventId: string; eventName: string }
  Notifications: undefined
  Settings: undefined
  TestResults: undefined
  BloodTracker: undefined
}

export type TabParamList = {
  Home: undefined
  Donations: undefined
  Events: undefined
  Rewards: undefined
  Profile: undefined
}

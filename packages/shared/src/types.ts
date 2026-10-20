import {
  RoleName,
  PermissionCode,
  PropertyStatus,
  PropertyType,
  ProjectStatus,
  BookingStatus,
  ContractStatus,
  InstallmentStatus,
  PaymentMethod,
  PaymentVerificationStatus,
  AccountType,
  ExpenseStatus,
  CommissionStatus,
  Currency,
} from './enums';

export interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  isActive: boolean;
  role: RoleName;
  permissions: PermissionCode[];
}

export interface ProjectSummary {
  id: string;
  code: string;
  name: string;
  status: ProjectStatus;
  location: string;
  province: string;
  totalArea: number;
  totalUnits: number;
  availableUnits: number;
  soldUnits: number;
  reservedUnits: number;
  currency: Currency;
}

export interface PropertySummary {
  id: string;
  code: string;
  projectId: string;
  projectName?: string;
  type: PropertyType;
  title: string;
  status: PropertyStatus;
  block?: string;
  floor?: number;
  unitNumber?: string;
  landArea: number;
  buildingArea: number;
  bedrooms: number;
  bathrooms: number;
  listingPrice: number;
  sellingPrice: number;
  reservationAmount: number;
  svgShapeId?: string;
}

export interface MasterPlanShape {
  id: string;
  propertyId?: string;
  shapeType: 'polygon' | 'rect' | 'circle' | 'path';
  coordinates: string; // SVG path or points or x,y,w,h
  label: string;
  status: PropertyStatus;
  price?: number;
  area?: number;
}

export interface CustomerSummary {
  id: string;
  fullName: string;
  khmerName?: string;
  phone: string;
  email?: string;
  idNumber?: string;
  customerType: string;
  totalBookings: number;
  totalContracts: number;
  activeContracts: number;
}

export interface InstallmentScheduleRow {
  installmentNumber: number;
  dueDate: string;
  scheduledAmount: number;
  amountPaid: number;
  outstandingAmount: number;
  latePenalty: number;
  status: InstallmentStatus;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

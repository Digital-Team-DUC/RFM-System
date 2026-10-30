export interface PropertySummary {
  id: string;
  code: string;
  title: string;
  unitNumber: string;
  status: 'AVAILABLE' | 'RESERVED' | 'INSTALLMENT' | 'SOLD' | 'BLOCKED' | 'UNDER_DEVELOPMENT';
  propertyType: string;
  sellingPrice: number;
  landArea: number;
  buildingArea: number;
  bedrooms: number;
  bathrooms: number;
  facingDirection?: string;
  block?: string;
  zone?: string;
  notes?: string;
}

export interface MasterPlanShapeData {
  id: string;
  assetId: string;
  propertyId?: string | null;
  shapeType: 'path' | 'rect' | 'polygon' | 'circle' | 'road' | 'boulevard' | 'street' | 'park' | 'water' | 'amenity' | string;
  coordinates: string;
  label: string;
  colorCode?: string;
  status: string;
  property?: PropertySummary | null;
}

export interface MasterPlanAssetData {
  id: string;
  projectId: string;
  title: string;
  fileUrl?: string | null;
  svgContent?: string | null;
  width: number;
  height: number;
  shapes?: MasterPlanShapeData[];
  _count?: {
    shapes: number;
  };
}

export type EditorTool =
  | 'select'
  | 'drawRect'
  | 'drawPolygon'
  | 'drawRoad'
  | 'drawPark'
  | 'drawWater'
  | 'drawAmenity';

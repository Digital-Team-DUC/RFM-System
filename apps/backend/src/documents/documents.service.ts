import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDocuments(entityType?: string, entityId?: string) {
    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    return this.prisma.documentMetadata.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async recordDocument(data: {
    entityType: string;
    entityId: string;
    fileName: string;
    fileKey: string;
    fileUrl: string;
    mimeType: string;
    fileSize: number;
    isConfidential?: boolean;
    organizationId: string;
    uploadedById?: string;
  }) {
    return this.prisma.documentMetadata.create({
      data: {
        organizationId: data.organizationId,
        entityType: data.entityType,
        entityId: data.entityId,
        fileName: data.fileName,
        fileKey: data.fileKey,
        fileUrl: data.fileUrl,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        isConfidential: data.isConfidential || false,
        uploadedById: data.uploadedById,
      },
    });
  }
}

import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Document Management')
@Controller('documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: 'List document metadata by entity' })
  async getDocuments(
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string
  ) {
    return this.documentsService.getDocuments(entityType, entityId);
  }

  @Post()
  @ApiOperation({ summary: 'Record uploaded document metadata' })
  async recordDocument(@Body() body: any, @Req() req: any) {
    return this.documentsService.recordDocument({
      ...body,
      organizationId: req.user.organizationId,
      uploadedById: req.user.userId,
    });
  }
}

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { DocumentsService } from './documents.service';
import { DocumentType } from '@prisma/client';

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        type: { type: 'string', enum: ['INVOICE', 'RECEIPT', 'STATEMENT', 'OTHER'] },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type?: DocumentType,
  ) {
    return this.documentsService.upload(req.user.userId, file, type);
  }

  @Get()
  async findAll(@Req() req: any) {
    return this.documentsService.findAll(req.user.userId);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.documentsService.findOne(req.user.userId, id);
  }

  @Delete(':id')
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.documentsService.delete(req.user.userId, id);
  }

  @Post(':id/ocr')
  async runOcr(@Req() req: any, @Param('id') id: string) {
    return this.documentsService.runOcr(req.user.userId, id);
  }
}

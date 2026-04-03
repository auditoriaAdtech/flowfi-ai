import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

interface CreateDocumentDto {
  type?: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

@Injectable()
export class DocumentsService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  constructor(private readonly prisma: PrismaService) {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async upload(
    userId: string,
    file: Express.Multer.File,
    type?: DocumentType,
  ) {
    const userDir = path.join(this.uploadsDir, userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const uniqueName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(userDir, uniqueName);
    fs.writeFileSync(filePath, file.buffer);

    const fileUrl = `/uploads/${userId}/${uniqueName}`;

    return this.prisma.document.create({
      data: {
        userId,
        type: type ?? DocumentType.OTHER,
        fileName: file.originalname,
        fileUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.document.findMany({
      where: { userId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    if (doc.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return doc;
  }

  async delete(userId: string, id: string) {
    const doc = await this.findOne(userId, id);

    const fullPath = path.join(process.cwd(), doc.fileUrl);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    return this.prisma.document.delete({ where: { id } });
  }

  async runOcr(userId: string, id: string) {
    const doc = await this.findOne(userId, id);

    const ocrData = this.generateMockOcrData(doc.type, doc.fileName);

    return this.prisma.document.update({
      where: { id },
      data: {
        ocrData,
        classification: doc.type,
      },
    });
  }

  private generateMockOcrData(
    type: DocumentType,
    fileName: string,
  ): Record<string, any> {
    switch (type) {
      case DocumentType.INVOICE:
        return {
          amount: 1500.0,
          vendor: 'Electricity Co',
          date: '2024-01-15',
          category: 'utilities',
          invoiceNumber: 'INV-2024-00142',
          dueDate: '2024-02-15',
          items: [
            {
              description: 'Monthly electricity service',
              amount: 1350.0,
            },
            {
              description: 'Taxes and fees',
              amount: 150.0,
            },
          ],
          confidence: 0.94,
        };

      case DocumentType.RECEIPT:
        return {
          amount: 87.5,
          vendor: 'SuperMarket Plus',
          date: '2024-01-20',
          category: 'groceries',
          paymentMethod: 'credit_card',
          items: [
            { description: 'Fresh produce', amount: 32.0 },
            { description: 'Dairy products', amount: 18.5 },
            { description: 'Household items', amount: 25.0 },
            { description: 'Beverages', amount: 12.0 },
          ],
          confidence: 0.91,
        };

      case DocumentType.STATEMENT:
        return {
          institution: 'National Bank',
          accountNumber: '****4521',
          statementPeriod: {
            start: '2024-01-01',
            end: '2024-01-31',
          },
          openingBalance: 5200.0,
          closingBalance: 4850.0,
          totalDeposits: 3200.0,
          totalWithdrawals: 3550.0,
          transactions: [
            {
              date: '2024-01-05',
              description: 'Salary deposit',
              amount: 3200.0,
              type: 'credit',
            },
            {
              date: '2024-01-10',
              description: 'Rent payment',
              amount: -1200.0,
              type: 'debit',
            },
            {
              date: '2024-01-15',
              description: 'Grocery store',
              amount: -250.0,
              type: 'debit',
            },
            {
              date: '2024-01-20',
              description: 'Insurance premium',
              amount: -450.0,
              type: 'debit',
            },
          ],
          confidence: 0.97,
        };

      default:
        return {
          rawText: `Extracted text from document: ${fileName}`,
          detectedType: 'unknown',
          possibleCategories: ['general', 'business', 'personal'],
          confidence: 0.72,
        };
    }
  }
}

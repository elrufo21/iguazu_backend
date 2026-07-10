import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BillingService } from './billing.service';
import { IssueCreditNoteDto, IssueFromSaleDto } from './dto/billing.dto';

@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /** Emite comprobante (factura/boleta) desde una venta pagada. */
  @Post('issue-from-sale/:saleId')
  issueFromSale(
    @Param('saleId', ParseIntPipe) saleId: number,
    @Body() dto: IssueFromSaleDto,
    @CurrentUser() user: any,
  ) {
    return this.billingService.issueFromSale(saleId, dto, user.sub);
  }

  /** Emite nota de crédito que anula un comprobante. */
  @Post(':id/credit-note')
  issueCreditNote(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: IssueCreditNoteDto,
    @CurrentUser() user: any,
  ) {
    return this.billingService.issueCreditNote(id, dto, user.sub);
  }

  @Get()
  findAll() {
    return this.billingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.billingService.findOne(id);
  }

  /** Descarga el PDF del comprobante (si fue generado). */
  @Get(':id/pdf')
  async downloadPdf(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const invoice = await this.billingService.findOne(id);
    if (!invoice?.pdfBase64) {
      return res.status(404).json({ message: 'El comprobante no tiene PDF generado.' });
    }
    const buffer = Buffer.from(invoice.pdfBase64, 'base64');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${invoice.docNumber}.pdf"`,
    );
    res.send(buffer);
  }
}

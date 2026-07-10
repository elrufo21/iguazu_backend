import { Injectable } from '@nestjs/common';
import { XmlSignature } from '@supernova-team/xml-sunat';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { BillingConfig } from '../billing.config';

/**
 * Firma el XML UBL con el certificado .pfx del emisor.
 * Porteo de api-rest-s7/src/services/xmlSigner.js adaptado a NestJS + ConfigService.
 */
@Injectable()
export class XmlSignerService {
  constructor(private readonly config: BillingConfig) {}

  /**
   * Devuelve el XML firmado (con ds:Signature insertado en UBLExtensions).
   */
  async sign(xml: string): Promise<string> {
    const { filePath, cleanup } = this.resolveCertificateFile();
    const password = this.config.certPassword;

    const sig = new XmlSignature(filePath, password, xml);
    const rootName = this.resolveRootName(xml);
    // signXpath es private en los tipos pero existe en runtime; acceso por cast.
    (sig as any).signXpath = `//*[local-name()='${rootName}']`;

    try {
      return await sig.getSignedXML();
    } catch (err) {
      throw new Error(`Error al firmar XML: ${(err as Error).message}`);
    } finally {
      if (cleanup && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

  private resolveCertificateFile(): { filePath: string; cleanup: boolean } {
    const base64 = this.config.certPfxBase64;
    if (base64) {
      const clean = base64.replace(/^data:.*;base64,/i, '').replace(/\s+/g, '');
      const buffer = Buffer.from(clean, 'base64');
      if (!buffer.length) {
        throw new Error('SUNAT_CERT_PFX_BASE64 es invalido o esta vacio.');
      }
      const tempPath = path.join(os.tmpdir(), `sunat-cert-${Date.now()}-${process.pid}.pfx`);
      fs.writeFileSync(tempPath, buffer);
      return { filePath: tempPath, cleanup: true };
    }

    const configuredPath = this.config.certPfxPath;
    const filePath = configuredPath || path.join('certificate', 'LLAMA-PE-CERTIFICADO-DEMO-20100100100.pfx');
    if (!fs.existsSync(filePath)) {
      throw new Error(
        `No se encontro el certificado en: ${filePath}. Define SUNAT_CERT_PFX_BASE64 o SUNAT_CERT_PFX_PATH.`,
      );
    }
    return { filePath, cleanup: false };
  }

  private resolveRootName(xml: string): string {
    const cleaned = String(xml).replace(/^\uFEFF/, '').trimStart();
    const match = cleaned.match(/^<\?xml[\s\S]*?\?>\s*<(?:(?:\w+):)?([\w.-]+)/i);
    if (match?.[1]) return match[1];
    const fallbackMatch = cleaned.match(/^<(?:(?:\w+):)?([\w.-]+)/i);
    return fallbackMatch?.[1] || 'Invoice';
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Datos del emisor y credenciales SUNAT.
 * Centraliza la lectura de .env para todo el módulo de facturación.
 */
@Injectable()
export class BillingConfig {
  constructor(private readonly config: ConfigService) {}

  get modo(): string {
    return this.config.get<string>('SUNAT_MODO') ?? 'beta';
  }

  get endpoint(): string {
    return (
      this.config.get<string>('SUNAT_ENDPOINT') ??
      'https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService'
    );
  }

  get usuario(): string {
    return this.config.getOrThrow<string>('SUNAT_USUARIO');
  }

  get clave(): string {
    return this.config.getOrThrow<string>('SUNAT_CLAVE');
  }

  get ruc(): string {
    return this.config.getOrThrow<string>('SUNAT_RUC');
  }

  get razonSocial(): string {
    return this.config.getOrThrow<string>('SUNAT_RAZON_SOCIAL');
  }

  get nombreComercial(): string {
    return this.config.get<string>('SUNAT_NOMBRE_COMERCIAL') ?? this.razonSocial;
  }

  get direccion(): string {
    return this.config.get<string>('SUNAT_DIRECCION') ?? '-';
  }

  get ubigeo(): string {
    return this.config.get<string>('SUNAT_UBIGEO') ?? '150101';
  }

  get ciudad(): string {
    return this.config.get<string>('SUNAT_CIUDAD') ?? 'LIMA';
  }

  get departamento(): string {
    return this.config.get<string>('SUNAT_DEPARTAMENTO') ?? 'LIMA';
  }

  get distrito(): string {
    return this.config.get<string>('SUNAT_DISTRITO') ?? 'LIMA';
  }

  /** Path al .pfx o null si se usa base64. */
  get certPfxPath(): string | null {
    const p = this.config.get<string>('SUNAT_CERT_PFX_PATH');
    return p && p.trim() ? p.trim() : null;
  }

  /** Base64 del .pfx o null si se usa path. */
  get certPfxBase64(): string | null {
    const b = this.config.get<string>('SUNAT_CERT_PFX_BASE64');
    return b && b.trim() ? b.trim() : null;
  }

  get certPassword(): string {
    return this.config.getOrThrow<string>('SUNAT_CERT_PASSWORD');
  }

  get emisor() {
    return {
      ruc: this.ruc,
      razonSocial: this.razonSocial,
      nombreComercial: this.nombreComercial,
      usuario_emisor: this.usuario,
      clave_emisor: this.clave,
      address: {
        ubigeo: this.ubigeo,
        addressTypeCode: '0001',
        cityName: this.ciudad,
        countrySubentity: this.departamento,
        district: this.distrito,
        line: this.direccion,
        countryCode: 'PE',
      },
    };
  }
}

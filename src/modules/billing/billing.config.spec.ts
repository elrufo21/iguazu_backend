import { BillingConfig } from './billing.config';

describe('BillingConfig', () => {
  it('rejects placeholder issuer address', () => {
    const config = new BillingConfig({
      get: jest.fn((key: string) => (key === 'SUNAT_DIRECCION' ? '-' : undefined)),
    } as any);

    expect(() => config.direccion).toThrow(
      'SUNAT_DIRECCION debe ser la direccion fiscal real',
    );
  });

  it('trims issuer address', () => {
    const config = new BillingConfig({
      get: jest.fn((key: string) =>
        key === 'SUNAT_DIRECCION' ? '  CALLE OCHO DE OCTUBRE 123  ' : undefined,
      ),
    } as any);

    expect(config.direccion).toBe('CALLE OCHO DE OCTUBRE 123');
  });
});

# Backend MVP Iguazú

## Arquitectura

Backend NestJS con módulos en `src/modules`, Prisma como acceso a PostgreSQL y JWT para proteger endpoints operativos. `PrismaModule` es global.

## Módulos implementados

- Auth, Users, Employees.
- PriceTypes, RoomTypes, RoomTypePrices, Rooms.
- CashShift, CashMovements, CashClosures.
- Customers, Reservations, Stays.
- Products, Inventory, Sales.
- Attendance, StaffAdvances, StaffPayments, StaffDiscounts.
- Audit mínimo manual.

## Reglas principales

- Todos los IDs son `Int`.
- No hay deletes físicos en el MVP.
- Caja: los movimientos de dinero pasan por `CashMovement`.
- Inventario: todo cambio de stock crea `InventoryMovement`.
- Habitación: `OCCUPIED` se controla desde check-in/check-out.
- Venta: pagos completos, total exacto y stock no negativo.

## Orden recomendado de pruebas

1. Crear usuario/login.
2. Abrir caja: `POST /cash-shift/open`.
3. Crear `price-types`, `room-types`, `room-type-prices`, `rooms`.
4. Crear clientes.
5. Crear productos y cargar stock con `POST /inventory/in`.
6. Check-in con `POST /stays/check-in`.
7. Vender con `POST /sales`.
8. Check-out con `PATCH /stays/:id/check-out`.
9. Cerrar caja con `POST /cash-closures/close`.

## Endpoints principales

- `GET /cash-movements`, `GET /cash-movements/:id`, `GET /cash-movements/by-shift/:cashShiftId`.
- `POST /customers`, `GET /customers`, `GET /customers/by-document`, `GET /customers/:id`, `PATCH /customers/:id`.
- `POST /stays/check-in`, `PATCH /stays/:id/check-out`, `GET /stays/active`, `GET /stays/history`.
- `POST /products`, `GET /products`, `PATCH /products/:id/toggle-active`.
- `POST /inventory/in`, `/out`, `/loss`, `/adjust`, `GET /inventory/movements`.
- `POST /sales`, `GET /sales`, `GET /sales/by-shift/:cashShiftId`.
- `POST /reservations`, `PATCH /reservations/:id/confirm`, `/cancel`, `/no-show`, `POST /reservations/:id/check-in`.
- `POST /attendance`, `PATCH /attendance/:id/check-in`, `/check-out`.
- `POST /staff-advances`, `POST /staff-payments`, `POST /staff-discounts`.
- `POST /cash-closures/close`, `GET /cash-closures`.

## Flujo de caja

1. Abrir caja con `POST /cash-shift/open`.
2. Ventas, adelantos, pagos, descuentos cobrados y depósitos crean `CashMovement`.
3. Cerrar con `POST /cash-closures/close`, enviando conteos por método de pago.

## Flujo de estadía

1. `POST /stays/check-in`: valida caja abierta, habitación disponible y tarifa configurada.
2. Cobro se hace por `POST /sales`, con detalle `ROOM_RENT`.
3. `PATCH /stays/:id/check-out`: cierra estadía y libera habitación.

## Flujo de inventario

- `IN` suma stock.
- `OUT` y `LOSS` restan stock.
- `ADJUSTMENT` es relativo: `quantity` positivo suma, negativo resta.
- Stock negativo se bloquea.

## Flujo de personal

- Asistencia: registrar día, entrada y salida.
- Adelantos: egreso de caja y `StaffAdvance`.
- Pagos: toma asistencias no pagadas del rango y crea `StaffPaymentAttendance`.
- Descuentos: puede crear ingreso de caja si `chargeNow = true`.

## Pendiente etapa 2

- Facturación electrónica.
- Notas de crédito.
- Reportes avanzados.
- Auditoría global más completa.
- Cancelación de ventas con reversa de caja e inventario.

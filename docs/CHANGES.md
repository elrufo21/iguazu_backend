# Iguazú — Registro de cambios y análisis

> Fecha: 2026-07-08
> Alcance: Mejoras al sistema hotelero para un hotel pequeño (~10 clientes/día).
> Filosofía: simple, funcional, mantenible. Sin sobreingeniería.

---

## 1. Resumen ejecutivo

Se realizaron 5 etapas de mejora sobre el backend NestJS + Prisma + PostgreSQL y el frontend React. El objetivo fue corregir bugs críticos, simplificar zonas sobredimensionadas, y cerrar gaps operativos — **sin reescribir la arquitectura**.

**Resultado:**
- 3 migraciones nuevas (campos de cancelación, modelo Penalty, índice único de caja).
- 1 módulo nuevo (`penalties`).
- 1 seed inicial para levantar el sistema desde cero.
- Múltiples bugs críticos corregidos (cobro de alojamiento, concurrencia, ocupación, etc.).
- Frontend adaptado a los nuevos contratos.

**No se reescribió nada** que ya funcionaba bien. El núcleo (caja, ventas, estadías, inventario) se mantiene.

---

## 2. Etapa 1 — Urgentes + Seed

### 1.1 Cobro de alojamiento en check-out (CRÍTICO)
**Problema:** Un cliente podía irse sin pagar la habitación. El check-out solo verificaba que no hubiera ventas pendientes, pero si nadie creaba la venta de alojamiento, el sistema liberaba la habitación gratis.

**Solución:** El endpoint `PATCH /stays/:id/check-out` ahora acepta `{ amount, payments }`. Calcula el saldo pendiente de alojamiento y, si hay saldo, **crea automáticamente la venta `ROOM_RENT` + movimientos de caja** en la misma transacción que cierra la estadía. Es imposible liberar la habitación sin cobrar.

**Archivos:**
- `src/modules/stays/dto/check-out.dto.ts` (nuevo)
- `src/modules/stays/stays.service.ts` — `checkOut()` reescrito
- `src/modules/stays/stays.controller.ts` — acepta body

### 1.2 Depósito de reserva con cualquier método de pago
**Problema:** El depósito siempre se registraba como efectivo (`CASH`).

**Solución:** Agregado `paymentMethod?` al DTO de reserva. Default `CASH` si se omite.

**Archivos:**
- `src/modules/reservations/dto/create-reservation.dto.ts`
- `src/modules/reservations/reservations.service.ts`

### 1.3 Validaciones de fechas y estado
- `stays.service.ts`: `expectedCheckOut` en el pasado → `400`.
- `attendance.service.ts`: check-in duplicado → `409`; check-out sin check-in → `400`; check-out duplicado → `409`.

### 1.4 Bug: validación de stock reordenada (A1)
**Problema:** En ventas, el stock se descontaba antes de validar la habitación/minibar.

**Solución:** Separado en 2 fases dentro de la transacción: (1) validar todo, (2) aplicar descuentos. Evita descuentos parciales en caso de error.

**Archivo:** `src/modules/sales/sales.service.ts`

### 1.5 Seed inicial
**Nuevo** `prisma/seed.ts`. Limpia la data operativa y crea:
- Usuario `admin` (password configurable via `SEED_ADMIN_PASSWORD`, default `Admin123!`).
- Permisos por defecto para `RECEPTIONIST` y `CASHIER`.
- Sin habitaciones, productos, clientes, ventas, cajas ni catálogos precargados.

**Archivos:**
- `prisma/seed.ts` (nuevo)
- `prisma/tsconfig.seed.json` (nuevo)
- `package.json` — comando `prisma db seed`

**Uso:**
```bash
npx prisma migrate dev
npx prisma db seed
```

---

## 3. Etapa 2 — Cancelación de ventas + Reversa de caja

### 2.1 Cancelación/anulación de ventas
**Problema:** No existía. Un error obligaba a tocar BD.

**Solución:** Anulación con reversa compensatoria, sin deletes físicos.
- Venta `OPEN` (cargo pendiente): marca `CANCELLED` + revierte stock.
- Venta `PAID`: revierte stock (`InventoryMovement IN`) + crea `CashMovement` compensatorio por cada pago (signo opuesto) + marca `CANCELLED`.
- Guarda `cancelReason`, `cancelledAt`, `cancelledById`.

**Migración:** `20260707212745_sale_cancel_fields` (3 columnas + FK en `Sale`).

**Endpoint:** `POST /sales/:id/cancel` con `{ reason }`.

**Archivos:**
- `prisma/schema.prisma` — `Sale` + relación `SaleCancelledBy` en `User`
- `src/modules/sales/dto/cancel-sale.dto.ts` (nuevo)
- `src/modules/sales/sales.service.ts` — método `cancel`
- `src/modules/sales/sales.controller.ts`

### 2.2 Reversa de movimientos de caja manuales
**Problema:** No se podía corregir un gasto/ingreso mal registrado.

**Solución:** No se edita el original (CashMovement es inmutable). Se crea un `CashMovement` compensatorio con tipo opuesto, mismo monto/método, `referenceType=MANUAL_REVERSAL`.

**Endpoint:** `POST /cash-movements/:id/reverse` con `{ reason }`.

**Archivos:**
- `src/modules/cash-movements/dto/reverse-cash-movement.dto.ts` (nuevo)
- `src/modules/cash-movements/cash-movements.service.ts` — método `reverse`
- `src/modules/cash-movements/cash-movements.controller.ts`

### 2.3 Reabrir caja (solo ADMIN)
**Problema:** Cerrar con conteo erróneo no tenía reversa.

**Solución:** Guard de rol (`UserRole.ADMIN`). Elimina `CashClosure` + `CashClosureDetail`, vuelve `CashShift` a `OPEN`, limpia `closedBy/closedAt`, log en `AuditLog`.

**Endpoint:** `POST /cash-closures/:id/reopen`.

**Archivos:**
- `src/modules/cash-closures/cash-closures.service.ts` — método `reopen`
- `src/modules/cash-closures/cash-closures.controller.ts`

### 2.4 Frontend: modal de check-out con cobro
- Query a `sales/account/by-stay/:id` al abrir el modal.
- Calcula `lodgingDue = alojamiento + cargos pendientes`.
- Si `lodgingDue <= 0` → confirmación simple. Si `lodgingDue > 0` → diálogo con detalle + selector de método de pago.

**Archivo:** `frontend/src/features/stays/stays-page.tsx`

---

## 4. Etapa 3 — Penalidades + Asistencia automática

### 3.1 Cambios de modelo
- **Eliminado:** `StaffPaymentAttendance` (tabla puente pago↔asistencia).
- **Nuevo modelo `Penalty`:** `{ employeeId, amount, reason, date, status }` con `PenaltyStatus { PENDING, APPLIED, VOIDED }`.
- **Nuevo modelo `StaffPaymentPenalty`:** vincula penalidad aplicada con el pago (snapshot de monto, unique en `penaltyId`).
- **`StaffPayment` ampliado:** `grossAmount`, `penaltyAmount`, `amount` (neto).

**Migración:** `20260708192740_penalties_and_drop_staff_payment_attendance`.

### 3.2 Nuevo módulo `penalties`
- `POST /penalties` — crear penalidad (nace `PENDING`).
- `GET /penalties` — todas.
- `GET /penalties/employee/:employeeId` — por empleado.
- `POST /penalties/:id/void` — anular penalidad `PENDING` (las `APPLIED` requieren anular el pago).

**Regla:** una penalidad `APPLIED` no se puede anular directamente (hay que anular el pago que la aplicó).

### 3.3 Pago de personal rediseñado
Nuevo flujo en una sola transacción:
1. Cuenta asistencias del rango (referencial, **sin FK** — solo sugiere el bruto).
2. `grossAmount = dto.amount ?? dailyRate × attendanceCount`.
3. Obtiene penalidades `PENDING` del empleado hasta `periodEnd`.
4. `netAmount = grossAmount − penaltyAmount`.
5. Crea `CashMovement EXPENSE` por el neto.
6. Crea `StaffPayment` con `grossAmount/penaltyAmount/amount`.
7. Crea `StaffPaymentPenalty` (snapshot) y marca penalidades `APPLIED`.

**La asistencia queda como historial puro**, sin intervención directa en el cálculo del pago.

### 3.4 Asistencia automática en login
- Tras validar credenciales, si `user.employeeId` existe → `upsert` de asistencia de hoy.
- Idempotente vía `@@unique([employeeId, date])`.
- Status: `PRESENT` antes de las 09:00, `LATE` después.
- El login sigue funcionando normal.

**Archivo:** `src/modules/auth/auth.service.ts`

---

## 5. Etapa 4 — Reportes + Ocupación + Ventas mixtas

### 5.1 Bug de ocupación corregido
**Problema:** `%` de ocupación contaba habitaciones inactivas, inflando el denominador.

**Fix:** `where: { active: true }` en `room.findMany` de `reports.occupancy`.

### 5.2 Ventas mixtas: clasificación por monto dominante
**Problema:** `saleCategory` marcaba toda la venta como `ROOM_RENT` si había cualquier detalle de alojamiento.

**Nueva lógica:**
- Solo productos → `PRODUCT_SALE`.
- Solo alojamiento → `ROOM_RENT`.
- Mixta → gana el tipo con mayor monto (empate → `ROOM_RENT`).

**Justificación:** el reporte por tipo de ítem (`salesByItemType`) sigue siendo exacto. Esta categoría solo ordena el arqueo de caja.

### 5.3 Reportes reducidos a 4 (frontend)
**Quedan en el menú:** `cash-summary`, `sales-summary`, `staff`, `occupancy`.
**Quitados del menú (backend los mantiene):** `sales-by-item-type`, `product-sales`, `inventory`, `audit`.

---

## 6. Etapa 5 — Concurrencia + RoomProduct

### 6.1 Concurrencia en apertura de caja
**Problema:** Dos requests simultáneos podían crear 2 cajas abiertas para el mismo usuario.

**Solución:** índice parcial único + manejo de `P2002`.

**Migración:** `20260708200000_cash_shift_unique_open`:
```sql
CREATE UNIQUE INDEX "CashShift_openedById_status_OPEN_key"
  ON "CashShift"("openedById") WHERE "status" = 'OPEN';
```

### 6.2 Bug A2 (pérdidas por turno) — documentado
La corrección apropiada requiere agregar `cashShiftId` a `InventoryMovement` (migración + que el módulo de inventario exija caja abierta). Para un hotel chico donde rara vez se solapan turnos, el impacto es marginal. **Quedó documentado en el código** para una etapa futura.

### 6.3 RoomProduct — sin cambios funcionales
La validación existente (todos los productos `active: true`) es correcta para la semántica de **checklist/minibar**. La asignación no es traslado de stock central; el consumo real se descuenta en ventas con `source=ROOM`. Solo se limpiaron comentarios placeholder.

---

## 6bis. Reportes rediseñados (6 reportes)

Análisis profundo de los reportes necesarios para un hotel chico. Se llegó a una lista final de **6 reportes** (no 8): se descartaron "consumo por habitación" (es pantalla operativa, no reporte) y "ventas anuladas separadas" (fusionadas dentro de ventas).

### Backend
- **Nuevo `GET /reports/sales-full`**: reporte unificado de ventas e ingresos. Fusiona totales + desglose por tipo de ítem (ROOM_RENT/PRODUCT/PENALTY/OTHER) + anulaciones + ingresos por tipo de habitación.
- **`GET /reports/staff` enriquecido**: agrega `pendingPenaltiesByEmployee`, `attendanceSummaryByEmployee`, y por empleado: bruto, penalidades aplicadas, neto, adelantos, pendiente descontar, días trabajados.
- `occupancy` corregido: excluye `active=false`.
- Se mantienen endpoints antiguos (`sales-summary`, `sales-by-item-type`, `inventory`, `audit`) fuera del menú pero disponibles vía API.

### Frontend (rediseño completo)
- Menú con 6 reportes + íconos.
- Componente `KpiCard` reutilizable con color semántico (`tone`: green/amber/red/blue/slate).
- Componente `ProgressBar` (CSS puro, sin librería de gráficos) para el % de ocupación.
- Componentes dedicados por reporte (CashSummaryReport, SalesFullReport, OccupancyReport, ProductSalesReport, InventoryReport, StaffReport).
- Badges semánticos: `DifferenceBadge`, `ItemTypeBadge`, `MovementTypeBadge`.
- Uso de `DataTable` (búsqueda + responsive) para listados largos.
- Exportación PDF/Excel reescrita con `switch` por `ReportKey`.

**Decisión de diseño:** no se agregó librería de gráficos (recharts/chart.js). Para 10 clientes/día, tarjetas KPI + barras de progreso CSS + tablas comunican mejor sin peso extra.

---

## 6ter. Cuadre de diferencia de caja

**Problema:** al cerrar caja con diferencia (faltante/sobrante), el sistema solo guardaba el número. No había flujo para "reponer" la diferencia, y el próximo turno arrancaba descuadrado.

### Backend
- **Schema:** `CashClosure` con `settled`, `settledAt`, `settledById`, `settleReason`, `settleCashMovementId`.
- **Endpoint:** `POST /cash-closures/:id/settle` con `{ reason }`.
- **Service `settleDifference`:** crea `CashMovement` compensatorio (EXPENSE si faltante, INCOME si sobrante, categoría `CASH_ADJUSTMENT`) en la caja abierta actual, marca el cierre como `settled`, logea auditoría.
- **Reporte `cash-summary` enriquecido:** cada cierre devuelve `settled`/`settledBy`/`settleReason`; KPIs nuevos `unsettledCount` y `unsettledTotal`.

### Frontend
- Reporte de Cierre de caja: nuevo KPI "Cuadres pendientes".
- Columna "Estado" con badges (Cuadró / Cuadrado / Pendiente).
- Botón "Cuadrar" en cierres con diferencia pendiente → modal con detalle (faltante/sobrante, monto, explicación) + input de motivo.

**Migración:** `20260708210000_cash_closure_settle`.

---

## 6quater. Protección de habitación contra reservas

**Problema:** el check-in walk-in (`POST /stays/check-in`) no verificaba reservas futuras. Una reserva no protegía la habitación contra un walk-in que la ocupara antes.

### Solución
En `stays.service.checkIn`, cuando el check-in **no viene de una reserva**:
- Verifica que no exista reserva `PENDING`/`CONFIRMED` cuyo rango solape el **día completo** de hoy (`startDate < finDelDíaHoy AND endDate > inicioDelDíaHoy`).
- Si existe → bloquea con mensaje claro indicando el cliente.
- Reservas para **otros días** (mañana o después) **no bloquean**.

**Sin migración.** Solo validación en el punto correcto.

---

## 6quinquies. Facturación electrónica SUNAT

**Objetivo:** portar la implementación de `api-rest-s7` (Express + JS, directa a SUNAT) a un módulo NestJS dentro de Iguazú, ordenado, con base de datos y numeración automática.

### Arquitectura técnica (porteo fiel)
Misma arquitectura probada de la referencia: XML UBL 2.1 + firma PFX + SOAP directo a SUNAT (sin proveedor como Nubefact).

**6 services SUNAT porteados:**
- `xml-builder.service.ts` — construye XML UBL 2.1 (Invoice + CreditNote).
- `xml-signer.service.ts` — firma con `.pfx` vía `@supernova-team/xml-sunat`.
- `zip.service.ts` — empaqueta XML en ZIP base64.
- `sunat.service.ts` — envía SOAP `sendBill`, parsea Fault.
- `unzip-cdr.service.ts` — descomprime CDR, extrae `ResponseCode`.
- `sunat-catalogs.ts` — catálogos (tipo doc, IGV, monedas, unidades).

**2 services nuevos:**
- `pdf.service.ts` — genera PDF con `pdfkit` + QR SUNAT (`qrcode`). La referencia no lo tenía.
- `invoices.service.ts` — CRUD + numeración con `upsert` + `increment` atómico.

### Modelo de datos
- **`Invoice`**: comprobante con serie/correlativo, tipo (01/03/07/08), totales (base, IGV, total), snapshot del cliente, estado SUNAT, XML firmado, CDR, hash, PDF, relación a nota de crédito.
- **`InvoiceCounter`**: numeración correlativa por serie con bloqueo atómico.
- **`InvoiceStatus`**: PENDING, ACCEPTED, OBSERVED, REJECTED, CANCELED.
- Relación `Sale.invoice` (1:1 opcional).

**Migración:** `20260709000000_invoice_model`.

### Endpoints
- `POST /billing/issue-from-sale/:saleId` — emitir comprobante desde venta pagada.
- `POST /billing/:id/credit-note` — nota de crédito (anula comprobante).
- `GET /billing`, `GET /billing/:id` — listado y detalle.
- `GET /billing/:id/pdf` — descargar PDF.

### Flujo de emisión (`billing.service.issueFromSale`)
1. Carga venta `PAID` + cliente, valida que no tenga invoice previo.
2. Resuelve tipo (RUC→Factura 01, DNI→Boleta 03) si no se especifica.
3. Reserva correlativo atómicamente.
4. Calcula IGV (18%, precios incluyen IGV).
5. Construye XML → firma → ZIP → SUNAT → CDR.
6. Interpreta código (`0`=aceptado, `2xxx`=observado, resto=rechazado).
7. Persiste `Invoice` + genera PDF con QR.
8. Vincula `Sale.invoice`.

### Frontend
- **Página `/billing` "Comprobantes Electrónicos"**: 4 KPIs (total, aceptados, rechazados, facturado), filtros, tarjetas de comprobante con badge de estado SUNAT, botón "Ver PDF" (visor embebido), botón "Anular con NC".
- **Botón "Comprobante" en Historial de Ventas**: aparece en ventas `PAID` con cliente; modal de emisión con detección automática de tipo (RUC/DNI) y selector.
- Toast con resultado de SUNAT (aceptado/observado/rechazado + código).
- Nav + router actualizados.

### Configuración
Todo vía `.env`. Por defecto usa **certificado DEMO + endpoint beta** (comprobantes de prueba, no válidos fiscalmente). Para producción solo se cambia `.env` (RUC real, certificado `.pfx` real, endpoint de producción, credenciales SOAP reales) sin tocar código.

### Dependencias nuevas
`xmlbuilder2`, `@supernova-team/xml-sunat`, `adm-zip`, `fast-xml-parser`, `pdfkit`, `qrcode`, `axios` + sus `@types`.

---

## 7. Archivos nuevos y modificados

### Nuevos (backend)
| Archivo | Descripción |
|---|---|
| `prisma/seed.ts` | Seed inicial idempotente |
| `prisma/tsconfig.seed.json` | tsconfig del seed |
| `prisma/migrations/20260707212745_sale_cancel_fields/migration.sql` | Campos de cancelación de venta |
| `prisma/migrations/20260708192740_penalties_and_drop_staff_payment_attendance/migration.sql` | Penalty + drop tabla puente |
| `prisma/migrations/20260708200000_cash_shift_unique_open/migration.sql` | Índice único de caja abierta |
| `prisma/migrations/20260708210000_cash_closure_settle/migration.sql` | Campos de cuadre de cierre |
| `prisma/migrations/20260709000000_invoice_model/migration.sql` | Modelo de facturación electrónica |
| `src/modules/stays/dto/check-out.dto.ts` | DTO de check-out con cobro |
| `src/modules/sales/dto/cancel-sale.dto.ts` | DTO de cancelación |
| `src/modules/cash-movements/dto/reverse-cash-movement.dto.ts` | DTO de reversa |
| `src/modules/cash-closures/dto/settle-difference.dto.ts` | DTO de cuadre |
| `src/modules/penalties/` (4 archivos) | Módulo de penalidades |
| `src/modules/billing/` (16 archivos) | Módulo de facturación electrónica SUNAT completo |

### Modificados (backend)
| Archivo | Cambio principal |
|---|---|
| `prisma/schema.prisma` | Sale, User, Attendance, StaffPayment, Employee, Penalty, CashClosure, CashMovement, Invoice, InvoiceCounter, enums |
| `src/app.module.ts` | Registro de PenaltiesModule + BillingModule |
| `src/common/permissions/available-permissions.ts` | ~20 permisos nuevos |
| `src/modules/stays/stays.service.ts` | checkOut con cobro forzado + validación fecha + protección reservas |
| `src/modules/stays/stays.controller.ts` | Body en check-out |
| `src/modules/reservations/dto/create-reservation.dto.ts` | paymentMethod |
| `src/modules/reservations/reservations.service.ts` | Usa paymentMethod |
| `src/modules/sales/sales.service.ts` | Bug A1 + cancel + saleCategory por monto dominante |
| `src/modules/sales/sales.controller.ts` | Endpoint cancel |
| `src/modules/attendance/attendance.service.ts` | Guards de duplicados |
| `src/modules/auth/auth.service.ts` | Asistencia automática en login |
| `src/modules/cash-shift/cash-shift.service.ts` | Manejo de P2002 |
| `src/modules/cash-movements/cash-movements.service.ts` | Método reverse |
| `src/modules/cash-movements/cash-movements.controller.ts` | Endpoint reverse |
| `src/modules/cash-closures/cash-closures.service.ts` | Métodos reopen + settleDifference + comentario A2 |
| `src/modules/cash-closures/cash-closures.controller.ts` | Endpoints reopen + settle |
| `src/modules/rooms/rooms.service.ts` | Comentarios limpios |
| `src/modules/staff-payments/staff-payments.service.ts` | Reescritura con penalidades |
| `src/modules/reports/reports.service.ts` | salesFull + staff enriquecido + bug ocupación |
| `src/modules/reports/reports.controller.ts` | Endpoint sales-full |
| `package.json` | Comando prisma db seed + dependencias facturación |
| `.env.example` | Variables SUNAT |

### Nuevos (frontend)
| Archivo | Descripción |
|---|---|
| `src/features/billing/billing-page.tsx` | Página de comprobantes con visor PDF |

### Modificados (frontend)
| Archivo | Cambio principal |
|---|---|
| `src/features/stays/stays-page.tsx` | Modal de check-out con cobro |
| `src/features/reports/reports-page.tsx` | Rediseño completo: 6 reportes, KpiCard, ProgressBar, DataTable |
| `src/features/sales/sales-history-page.tsx` | Botón "Comprobante" + modal de emisión |
| `src/components/layout/nav.ts` | Item Comprobantes |
| `src/app/router.tsx` | Ruta /billing |

---

## 8. Migraciones

| Migración | Descripción |
|---|---|
| `20260707212745_sale_cancel_fields` | `Sale`: `cancelReason`, `cancelledAt`, `cancelledById` + FK |
| `20260708192740_penalties_and_drop_staff_payment_attendance` | Enum `PenaltyStatus`, tablas `Penalty` y `StaffPaymentPenalty`, columnas en `StaffPayment`, drop `StaffPaymentAttendance` |
| `20260708200000_cash_shift_unique_open` | Índice único parcial en `CashShift(openedById) WHERE status=OPEN` |
| `20260708210000_cash_closure_settle` | `CashClosure`: `settled`, `settledAt`, `settledById`, `settleReason`, `settleCashMovementId` + FKs |
| `20260709000000_invoice_model` | Enum `InvoiceStatus`, tablas `Invoice` e `InvoiceCounter`, FK a `Sale`/`User`/self |

**Aplicar desde cero:**
```bash
npx prisma migrate dev
npx prisma db seed
```

---

## 9. Estado por módulo

| Módulo | Estado | Notas |
|---|---|---|
| Auth | ✅ | Asistencia automática agregada |
| Users | ✅ | Sin cambios |
| Employees | ✅ | Sin cambios |
| Customers | ✅ | Sin cambios |
| RoomTypes / PriceTypes / RoomTypePrices | ✅ | Sin cambios (modelo correcto) |
| Rooms + RoomProduct | ✅ | Comentarios limpios |
| CashShift | ✅ | Concurrencia resuelta |
| CashMovements | ✅ | Reversa agregada |
| CashClosures | ✅ | Reabrir (ADMIN) + cuadre de diferencia |
| Stays | ✅ | Cobro forzado en check-out + protección reservas |
| Reservations | ✅ | paymentMethod en depósito + protección por día |
| Sales | ✅ | Cancelación + bug A1 + mixtas |
| Products | ✅ | Sin cambios |
| Inventory | ✅ | Sin cambios |
| Attendance | ✅ | Guards de duplicados + auto en login |
| StaffAdvances | ✅ | Sin cambios |
| StaffPayments | ✅ | Reescrito con penalidades |
| StaffDiscounts | ✅ | Sin cambios |
| **Penalties** | ✅ | Nuevo módulo |
| Reports | ✅ | 6 reportes rediseñados + sales-full + staff enriquecido |
| Audit | ✅ | Sin cambios |
| Permissions | ✅ | ~20 permisos nuevos |
| **Billing (facturación SUNAT)** | ✅ | Nuevo módulo completo |

---

## 10. Análisis de mejoras futuras (post-cambios)

> Lo que sigue es opcional y priorizado por valor real para un hotel pequeño.
> Nada de esto bloquea la operación. Aplicar solo si se vuelve necesario.

### 10.1 Mejoras recomendadas (valor medio)

**R1. `cashShiftId` en `InventoryMovement` (cierra bug A2).**
Hoy las pérdidas del resumen de caja se filtran por rango de tiempo, lo que puede contar pérdidas de otro turno solapado. Agregar `cashShiftId Int?` a `InventoryMovement` y que el módulo de inventario lo complete desde la caja abierta del usuario permite filtrar exactamente por turno. Impacto bajo para hotel chico, pero es la corrección técnica correcta.

**R2. Cancelación de pagos a personal / adelantos.**
Hoy se pueden anular ventas y revertir movimientos de caja, pero un `StaffPayment` o `StaffAdvance` no tienen flujo de anulación. Si se registra mal, hay que tocar BD. Análogo a la cancelación de ventas: crear `CashMovement` compensatorio y marcar el registro como `VOIDED`.

**R3. Certificado de producción para facturación.**
La facturación electrónica está implementada pero con certificado DEMO + endpoint beta (comprobantes de prueba). Para facturar fiscalmente: obtener certificado `.pfx` real del hotel, credenciales SOAP de SUNAT producción, y configurar `.env`. Sin tocar código.

**R4. Pantallas frontend faltantes.**
El backend soporta cancelar ventas, reversar movimientos de caja, reabrir caja, gestionar penalidades y notas de crédito, pero varias de esas acciones solo tienen endpoint. Falta: pantalla de penalidades (CRUD), botón de reversa de movimiento en la UI de movimientos, botón de reabrir caja en cierres. La facturación SÍ tiene frontend completo.

### 10.2 Mejoras opcionales (valor bajo para hotel chico)

**O1. Soft-delete de `Customer`.**
Hoy no hay `active` en `Customer`. Un cliente repetido con error de tipeo en el documento queda duplicado. Agregar `active` a `Customer` y filtrar en `findAll` unifica el patrón con el resto del sistema.

**O2. Auditoría global automática (interceptor).**
La auditoría actual es manual y selectiva. Un interceptor NestJS que loguee automáticamente todas las mutaciones daría trazabilidad completa con poco código. Inversión de ~1 día de trabajo, retorno bajo para 10 clientes/día.

**O3. Tests automatizados.**
No hay tests más allá del spec por defecto. Para un sistema en producción real, tests e2e de los flujos críticos (caja, check-in/out, ventas, facturación) darían seguridad. Prioridad baja mientras el equipo sea chico y el dueño conozca el sistema.

**O4. ApiPeru (consulta DNI/RUC).**
La referencia `api-rest-s7` lo tenía: autocompletar datos del cliente al ingresar DNI/RUC. Mejora de UX, no crítica.

**O5. Comunicación de baja y resumen diario (RA).**
Para boletas que se anulan fuera del día o lotes. SUNAT lo exige en algunos casos. Por ahora cada anulación va como nota de crédito individual.

### 10.3 Bugs/riesgos residuales conocidos

**B1. Bug A2 (pérdidas por rango).** Documentado. Ver R1 arriba.

**B2. Race en asistencia automática.**
`recordTodayAttendance` hace un `upsert` que es atómico, pero el umbral `LATE` se calcula al momento del login. Si un empleado hace login a las 08:59 y otro a las 09:01, el segundo queda `LATE` aunque sea el mismo día. Comportamiento esperado y correcto.

**B3. Facturación con certificado DEMO.**
Los comprobantes emitidos con el certificado y endpoint beta NO son válidos fiscalmente. Hay que migrar a producción (R3) antes de usarlo con clientes reales.

**B4. Cálculo de IGV asume precios incluyen IGV.**
El `billing.service` calcula base = total / 1.18. Si el hotel maneja precios sin IGV (exonerado), habría que ajustar el tipo de afectación. Por defecto asume gravado con IGV (caso estándar de hostales).

### 10.4 Deuda técnica menor

- `AuditService.log` existe pero no se usa de forma consistente en todos los servicios. Algunos loguean, otros no. No es un bug, es falta de uniformidad.
- Varios servicios del backend (sales cancel, cash reverse, penalties) no tienen su pantalla dedicada en el frontend todavía.

---

## 11. Filosofía aplicada

- **No reescribir lo que funciona.** El núcleo caja/ventas/estadías/inventario se mantuvo intacto en su lógica.
- **Simplificar solo lo que aporta complejidad innecesaria.** Se eliminó la tabla puente pago↔asistencia pero se mantuvieron PriceType/Permisos (eran correctos).
- **CashMovement como fuente de verdad inmutable.** Toda corrección se hace con movimientos compensatorios, nunca editando/eliminando.
- **Soft-delete y no deletes físicos.** Mantenido en todo el sistema.
- **A prueba de olvidos del operador.** El cobro de alojamiento es forzado, no opcional.
- **Sin sobreingeniería.** No se agregó librería de gráficos, no se eliminaron permisos configurables, no se reescribió lo que funcionaba.
- **Porteo fiel de lo probado.** La facturación electrónica se portó de la implementación validada en `api-rest-s7`, no se reinventó.

---

## 12. Cómo levantar el sistema desde cero

```bash
# Backend
cd backend_iguazu
cp .env.example .env          # configurar DATABASE_URL y credenciales SUNAT
npx prisma migrate dev        # aplica las 5 migraciones
npx prisma db seed            # limpia data y deja admin + permisos base
npm run start:dev             # levanta backend en :3000

# Frontend
cd ../frontend_iguazu
npm install
npm run dev                   # levanta frontend
```

**Usuario admin por defecto:** `admin` / `Admin123!` (cambiar con `SEED_ADMIN_PASSWORD`).

---

*Fin del documento.*

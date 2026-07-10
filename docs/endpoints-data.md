# Endpoints y Data - Backend Iguazu

Base local:

```txt
http://localhost:3000
```

Headers para endpoints protegidos:

```txt
Content-Type: application/json
Authorization: Bearer TU_TOKEN
```

Obtener token:

```http
POST /auth/login
```

```json
{
  "username": "admin",
  "password": "123456"
}
```

Enums utiles:

```txt
UserRole: ADMIN, RECEPTIONIST, CASHIER
RoomStatus: AVAILABLE, OCCUPIED, RESERVED, OUT_OF_SERVICE
ReservationStatus: PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW
InventoryMovementType: IN, OUT, ADJUSTMENT, LOSS
SaleItemType: PRODUCT, ROOM_RENT, PENALTY, OTHER
PaymentMethod: CASH, CARD, YAPE, PLIN, TRANSFER
AttendanceStatus: PRESENT, ABSENT, LATE, JUSTIFIED
```

## Orden recomendado

1. Login.
2. Crear employee si necesitas usuarios ligados a personal.
3. Crear/open cash shift.
4. Crear price types.
5. Crear room types.
6. Crear room type prices.
7. Crear rooms.
8. Crear customers.
9. Crear products.
10. Cargar stock con inventory/in.
11. Crear reservation o check-in directo.
12. Crear sale.
13. Check-out.
14. Cash closure.

## Auth

```http
POST /auth/login
```

```json
{
  "username": "admin",
  "password": "123456"
}
```

```http
GET /auth/me
```

Sin body.

`login` y `me` devuelven `permissions`. Para `ADMIN` devuelve `["*"]`.

## Permissions

Solo `ADMIN` puede configurar permisos. Los demás roles necesitan permisos por endpoint exacto.

```http
GET /permissions/available
GET /permissions
GET /permissions/:role
PUT /permissions/:role
```

Ejemplo para dar permisos a `CASHIER`:

```http
PUT /permissions/CASHIER
```

```json
{
  "permissions": [
    "GET /products",
    "GET /products/:id",
    "POST /sales",
    "POST /sales/:id/pay",
    "GET /sales",
    "GET /sales/:id",
    "GET /sales/account/by-stay/:stayId",
    "GET /stays/active",
    "GET /customers",
    "POST /customers",
    "GET /customers/:id"
  ]
}
```

Ejemplo para recepción:

```http
PUT /permissions/RECEPTIONIST
```

```json
{
  "permissions": [
    "GET /rooms",
    "GET /rooms/:id",
    "GET /room-types",
    "GET /price-types",
    "POST /customers",
    "GET /customers",
    "GET /customers/:id",
    "POST /reservations",
    "GET /reservations",
    "GET /reservations/:id",
    "PATCH /reservations/:id/confirm",
    "PATCH /reservations/:id/cancel",
    "POST /stays/check-in",
    "PATCH /stays/:id/check-out",
    "GET /stays/active",
    "GET /stays/history"
  ]
}
```

## Users

```http
POST /users
```

```json
{
  "employeeId": 1,
  "username": "caja",
  "password": "123456",
  "role": "CASHIER"
}
```

```http
GET /users
GET /users/:id
PATCH /users/:id
PATCH /users/:id/toggle-active
```

Patch ejemplo:

```json
{
  "username": "caja2",
  "role": "RECEPTIONIST",
  "active": true,
  "password": "123456"
}
```

## Employees

```http
POST /employees
```

```json
{
  "fullName": "Juan Perez",
  "documentType": "DNI",
  "documentNumber": "12345678",
  "phone": "999999999",
  "address": "Iquitos",
  "position": "Recepcion",
  "dailyRate": 50
}
```

```http
GET /employees
GET /employees/:id
PATCH /employees/:id
PATCH /employees/:id/deactivate
```

Patch ejemplo:

```json
{
  "phone": "988888888",
  "dailyRate": 60
}
```

## Cash Shift

```http
POST /cash-shift/open
```

```json
{
  "openingAmount": 100
}
```

```http
GET /cash-shift/open
POST /cash-shift/close
GET /cash-shift/history
GET /cash-shift/:id
```

`POST /cash-shift/close` no necesita body. Para cierre formal usa `POST /cash-closures/close`.

## Price Types

```http
POST /price-types
```

```json
{
  "name": "Noche",
  "description": "Cobro por noche"
}
```

```http
GET /price-types
GET /price-types/:id
PATCH /price-types/:id
PATCH /price-types/:id/toggle-active
```

Patch ejemplo:

```json
{
  "name": "12 horas",
  "description": "Cobro por 12 horas",
  "active": true
}
```

## Room Types

```http
POST /room-types
```

```json
{
  "name": "Matrimonial",
  "description": "Habitacion matrimonial"
}
```

```http
GET /room-types
GET /room-types/:id
PATCH /room-types/:id
PATCH /room-types/:id/toggle-active
```

Patch ejemplo:

```json
{
  "description": "Habitacion matrimonial con TV",
  "active": true
}
```

## Room Type Prices

```http
POST /room-type-prices
```

```json
{
  "roomTypeId": 1,
  "priceTypeId": 1,
  "amount": 120
}
```

```http
GET /room-type-prices
GET /room-type-prices/:id
PATCH /room-type-prices/:id
PATCH /room-type-prices/:id/toggle-active
```

Patch ejemplo:

```json
{
  "amount": 130,
  "active": true
}
```

## Rooms

```http
POST /rooms
```

```json
{
  "roomNumber": "101",
  "roomTypeId": 1,
  "floor": 1,
  "status": "AVAILABLE",
  "description": "Primer piso"
}
```

```http
GET /rooms
GET /rooms/:id
PATCH /rooms/:id
PATCH /rooms/:id/toggle-active
```

Patch ejemplo:

```json
{
  "status": "OUT_OF_SERVICE",
  "description": "Mantenimiento"
}
```

Nota: `OCCUPIED` no se cambia desde este CRUD; se usa check-in/check-out.

## Customers

```http
POST /customers
```

```json
{
  "documentType": "DNI",
  "documentNumber": "45678912",
  "fullName": "Maria Lopez",
  "phone": "977777777",
  "email": "maria@test.com",
  "address": "Iguazu"
}
```

Con RUC:

```json
{
  "documentType": "RUC",
  "documentNumber": "20123456789",
  "businessName": "Empresa SAC",
  "fullName": "Empresa SAC",
  "phone": "966666666"
}
```

```http
GET /customers
GET /customers/:id
GET /customers/by-document?documentType=DNI&documentNumber=45678912
PATCH /customers/:id
```

Patch ejemplo:

```json
{
  "phone": "955555555",
  "address": "Nueva direccion"
}
```

## Products

```http
POST /products
```

```json
{
  "name": "Agua mineral",
  "description": "Botella 625ml",
  "purchasePrice": 1.5,
  "salePrice": 3,
  "stock": 0,
  "minStock": 5
}
```

```http
GET /products
GET /products/:id
PATCH /products/:id
PATCH /products/:id/toggle-active
```

Patch ejemplo:

```json
{
  "salePrice": 3.5,
  "minStock": 10
}
```

## Inventory

Entrada:

```http
POST /inventory/in
```

```json
{
  "productId": 1,
  "quantity": 20,
  "reason": "Compra inicial",
  "referenceType": "PURCHASE"
}
```

Salida manual:

```http
POST /inventory/out
```

```json
{
  "productId": 1,
  "quantity": 2,
  "reason": "Salida manual"
}
```

Perdida:

```http
POST /inventory/loss
```

```json
{
  "productId": 1,
  "quantity": 1,
  "reason": "Producto danado"
}
```

Ajuste relativo:

```http
POST /inventory/adjust
```

```json
{
  "productId": 1,
  "quantity": -3,
  "reason": "Correccion de conteo"
}
```

```http
GET /inventory/movements
GET /inventory/movements/product/:productId
```

Nota: `adjust.quantity` positivo suma stock, negativo resta stock.

## Stays

Check-in directo:

```http
POST /stays/check-in
```

```json
{
  "customerId": 1,
  "roomId": 1,
  "priceTypeId": 1,
  "expectedCheckOut": "2026-07-04T12:00:00.000Z"
}
```

Con precio pactado manual:

```json
{
  "customerId": 1,
  "roomId": 1,
  "priceTypeId": 1,
  "agreedPrice": 100,
  "expectedCheckOut": "2026-07-04T12:00:00.000Z"
}
```

```http
PATCH /stays/:id/check-out
GET /stays/active
GET /stays/history
GET /stays/:id
```

Check-out no necesita body.

## Reservations

```http
POST /reservations
```

```json
{
  "customerId": 1,
  "roomId": 1,
  "startDate": "2026-07-10T14:00:00.000Z",
  "endDate": "2026-07-11T12:00:00.000Z",
  "depositAmount": 50,
  "notes": "Reserva por telefono"
}
```

```http
GET /reservations
GET /reservations/:id
PATCH /reservations/:id/confirm
PATCH /reservations/:id/cancel
PATCH /reservations/:id/no-show
POST /reservations/:id/check-in
```

Check-in desde reserva:

```json
{
  "priceTypeId": 1,
  "agreedPrice": 120,
  "expectedCheckOut": "2026-07-11T12:00:00.000Z"
}
```

## Sales

Venta de producto:

```http
POST /sales
```

```json
{
  "customerId": 1,
  "details": [
    {
      "itemType": "PRODUCT",
      "productId": 1,
      "description": "Agua mineral",
      "quantity": 2,
      "unitPrice": 3
    }
  ],
  "payments": [
    {
      "paymentMethod": "CASH",
      "amount": 6
    }
  ]
}
```

Venta de habitacion:

```json
{
  "customerId": 1,
  "stayId": 1,
  "details": [
    {
      "itemType": "ROOM_RENT",
      "stayId": 1,
      "description": "Alquiler de habitacion",
      "quantity": 1,
      "unitPrice": 120
    }
  ],
  "payments": [
    {
      "paymentMethod": "YAPE",
      "amount": 120
    }
  ]
}
```

Venta mixta con pago dividido:

```json
{
  "customerId": 1,
  "stayId": 1,
  "details": [
    {
      "itemType": "ROOM_RENT",
      "stayId": 1,
      "description": "Alquiler de habitacion",
      "quantity": 1,
      "unitPrice": 120
    },
    {
      "itemType": "PRODUCT",
      "productId": 1,
      "description": "Agua mineral",
      "quantity": 2,
      "unitPrice": 3
    }
  ],
  "payments": [
    {
      "paymentMethod": "CASH",
      "amount": 60
    },
    {
      "paymentMethod": "CARD",
      "amount": 66
    }
  ]
}
```

```http
GET /sales
GET /sales/:id
GET /sales/by-shift/:cashShiftId
GET /sales/by-stay/:stayId
GET /sales/pending/by-stay/:stayId
GET /sales/account/by-stay/:stayId
```

Regla: suma de `payments.amount` debe ser igual a suma de `quantity * unitPrice`.

Para la pantalla de Ventas, usa este endpoint cuando se seleccione una estadía:

```http
GET /sales/account/by-stay/1
```

Devuelve una cuenta lista para pintar:

```json
{
  "stay": {
    "id": 1,
    "agreedPrice": "100",
    "customer": {},
    "room": {}
  },
  "lodging": {
    "amount": 100,
    "status": "UNBILLED",
    "saleId": null,
    "pendingAmount": 100
  },
  "roomProducts": [],
  "pendingCharges": [],
  "paidCharges": [],
  "totals": {
    "unbilledLodging": 100,
    "pendingCharges": 0,
    "paidCharges": 0,
    "amountToCollect": 100,
    "accountTotal": 100
  }
}
```

Uso recomendado:

- Si hay estadía seleccionada: pintar `lodging`, `pendingCharges`, `paidCharges`, `roomProducts` y `totals`.
- Si no hay estadía seleccionada: usar venta libre con `POST /sales`, sin `stayId`.
- Si el cliente compra productos en caja y tiene habitación: enviar `stayId` y pagos; quedará en `paidCharges` y sumará a `accountTotal`.
- Si quieres dejar algo pendiente a la habitación: enviar `stayId` sin `payments`; quedará en `pendingCharges`.

## Cash Movements

No hay `POST` publico.

```http
GET /cash-movements
GET /cash-movements/:id
GET /cash-movements/by-shift/:cashShiftId
```

## Cash Closures

```http
POST /cash-closures/close
```

```json
{
  "countedAmounts": [
    {
      "paymentMethod": "CASH",
      "countedAmount": 100
    },
    {
      "paymentMethod": "CARD",
      "countedAmount": 0
    },
    {
      "paymentMethod": "YAPE",
      "countedAmount": 120
    },
    {
      "paymentMethod": "PLIN",
      "countedAmount": 0
    },
    {
      "paymentMethod": "TRANSFER",
      "countedAmount": 0
    }
  ],
  "notes": "Cierre de turno"
}
```

```http
GET /cash-closures
GET /cash-closures/:id
```

## Attendance

```http
POST /attendance
```

```json
{
  "employeeId": 1,
  "date": "2026-07-03",
  "status": "PRESENT",
  "notes": "Turno completo"
}
```

```http
PATCH /attendance/:id/check-in
PATCH /attendance/:id/check-out
GET /attendance/employee/:employeeId
GET /attendance/range?from=2026-07-01&to=2026-07-31
```

Check-in/check-out no necesitan body.

## Staff Advances

```http
POST /staff-advances
```

```json
{
  "employeeId": 1,
  "amount": 30,
  "reason": "Adelanto de sueldo",
  "paymentMethod": "CASH"
}
```

```http
GET /staff-advances
```

## Staff Payments

```http
POST /staff-payments
```

```json
{
  "employeeId": 1,
  "periodStart": "2026-07-01",
  "periodEnd": "2026-07-15",
  "paymentMethod": "CASH"
}
```

Con monto manual:

```json
{
  "employeeId": 1,
  "periodStart": "2026-07-01",
  "periodEnd": "2026-07-15",
  "amount": 500,
  "paymentMethod": "TRANSFER"
}
```

```http
GET /staff-payments
```

## Staff Discounts

Descuento para pago futuro:

```http
POST /staff-discounts
```

```json
{
  "employeeId": 1,
  "amount": 20,
  "reason": "Producto perdido",
  "inventoryMovementId": 1,
  "chargeNow": false
}
```

Cobrado en efectivo ahora:

```json
{
  "employeeId": 1,
  "amount": 20,
  "reason": "Producto perdido",
  "inventoryMovementId": 1,
  "chargeNow": true,
  "paymentMethod": "CASH"
}
```

```http
GET /staff-discounts
```

## Audit

```http
GET /audit
GET /audit/:id
```

## Health

```http
GET /
```

Sin body.

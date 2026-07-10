CREATE TABLE "RoomProduct" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomProduct_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RoomProduct_roomId_productId_key" ON "RoomProduct"("roomId", "productId");
CREATE INDEX "RoomProduct_roomId_idx" ON "RoomProduct"("roomId");
CREATE INDEX "RoomProduct_productId_idx" ON "RoomProduct"("productId");

ALTER TABLE "RoomProduct" ADD CONSTRAINT "RoomProduct_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RoomProduct" ADD CONSTRAINT "RoomProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

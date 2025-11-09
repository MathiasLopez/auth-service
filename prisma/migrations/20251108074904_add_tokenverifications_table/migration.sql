-- CreateTable
CREATE TABLE "TokenValidations" (
    "id" TEXT NOT NULL,
    "isValid" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TokenValidations_pkey" PRIMARY KEY ("id")
);

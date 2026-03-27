# Guia Completa: Levantar CRUD Next.js + Prisma + MySQL (desde cero)

Esta guia deja el proyecto funcional con Prisma 7 (version actual), MySQL y Route Handlers en Next.js.

El proyecto real esta en la carpeta `nextjs-prisma`.

## 1. Requisitos

- Node.js 20 o superior
- npm 10 o superior
- MySQL corriendo localmente

Verifica rapido:

```bash
node -v
npm -v
mysql --version
```

## 2. Entrar al proyecto correcto

Muchos errores aparecieron por correr comandos en la carpeta padre. Siempre usa:

```bash
cd /Users/duvanmondragon/Documents/cruz_assesment/nextjs-prisma
```

## 3. Instalar dependencias correctas para Prisma 7 + MySQL

Instala exactamente esto:

```bash
npm install @prisma/client prisma @prisma/adapter-mariadb mariadb dotenv
```

Si por error instalaste Postgres adapter, quitelo:

```bash
npm uninstall @prisma/adapter-pg pg @types/pg
```

## 4. Configurar variables de entorno

Archivo `.env` en la raiz de `nextjs-prisma`:

```env
DATABASE_URL="mysql://root@localhost:3306/mi_db"
```

Ajusta usuario/password/puerto segun tu entorno.

## 5. Configurar Prisma 7 (compatibilidad clave)

### 5.1 `prisma/schema.prisma`

Con Prisma 7, para este setup no pongas `url` en el datasource. Debe quedar asi:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
}

model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 5.2 `prisma.config.ts`

La URL se define aqui:

```ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```

## 6. Generar cliente y migraciones

```bash
npx prisma generate
npx prisma migrate dev --name init_user_model
```

## 7. Configurar Prisma Client en Next.js

Para evitar el error de TypeScript:

- `Module '"@prisma/client"' has no exported member 'PrismaClient'.ts(2305)`

usa este contenido en `lib/prisma.ts`:

```ts
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const { PrismaClient } = require("@prisma/client");

const prismaClientSingleton = () => {
  const adapter = new PrismaMariaDb(process.env.DATABASE_URL ?? "");
  return new PrismaClient({ adapter });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}
```

## 8. Estructura backend esperada (Route Handlers)

- `app/api/users/route.ts` -> `GET`, `POST`
- `app/api/users/[id]/route.ts` -> `PUT`, `DELETE`

Todos importando:

```ts
import prisma from "@/lib/prisma";
```

## 9. Levantar el proyecto

```bash
npm run dev
```

Abre:

- http://localhost:3000

Prueba la API:

```bash
curl -i http://localhost:3000/api/users
```

Respuesta inicial esperada:

- status `200`
- body `[]`

## 10. Problemas comunes y solucion

### Error: `Module '"@prisma/client"' has no exported member 'PrismaClient'`

Solucion:
- usar `require("@prisma/client")` en `lib/prisma.ts`
- no usar import nombrado directo en este setup

### Error: `adapter-pg ... not compatible with provider mysql`

Solucion:
- quitar `@prisma/adapter-pg`
- usar `@prisma/adapter-mariadb` + `mariadb`

### Error: `datasource property url is no longer supported in schema files`

Solucion:
- quitar `url` de `prisma/schema.prisma`
- mover URL a `prisma.config.ts`

### Error `ENOENT package.json` al correr `npm run dev`

Solucion:
- estabas en carpeta equivocada
- correr siempre desde `nextjs-prisma`

## 11. Reset rapido del entorno (si algo queda roto)

```bash
cd /Users/duvanmondragon/Documents/cruz_assesment/nextjs-prisma
pkill -f "next dev" || true
rm -rf .next node_modules package-lock.json
npm install
npx prisma generate
npm run dev
```

## 12. Checklist para la sustentacion de entrevista

- Frontend React consumiendo API propia
- Backend con Route Handlers (`GET/POST/PUT/DELETE`)
- Prisma como ORM
- MySQL como persistencia
- Validaciones basicas y manejo de errores HTTP
- Flujo CRUD completo operativo

## 13. Codigo de los archivos principales

### Variables de entorno

**Direccion de la base de datos local:**

```
mysql://root@localhost:3306/mi_db
```

### `prisma/schema.prisma`

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?
// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
}

model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### `lib/prisma.ts`

```typescript
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const { PrismaClient } = require("@prisma/client");

const prismaClientSingleton = () => {
    const adapter = new PrismaMariaDb(process.env.DATABASE_URL ?? "");

    return new PrismaClient({ adapter });
}

declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
```

### `app/api/users/route.ts`

```typescript
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany();
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: "Error interno al obtener los usuarios" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email } = body;
    
    if (!name || !email) {
      return NextResponse.json({ error: "Nombre y email requeridos" }, { status: 400 });
    }

    const newUser = await prisma.user.create({
      data: { name, email },
    });
    
    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 });
  }
}
```

### `app/api/users/[id]/route.ts`

```typescript
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request: Request, context: { params: { id: string } }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { name, email } = body;

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { name, email },
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  try {
    const { id } = await context.params;
    await prisma.user.delete({ where: { id: Number(id) } });
    
    return NextResponse.json({ message: "Usuario eliminado exitosamente" });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 });
  }
}
```

### `app/page.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";

// Definimos la estructura de nuestro Usuario
type User = {
  id: number;
  name: string;
  email: string;
};  

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  // GET: Cargar usuarios al montar el componente
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    }
  };

  // POST / PUT: Manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
      
    try {
      if (editingId) {
        // Actualizar usuario existente (PUT)
        await fetch(`/api/users/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email }),
        });
        setEditingId(null);
      } else {
        // Crear nuevo usuario (POST)
        await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email }),
        });
      }

      // Limpiar formulario y recargar tabla
      setName("");
      setEmail("");
      fetchUsers();
    } catch (error) {
      console.error("Error guardando el usuario:", error);
    }
  };

  // Llenar el formulario con los datos a editar
  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setName(user.name);
    setEmail(user.email);
  };

  // DELETE: Eliminar un usuario
  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de eliminar este usuario?")) {
      try {
        await fetch(`/api/users/${id}`, { method: "DELETE" });
        fetchUsers(); // Recargamos lista después de eliminar
      } catch (error) {
        console.error("Error eliminando el usuario:", error);
      }
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto text-black">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Administración de Usuarios (CRUD)</h1>
      
      {/* Formulario */}
      <form onSubmit={handleSubmit} className="mb-10 bg-gray-100 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          {editingId ? "Editar Usuario" : "Crear Nuevo Usuario"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Nombre completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            required
          />
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition"
        >
          {editingId ? "Actualizar Usuario" : "Crear Usuario"}
        </button>
      </form>

      {/* Tabla de usuarios */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="w-full border-collapse">
          <thead className="bg-gray-200 text-left">
            <tr>
              <th className="p-4 border-b font-semibold text-gray-700">ID</th>
              <th className="p-4 border-b font-semibold text-gray-700">Nombre</th>
              <th className="p-4 border-b font-semibold text-gray-700">Email</th>
              <th className="p-4 border-b font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition">
                  <td className="p-4 border-b text-gray-700">{user.id}</td>
                  <td className="p-4 border-b text-gray-700">{user.name}</td>
                  <td className="p-4 border-b text-gray-700">{user.email}</td>
                  <td className="p-4 border-b">
                    <button
                      onClick={() => handleEdit(user)}
                      className="mr-2 px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm transition"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  No hay usuarios aún. Crea uno nuevo para comenzar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
```

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

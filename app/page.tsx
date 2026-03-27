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
        <div className="flex gap-2">
          <button 
            type="submit" 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            {editingId ? "Actualizar Datos" : "Guardar Usuario"}
          </button>
          
          {editingId && (
            <button 
              type="button" 
              onClick={() => { setEditingId(null); setName(""); setEmail(""); }} 
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
            >
              Cancelar Edición
            </button>
          )}
        </div>
      </form>

      {/* Lista / Tabla de Usuarios */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Usuarios Registrados</h2>
        {users.length === 0 ? (
          <p className="text-gray-500 italic">No hay usuarios registrados en la base de datos.</p>
        ) : (
          <ul className="space-y-4">
            {users.map((user) => (
              <li key={user.id} className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4 sm:mb-0">
                  <p className="font-bold text-lg text-gray-900">{user.name}</p>
                  <p className="text-gray-600">{user.email}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEdit(user)} 
                    className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600 transition-colors"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDelete(user.id)} 
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
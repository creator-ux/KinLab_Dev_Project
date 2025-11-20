import React, { useEffect, useState, useMemo, useCallback } from "react";
import { api } from "../../apiClient.js";
import { FaEdit, FaTrashAlt, FaPlus } from "react-icons/fa";
import { FiFilter, FiSearch } from "react-icons/fi";
//equipo mdales
import AddEquipment from "./CRUD_Equipment/AddEquipment"; //modal de inserts
import EditEquipment from "./CRUD_Equipment/EditEquipment"; //modal de updates
import DeleteEquipment from "./CRUD_Equipment/DeleteEquipment"; //modal de delete

import Loader from "../common/Loader";
import Pagination from "../common/Pagination";

function Equipments() {
  //manejo de estados
  const [isLoading, setIsLoading] = useState(true); //saber si me esta cargando
  const [equipos, setEquipos] = useState([]); //el array inicai vacio
  const [error, setError] = useState(null); //manejo de errores
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  //estados para los modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // codigo de actualización
  const [selectedEquipo, setSelectedEquipo] = useState(null); // codigo de actualización
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); //eliminacion de equipos
  const [equipoToDelete, setEquipoToDelete] = useState(null); //eliminacion de equipos

  const fetchEquipos = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get("/api/equipment");
      setEquipos(data);
      setError(null);
    } catch (error) {
      console.error("Error al cargar los equipos: ", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEquipos();

    const handleInventoryUpdate = () => {
      console.log("Recargando datos de inventario...");
      fetchEquipos();
    };

    globalThis.addEventListener("inventory-updated", handleInventoryUpdate);

    return () => {
      globalThis.removeEventListener(
        "inventory-updated",
        handleInventoryUpdate
      );
    };
  }, [fetchEquipos]);

  const handleEquipoAdded = (nuevoEquipo) => {
    setEquipos((prevEquipos) => [...prevEquipos, nuevoEquipo]);
  };

  //función para abrir el modal de edición
  const handleEditClick = (equipo) => {
    setSelectedEquipo(equipo);
    setIsEditModalOpen(true);
  };

  const handleEquipoUpdated = (equipoActualizado) => {
    setEquipos((prevEquipos) =>
      prevEquipos.map((equipo) =>
        equipo.id_equipo === equipoActualizado.id_equipo
          ? equipoActualizado
          : equipo
      )
    );
  };

  const handleDeleteClick = (equipo) => {
    setEquipoToDelete(equipo);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!equipoToDelete) return;

    try {
      await api.del(`/api/equipment/${equipoToDelete.id_equipo}`);

      // Actualiza el estado del frontend para remover el equipo eliminado
      setEquipos((prevEquipos) =>
        prevEquipos.filter(
          (equipo) => equipo.id_equipo !== equipoToDelete.id_equipo
        )
      );

      // Cierra el modal
      setIsDeleteModalOpen(false);
      setEquipoToDelete(null);
      globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'warning', message: 'Equipo eliminado' }}));
    } catch (error) {
      console.error("Error al eliminar:", error);
      globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: 'No se pudo eliminar el equipo.' }}));
    }
  };
  //--------------------------------------------------------------------------------------------------------------

  // Se crea la constante 'filteredEquipos' filtrando los 'equipos'
  const filteredEquipos = useMemo(
    () =>
      equipos.filter((equipo) =>
        equipo.nombre_equipo.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [equipos, searchTerm]
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredEquipos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEquipos.length / itemsPerPage);

  const capitalizeFirstLetter = (string) => {
    if (!string) return ""; // Devuelve vacío si no hay texto
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Función para manejar el estado visual (no cambia)
  const getEstadoClass = (estado) => {
    switch (estado) {
      case "disponible":
        return "bg-green-100 text-green-800";
      case "en_uso":
        return "bg-blue-100 text-blue-800";
      case "en_mantenimiento":
        return "bg-yellow-100 text-yellow-800";
      case "dañado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  /*Aquí termina mi lógica que llama a mi API*/

  const renderTableContent = () => {
    if (isLoading) {
      return [<Loader key="loader" colSpan={5} />];
    }

    if (error) {
      return [
        <tr key="error">
          <td colSpan="5" className="text-center py-5 text-red-500">
            Advertencia: {error}
          </td>
        </tr>,
      ];
    }
    if (filteredEquipos.length === 0) {
      return [
        <tr key="no-data">
          <td colSpan="5" className="text-center py-5 text-gray-500">
            No se encontraron equipos.
          </td>
        </tr>,
      ];
    }

    return currentItems.map((equipo) => (
      <tr
        key={equipo.id_equipo}
        className="border-b border-gray-200 hover:bg-gray-50"
      >
        <td className="py-3 px-5 font-medium">{equipo.nombre_equipo}</td>
        <td className="py-3 px-5 text-center">{equipo.cantidad}</td>
        <td className="py-3 px-5">{equipo.descripcion}</td>

        <td className="py-3 px-5">
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${getEstadoClass(
              equipo.estado
            )}`}
          >
            {equipo.estado === 'disponible'
              ? `Disponible: ${equipo.cantidad}`
              : capitalizeFirstLetter((equipo.estado || "").replace("_", " "))}
          </span>
        </td>
        <td className="py-3 px-5 text-center">
          <div className="flex item-center justify-center space-x-3">
            <button
              onClick={() => handleEditClick(equipo)}
              title="Editar"
              className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-blue-600 hover:text-white transition-colors duration-200"
            >
              <FaEdit size={19} />
            </button>
            <button
              onClick={() => handleDeleteClick(equipo)}
              title="Eliminar"
              className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-red-600 hover:text-white transition-colors duration-200"
            >
              <FaTrashAlt size={19} />
            </button>
          </div>
        </td>
      </tr>
    ));
  };

  return (
    <div className="flex flex-col min-h-full justify-between">
      <div className="flex-grow pb-4">
        {/* --- Controles de la Tabla --- */}
        <div className="flex items-center justify-end space-x-2 mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar equipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-50"
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <button className="flex items-center bg-white border border-gray-300 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
            <FiFilter className="mr-2" />
            Filtro
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 shadow"
          >
            <FaPlus className="mr-2" />
            Agregar
          </button>
        </div>

        {/* --- Tabla de Equipos --- */}
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="min-w-full w-full">
            <thead>
              <tr className="bg-gray-100 text-left text-gray-600 uppercase text-sm">
                <th className="py-3 px-5 font-semibold">Nombre del Equipo</th>
                <th className="py-3 px-5 font-semibold">Cantidad</th>
                <th className="py-3 px-5 font-semibold">Descripción</th>
                <th className="py-3 px-5 font-semibold">Estado</th>
                <th className="py-3 px-5 font-semibold text-center">Acciones</th>
              </tr>
            </thead>

            <tbody className="text-gray-800">{renderTableContent()}</tbody>
          </table>
        </div>
      </div>

      <div className="mt-4">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/*modal que hace inserciones ne la base de datos */}
      {isModalOpen && (
        <AddEquipment
          onClose={() => setIsModalOpen(false)}
          onEquipoAdded={handleEquipoAdded}
        />
      )}

      {/*actualiza la infromación modal*/}
      {isEditModalOpen && (
        <EditEquipment
          equipoToEdit={selectedEquipo}
          onClose={() => setIsEditModalOpen(false)}
          onEquipoUpdated={handleEquipoUpdated}
        />
      )}

      {isDeleteModalOpen && (
        <DeleteEquipment
          message={`Se eliminará "${equipoToDelete?.nombre_equipo}"`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      )}
    </div>
  );
}

export default Equipments;

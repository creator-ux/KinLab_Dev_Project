import React, { useEffect, useState } from "react";
import LoansEquipment from "../components/loans_request/LoansEquipment";
import LoansComponent from "../components/loans_request/LoansComponent";
import { useSearchParams } from "react-router-dom";

function SolicitudesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const resolveTab = (sp) => {
    const tabParam = sp.get("tab");
    if (tabParam === "equipos" || tabParam === "componentes") return tabParam;
    // Soporte para enlaces antiguos: ?equipos y ?componentes
    if (sp.has("equipos")) return "equipos";
    if (sp.has("componentes")) return "componentes";
    return "componentes"; // fallback
  };

  const [activeTab, setActiveTab] = useState(resolveTab(searchParams));

  // Sincroniza la pestaña activa cuando cambia el query param "tab"
  useEffect(() => {
    setActiveTab(resolveTab(searchParams));
  }, [searchParams]);

  return (
    <div className="p-4 md:p-6 lg:p-8 flex flex-col h-full">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Gestión de Solicitudes
      </h1>

      {/* --- Pestañas de Navegación (Tabs) --- */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => {
            setSearchParams({ tab: "equipos" });
          }}
          className={`py-2 px-4 font-semibold ${
            activeTab === "equipos"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Préstamos de Equipos
        </button>
        <button
          onClick={() => {
            setSearchParams({ tab: "componentes" });
          }}
          className={`py-2 px-4 font-semibold ${
            activeTab === "componentes"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Préstamos de Componentes
        </button>
      </div>

      {/* --- Contenido Condicional de las Pestañas --- */}
      <div className="flex-grow min-h-0">
        {activeTab === "equipos" ? <LoansEquipment /> : <LoansComponent />}
      </div>
    </div>
  );
}

export default SolicitudesPage;

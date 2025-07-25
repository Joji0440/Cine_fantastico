'use client';

import { useState, useEffect } from 'react';

interface Asiento {
  id: string;
  fila: string;
  numero: number;
  ocupado: boolean;
  seleccionado: boolean;
  tipo: 'standard' | 'vip' | 'discapacitado';
}

interface SelectorAsientosProps {
  salaId: string;
  funcionId: string;
  capacidadTotal: number;
  asientosOcupados: number;
  onAsientosSeleccionados: (asientos: Asiento[]) => void;
  maxAsientos: number;
}

export default function SelectorAsientos({ 
  capacidadTotal, 
  asientosOcupados, 
  onAsientosSeleccionados, 
  maxAsientos 
}: SelectorAsientosProps) {
  const [asientos, setAsientos] = useState<Asiento[]>([]);
  const [asientosSeleccionados, setAsientosSeleccionados] = useState<Asiento[]>([]);

  // Generar asientos basado en capacidad
  useEffect(() => {
    const generarAsientos = () => {
      const asientosGenerados: Asiento[] = [];
      const filas = Math.ceil(capacidadTotal / 12); // Máximo 12 asientos por fila
      const asientosPorFila = Math.ceil(capacidadTotal / filas);

      // Generar asientos ocupados aleatoriamente para demo
      const asientosOcupadosRandom = new Set<string>();
      while (asientosOcupadosRandom.size < asientosOcupados) {
        const filaRandom = Math.floor(Math.random() * filas);
        const numeroRandom = Math.floor(Math.random() * asientosPorFila) + 1;
        const letra = String.fromCharCode(65 + filaRandom); // A, B, C, etc.
        asientosOcupadosRandom.add(`${letra}${numeroRandom}`);
      }

      for (let fila = 0; fila < filas; fila++) {
        const letraFila = String.fromCharCode(65 + fila); // A, B, C, etc.
        
        for (let numero = 1; numero <= asientosPorFila && asientosGenerados.length < capacidadTotal; numero++) {
          const id = `${letraFila}${numero}`;
          const esVip = fila >= filas - 2; // Últimas 2 filas son VIP
          
          asientosGenerados.push({
            id,
            fila: letraFila,
            numero,
            ocupado: asientosOcupadosRandom.has(id),
            seleccionado: false,
            tipo: esVip ? 'vip' : 'standard'
          });
        }
      }

      return asientosGenerados;
    };

    setAsientos(generarAsientos());
  }, [capacidadTotal, asientosOcupados]);

  const toggleAsiento = (asientoId: string) => {
    if (asientosSeleccionados.length >= maxAsientos && !asientos.find(a => a.id === asientoId)?.seleccionado) {
      return; // No permitir más selecciones
    }

    setAsientos(prevAsientos => {
      const nuevosAsientos = prevAsientos.map(asiento => {
        if (asiento.id === asientoId && !asiento.ocupado) {
          return { ...asiento, seleccionado: !asiento.seleccionado };
        }
        return asiento;
      });

      const seleccionados = nuevosAsientos.filter(a => a.seleccionado);
      setAsientosSeleccionados(seleccionados);
      
      // Usar setTimeout para evitar el error de setState durante render
      setTimeout(() => {
        onAsientosSeleccionados(seleccionados);
      }, 0);

      return nuevosAsientos;
    });
  };

  const getAsientoClase = (asiento: Asiento) => {
    if (asiento.ocupado) {
      return 'bg-red-500 cursor-not-allowed';
    }
    if (asiento.seleccionado) {
      return asiento.tipo === 'vip' 
        ? 'bg-yellow-500 border-yellow-300' 
        : 'bg-blue-500 border-blue-300';
    }
    if (asiento.tipo === 'vip') {
      return 'bg-yellow-200 hover:bg-yellow-300 border-yellow-400';
    }
    return 'bg-gray-200 hover:bg-gray-300 border-gray-400';
  };

  // Agrupar asientos por fila
  const filas = asientos.reduce((acc, asiento) => {
    if (!acc[asiento.fila]) {
      acc[asiento.fila] = [];
    }
    acc[asiento.fila].push(asiento);
    return acc;
  }, {} as Record<string, Asiento[]>);

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Pantalla */}
      <div className="mb-8 text-center">
        <div className="mx-auto w-3/4 h-3 bg-gradient-to-r from-gray-400 to-gray-600 rounded-lg mb-2"></div>
        <p className="text-gray-400 text-sm">PANTALLA</p>
      </div>

      {/* Mapa de asientos */}
      <div className="space-y-3 mb-6">
        {Object.entries(filas)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([fila, asientosFila]) => (
            <div key={fila} className="flex items-center justify-center gap-2">
              {/* Etiqueta de fila */}
              <div className="w-8 text-center font-semibold text-white">
                {fila}
              </div>
              
              {/* Asientos de la fila */}
              <div className="flex gap-1">
                {asientosFila
                  .sort((a, b) => a.numero - b.numero)
                  .map((asiento, index) => (
                    <div key={asiento.id}>
                      {/* Pasillo en el medio */}
                      {index === Math.floor(asientosFila.length / 2) && (
                        <div className="w-8"></div>
                      )}
                      
                      <button
                        onClick={() => toggleAsiento(asiento.id)}
                        disabled={asiento.ocupado}
                        className={`
                          w-8 h-8 rounded-md border-2 text-xs font-semibold
                          transition-all duration-200 transform hover:scale-110
                          ${getAsientoClase(asiento)}
                          ${asiento.ocupado ? '' : 'cursor-pointer'}
                        `}
                        title={`${asiento.fila}${asiento.numero} - ${
                          asiento.ocupado ? 'Ocupado' : 
                          asiento.tipo === 'vip' ? 'VIP' : 'Estándar'
                        }`}
                      >
                        {asiento.numero}
                      </button>
                    </div>
                  ))}
              </div>
              
              {/* Etiqueta de fila (derecha) */}
              <div className="w-8 text-center font-semibold text-white">
                {fila}
              </div>
            </div>
          ))}
      </div>

      {/* Leyenda */}
      <div className="flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 border border-gray-400 rounded"></div>
          <span className="text-white">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 border border-blue-300 rounded"></div>
          <span className="text-white">Seleccionado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-white">Ocupado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-200 border border-yellow-400 rounded"></div>
          <span className="text-white">VIP</span>
        </div>
      </div>

      {/* Información de selección */}
      {asientosSeleccionados.length > 0 && (
        <div className="mt-6 p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
          <h4 className="text-white font-semibold mb-2">
            Asientos seleccionados ({asientosSeleccionados.length}/{maxAsientos})
          </h4>
          <div className="flex flex-wrap gap-2">
            {asientosSeleccionados.map(asiento => (
              <span 
                key={asiento.id}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  asiento.tipo === 'vip' 
                    ? 'bg-yellow-500 text-black' 
                    : 'bg-blue-500 text-white'
                }`}
              >
                {asiento.fila}{asiento.numero} {asiento.tipo === 'vip' && '👑'}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

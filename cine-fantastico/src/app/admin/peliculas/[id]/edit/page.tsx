"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface FormData {
  titulo: string;
  sinopsis: string;
  director: string;
  reparto: string;
  genero: string;
  duracion_minutos: number;
  clasificacion: string;
  idioma_original: string;
  pais_origen: string;
  fecha_estreno_mundial: string;
  fecha_estreno_local: string;
  calificacion_imdb: number;
  poster_url: string;
  trailer_url: string;
  activa: boolean;
}

interface Genero {
  id: string;
  nombre: string;
}

interface Pais {
  id: string;
  nombre: string;
  codigo_iso: string;
}

export default function EditarPeliculaPage() {
  const [formData, setFormData] = useState<FormData>({
    titulo: "",
    sinopsis: "",
    director: "",
    reparto: "",
    genero: "",
    duracion_minutos: 0,
    clasificacion: "PG",
    idioma_original: "",
    pais_origen: "",
    fecha_estreno_mundial: "",
    fecha_estreno_local: "",
    calificacion_imdb: 0,
    poster_url: "",
    trailer_url: "",
    activa: true,
  });

  const [generos, setGeneros] = useState<Genero[]>([]);
  const [paises, setPaises] = useState<Pais[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const params = useParams();
  const peliculaId = params.id as string;

  const clasificaciones = ["PG", "PG_13", "R", "NC_17", "G"];

  // Cargar datos al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [peliculaRes, generosRes, paisesRes] = await Promise.all([
          fetch(`/api/admin/peliculas/${peliculaId}`),
          fetch('/api/generos'),
          fetch('/api/paises')
        ]);

        if (peliculaRes.ok) {
          const peliculaData = await peliculaRes.json();
          if (peliculaData.success) {
            const pelicula = peliculaData.pelicula;
            setFormData({
              titulo: pelicula.titulo || "",
              sinopsis: pelicula.sinopsis || "",
              director: pelicula.director || "",
              reparto: pelicula.reparto || "",
              genero: pelicula.genero || "",
              duracion_minutos: pelicula.duracion_minutos || 0,
              clasificacion: pelicula.clasificacion || "PG",
              idioma_original: pelicula.idioma_original || "",
              pais_origen: pelicula.pais_origen || "",
              fecha_estreno_mundial: pelicula.fecha_estreno_mundial || "",
              fecha_estreno_local: pelicula.fecha_estreno_local || "",
              calificacion_imdb: pelicula.calificacion_imdb || 0,
              poster_url: pelicula.poster_url || "",
              trailer_url: pelicula.trailer_url || "",
              activa: pelicula.activa !== false,
            });
          }
        }

        if (generosRes.ok) {
          const generosData = await generosRes.json();
          setGeneros(generosData.generos || []);
        }

        if (paisesRes.ok) {
          const paisesData = await paisesRes.json();
          setPaises(paisesData.paises || []);
        }
      } catch (err) {
        console.error('Error cargando datos:', err);
        setError('Error al cargar los datos de la película');
      } finally {
        setLoadingData(false);
      }
    };

    if (peliculaId) {
      cargarDatos();
    }
  }, [peliculaId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: target.checked
      }));
    } else if (type === "number") {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      // Si es una URL de imagen, limpiarla y validarla
      let processedValue = value;
      if (name === 'poster_url' || name === 'trailer_url') {
        processedValue = value.trim();
        // Opcional: agregar validación básica de URL aquí si es necesario
        if (processedValue && !processedValue.startsWith('http')) {
          processedValue = 'https://' + processedValue;
        }
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: processedValue
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validaciones básicas
    if (!formData.titulo.trim()) {
      setError("El título es obligatorio");
      setIsLoading(false);
      return;
    }

    if (formData.duracion_minutos <= 0) {
      setError("La duración debe ser mayor a 0 minutos");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/peliculas/${peliculaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/admin/peliculas");
        }, 2000);
      } else {
        setError(data.error || "Error al actualizar la película");
      }
    } catch (err) {
      console.error("Error en handleSubmit:", err);
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Cargando película...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-8">
            <div className="text-green-400 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-green-300 mb-2">¡Película actualizada!</h2>
            <p className="text-gray-300 mb-4">
              Los cambios han sido guardados exitosamente.
            </p>
            <Link 
              href="/admin/peliculas"
              className="text-yellow-400 hover:text-yellow-300 font-medium"
            >
              Ver todas las películas
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Link 
                href="/admin/peliculas"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-yellow-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✏️</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Editar Película</h1>
                <p className="text-sm text-gray-400">{formData.titulo || 'Cargando...'}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-8 shadow-2xl">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información Básica */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-2">
                Información Básica
              </h2>

              {/* Título */}
              <div>
                <label htmlFor="titulo" className="block text-sm font-medium text-gray-300 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  id="titulo"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                  placeholder="Título de la película"
                  required
                />
              </div>

              {/* Sinopsis */}
              <div>
                <label htmlFor="sinopsis" className="block text-sm font-medium text-gray-300 mb-2">
                  Sinopsis
                </label>
                <textarea
                  id="sinopsis"
                  name="sinopsis"
                  value={formData.sinopsis}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Descripción de la película"
                />
              </div>

              {/* Director y Reparto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="director" className="block text-sm font-medium text-gray-300 mb-2">
                    Director
                  </label>
                  <input
                    type="text"
                    id="director"
                    name="director"
                    value={formData.director}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                    placeholder="Nombre del director"
                  />
                </div>

                <div>
                  <label htmlFor="reparto" className="block text-sm font-medium text-gray-300 mb-2">
                    Reparto Principal
                  </label>
                  <input
                    type="text"
                    id="reparto"
                    name="reparto"
                    value={formData.reparto}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                    placeholder="Actor 1, Actor 2, Actor 3..."
                  />
                </div>
              </div>
            </div>

            {/* Detalles Técnicos */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-2">
                Detalles Técnicos
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Género */}
                <div>
                  <label htmlFor="genero" className="block text-sm font-medium text-gray-300 mb-2">
                    Género
                  </label>
                  <select
                    id="genero"
                    name="genero"
                    value={formData.genero}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Seleccionar género</option>
                    {generos.map((genero) => (
                      <option key={genero.id} value={genero.nombre} className="bg-gray-800">
                        {genero.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duración */}
                <div>
                  <label htmlFor="duracion_minutos" className="block text-sm font-medium text-gray-300 mb-2">
                    Duración (min) *
                  </label>
                  <input
                    type="number"
                    id="duracion_minutos"
                    name="duracion_minutos"
                    value={formData.duracion_minutos}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                    placeholder="120"
                    required
                  />
                </div>

                {/* Clasificación */}
                <div>
                  <label htmlFor="clasificacion" className="block text-sm font-medium text-gray-300 mb-2">
                    Clasificación *
                  </label>
                  <select
                    id="clasificacion"
                    name="clasificacion"
                    value={formData.clasificacion}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                    required
                  >
                    {clasificaciones.map((clasificacion) => (
                      <option key={clasificacion} value={clasificacion} className="bg-gray-800">
                        {clasificacion === "PG_13" ? "PG-13" : clasificacion}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Idioma Original */}
                <div>
                  <label htmlFor="idioma_original" className="block text-sm font-medium text-gray-300 mb-2">
                    Idioma Original
                  </label>
                  <input
                    type="text"
                    id="idioma_original"
                    name="idioma_original"
                    value={formData.idioma_original}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                    placeholder="Español, Inglés, etc."
                  />
                </div>

                {/* País de Origen */}
                <div>
                  <label htmlFor="pais_origen" className="block text-sm font-medium text-gray-300 mb-2">
                    País de Origen
                  </label>
                  <select
                    id="pais_origen"
                    name="pais_origen"
                    value={formData.pais_origen}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Seleccionar país</option>
                    {paises.map((pais) => (
                      <option key={pais.id} value={pais.nombre} className="bg-gray-800">
                        {pais.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Fechas y Calificaciones */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-2">
                Fechas y Calificaciones
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Fecha Estreno Mundial */}
                <div>
                  <label htmlFor="fecha_estreno_mundial" className="block text-sm font-medium text-gray-300 mb-2">
                    Fecha Estreno Mundial
                  </label>
                  <input
                    type="date"
                    id="fecha_estreno_mundial"
                    name="fecha_estreno_mundial"
                    value={formData.fecha_estreno_mundial}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                {/* Fecha Estreno Local */}
                <div>
                  <label htmlFor="fecha_estreno_local" className="block text-sm font-medium text-gray-300 mb-2">
                    Fecha Estreno Local
                  </label>
                  <input
                    type="date"
                    id="fecha_estreno_local"
                    name="fecha_estreno_local"
                    value={formData.fecha_estreno_local}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                {/* Calificación IMDB */}
                <div>
                  <label htmlFor="calificacion_imdb" className="block text-sm font-medium text-gray-300 mb-2">
                    Calificación IMDB (0-10)
                  </label>
                  <input
                    type="number"
                    id="calificacion_imdb"
                    name="calificacion_imdb"
                    value={formData.calificacion_imdb}
                    onChange={handleChange}
                    min="0"
                    max="10"
                    step="0.1"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                    placeholder="8.5"
                  />
                </div>
              </div>
            </div>

            {/* URLs y Estado */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-2">
                Multimedia y Estado
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Poster URL */}
                <div>
                  <label htmlFor="poster_url" className="block text-sm font-medium text-gray-300 mb-2">
                    URL del Poster
                  </label>
                  <input
                    type="url"
                    id="poster_url"
                    name="poster_url"
                    value={formData.poster_url}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                    placeholder="https://m.media-amazon.com/images/... o cualquier URL de imagen"
                  />
                </div>

                {/* Trailer URL */}
                <div>
                  <label htmlFor="trailer_url" className="block text-sm font-medium text-gray-300 mb-2">
                    URL del Trailer
                  </label>
                  <input
                    type="url"
                    id="trailer_url"
                    name="trailer_url"
                    value={formData.trailer_url}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                    placeholder="https://youtube.com/watch?v=... o https://youtu.be/..."
                  />
                </div>
              </div>

              {/* Estado Activa */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="activa"
                  name="activa"
                  checked={formData.activa}
                  onChange={handleChange}
                  className="h-4 w-4 text-red-500 focus:ring-red-500 border-gray-300 rounded"
                />
                <label htmlFor="activa" className="ml-2 block text-sm text-gray-300">
                  Película activa (visible en cartelera)
                </label>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-4 pt-6 border-t border-white/20">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-red-600 to-yellow-600 hover:from-red-700 hover:to-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Guardando cambios...
                  </div>
                ) : (
                  "Actualizar Película"
                )}
              </button>

              <Link
                href="/admin/peliculas"
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 text-center"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

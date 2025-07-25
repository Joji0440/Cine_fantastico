import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';

async function getPeliculas() {
  try {
    const peliculas = await prisma.peliculas.findMany({
      take: 10,
      orderBy: {
        fecha_creacion: 'desc'
      }
    });
    return peliculas;
  } catch (error) {
    console.error('Error fetching movies:', error);
    return [];
  }
}

export default async function PeliculasPage() {
  const peliculas = await getPeliculas();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al inicio
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-yellow-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎬</span>
            </div>
            <h1 className="text-4xl font-bold">
              <span className="text-red-500">Cine</span>{" "}
              <span className="text-yellow-500">Fantástico</span> - Cartelera
            </h1>
          </div>
        </div>

        {/* Movies Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {peliculas.length > 0 ? (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            peliculas.map((pelicula: Record<string, any>) => (
              <div 
                key={pelicula.id} 
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-2xl hover:scale-105 transition-transform duration-300"
              >
                <div className="mb-4">
                  {pelicula.poster_url && (
                    <Image 
                      src={pelicula.poster_url} 
                      alt={pelicula.titulo}
                      width={300}
                      height={400}
                      className="w-full h-64 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h3 className="text-xl font-bold text-white mb-2">{pelicula.titulo}</h3>
                  <p className="text-yellow-400 font-medium">
                    {pelicula.clasificacion} • {pelicula.duracion_minutos} min
                  </p>
                </div>

                <div className="space-y-2 text-sm text-gray-300">
                  <p><strong>Director:</strong> {pelicula.director || 'No especificado'}</p>
                  <p><strong>Idioma:</strong> {pelicula.idioma_original || 'No especificado'}</p>
                  <p><strong>Estreno Mundial:</strong> {pelicula.fecha_estreno_mundial ? new Date(pelicula.fecha_estreno_mundial).toLocaleDateString() : 'No especificado'}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-gray-300 text-sm">{pelicula.sinopsis?.substring(0, 100)}...</p>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <div className="text-yellow-400">
                    ⭐ {pelicula.calificacion_imdb ? (typeof pelicula.calificacion_imdb === 'number' ? pelicula.calificacion_imdb.toFixed(1) : Number(pelicula.calificacion_imdb).toFixed(1)) : 'N/A'}
                  </div>
                  <button className="bg-gradient-to-r from-red-600 to-yellow-600 hover:from-red-700 hover:to-yellow-700 text-white font-semibold px-4 py-2 rounded-lg transition-all duration-200">
                    Ver Funciones
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">🎬</div>
              <h3 className="text-2xl font-bold text-white mb-2">No hay películas disponibles</h3>
              <p className="text-gray-400">
                La cartelera se encuentra vacía en este momento.
              </p>
            </div>
          )}
        </div>

        {peliculas.length > 0 && (
          <div className="text-center mt-12">
            <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200">
              Cargar más películas
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

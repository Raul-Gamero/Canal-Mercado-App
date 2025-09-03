'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Market } from '@/lib/supabase'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function MarketsPage() {
  const { userRole } = useAuth()
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userRole?.role === 'admin') {
      fetchMarkets()
    }
  }, [userRole])

  const fetchMarkets = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('markets')
        .select('*')
        .order('name')

      if (error) throw error
      if (data) setMarkets(data)

    } catch (error) {
      console.error('Error fetching markets:', error)
    } finally {
      setLoading(false)
    }
  }

  if (userRole?.role !== 'admin') {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <div>Acceso denegado</div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-gray-900">
              Mercados
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Gestiona todos los mercados y centros comerciales
            </p>
          </div>

          {/* Markets List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : markets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay mercados registrados.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ciudad
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha de Creación
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {markets.map((market) => (
                        <tr key={market.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {market.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {market.city}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {new Date(market.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                // View market details
                                console.log('View market:', market)
                              }}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              Ver
                            </button>
                            <button
                              onClick={() => {
                                // Edit market
                                console.log('Edit market:', market)
                              }}
                              className="text-green-600 hover:text-green-900 mr-4"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => {
                                // View devices for this market
                                console.log('View devices for market:', market)
                              }}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              Dispositivos
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

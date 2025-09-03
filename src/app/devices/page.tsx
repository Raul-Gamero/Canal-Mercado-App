'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Device, Market } from '@/lib/supabase'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function DevicesPage() {
  const { userRole } = useAuth()
  const [devices, setDevices] = useState<Device[]>([])
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDevices()
    if (userRole?.role === 'admin') {
      fetchMarkets()
    }
  }, [userRole])

  const fetchDevices = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('devices')
        .select('*')
        .order('name')

      // Apply role-based filtering
      if (userRole?.role === 'market') {
        // Markets only see their own devices
        query = query.eq('market_id', userRole.market_id)
      }

      const { data, error } = await query

      if (error) throw error
      if (data) setDevices(data)

    } catch (error) {
      console.error('Error fetching devices:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMarkets = async () => {
    try {
      const { data, error } = await supabase
        .from('markets')
        .select('*')
        .order('name')

      if (error) throw error
      if (data) setMarkets(data)

    } catch (error) {
      console.error('Error fetching markets:', error)
    }
  }

  const getMarketName = (marketId: string) => {
    const market = markets.find(m => m.id === marketId)
    return market ? `${market.name} - ${market.city}` : marketId
  }

  const getDeviceTypeLabel = (type: string) => {
    switch (type) {
      case 'tv':
        return { text: 'Televisión', color: 'bg-blue-100 text-blue-800' }
      case 'camera':
        return { text: 'Cámara', color: 'bg-green-100 text-green-800' }
      default:
        return { text: type, color: 'bg-gray-100 text-gray-800' }
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-gray-900">
              Dispositivos
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {userRole?.role === 'market' 
                ? 'Dispositivos de tu mercado' 
                : 'Todos los dispositivos del sistema'
              }
            </p>
          </div>

          {/* Devices List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : devices.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay dispositivos disponibles.</p>
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
                          Tipo
                        </th>
                        {userRole?.role === 'admin' && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Mercado
                          </th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha de Creación
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {devices.map((device) => {
                        const typeInfo = getDeviceTypeLabel(device.type)
                        return (
                          <tr key={device.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {device.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${typeInfo.color}`}>
                                {typeInfo.text}
                              </span>
                            </td>
                            {userRole?.role === 'admin' && (
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {getMarketName(device.market_id)}
                                </div>
                              </td>
                            )}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {new Date(device.created_at).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => {
                                  // View device details
                                  console.log('View device:', device)
                                }}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                Ver
                              </button>
                              <button
                                onClick={() => {
                                  // View playbacks for this device
                                  console.log('View playbacks for device:', device)
                                }}
                                className="text-green-600 hover:text-green-900"
                              >
                                Reproducciones
                              </button>
                            </td>
                          </tr>
                        )
                      })}
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

'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Campaign } from '@/lib/supabase'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function CampaignsPage() {
  const { userRole } = useAuth()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCampaigns()
  }, [userRole])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })

      // Apply role-based filtering
      if (userRole?.role === 'client') {
        // Clients only see their own campaigns
        query = query.eq('client', userRole.user_id)
      } else if (userRole?.role === 'market') {
        // Markets see campaigns that are active on their devices
        // This would need a more complex query in a real scenario
        // For now, we'll show all campaigns
      }

      const { data, error } = await query

      if (error) throw error
      if (data) setCampaigns(data)

    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (startDate: string, endDate: string) => {
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (now < start) {
      return { text: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' }
    } else if (now >= start && now <= end) {
      return { text: 'Activa', color: 'bg-green-100 text-green-800' }
    } else {
      return { text: 'Finalizada', color: 'bg-gray-100 text-gray-800' }
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-gray-900">
              Campañas
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {userRole?.role === 'client' 
                ? 'Tus campañas publicitarias' 
                : 'Todas las campañas publicitarias'
              }
            </p>
          </div>

          {/* Campaigns List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay campañas disponibles.</p>
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
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha Inicio
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha Fin
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {campaigns.map((campaign) => {
                        const status = getStatusBadge(campaign.start_date, campaign.end_date)
                        return (
                          <tr key={campaign.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {campaign.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {campaign.client}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {new Date(campaign.start_date).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {new Date(campaign.end_date).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                                {status.text}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => {
                                  // View campaign details
                                  console.log('View campaign:', campaign)
                                }}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                Ver
                              </button>
                              <button
                                onClick={() => {
                                  // Generate report for this campaign
                                  console.log('Generate report for:', campaign)
                                }}
                                className="text-green-600 hover:text-green-900"
                              >
                                Reporte
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

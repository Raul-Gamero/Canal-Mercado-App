'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Report } from '@/lib/supabase'
import ReportGenerator from '@/components/reports/ReportGenerator'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function ReportsPage() {
  const { userRole } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [userRole])

  const fetchReports = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })

      // Apply role-based filtering
      if (userRole?.role === 'client') {
        // Clients only see reports for their campaigns
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('id')
          .eq('client', userRole.user_id)
        
        if (campaigns && campaigns.length > 0) {
          const campaignIds = campaigns.map(c => c.id)
          query = query.in('campaign_id', campaignIds)
        }
      } else if (userRole?.role === 'market') {
        // Markets only see reports for campaigns on their devices
        const { data: devices } = await supabase
          .from('devices')
          .select('id')
          .eq('market_id', userRole.market_id)
        
        if (devices && devices.length > 0) {
          const deviceIds = devices.map(d => d.id)
          // This would need a more complex query in a real scenario
          // For now, we'll show all reports for markets
        }
      }

      const { data, error } = await query

      if (error) throw error
      if (data) setReports(data)

    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-gray-900">
              Reportes
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Genera y visualiza reportes de campañas publicitarias
            </p>
          </div>

          {/* Report Generator */}
          <div className="mb-8">
            <ReportGenerator userRole={userRole} />
          </div>

          {/* Existing Reports */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Reportes Generados
              </h3>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay reportes generados aún.</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Usa el generador de arriba para crear tu primer reporte.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Campaña
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
                      {reports.map((report) => (
                        <tr key={report.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {report.id.slice(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {report.campaign_id.slice(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(report.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                // View report details
                                console.log('View report:', report)
                              }}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              Ver
                            </button>
                            <button
                              onClick={() => {
                                // Download report
                                console.log('Download report:', report)
                              }}
                              className="text-green-600 hover:text-green-900"
                            >
                              Descargar
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

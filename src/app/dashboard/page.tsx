'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Campaign, Market, Playback } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function Dashboard() {
  const { userRole } = useAuth()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [markets, setMarkets] = useState<Market[]>([])
  const [playbacks, setPlaybacks] = useState<Playback[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      
      let campaignsQuery = supabase
        .from('campaigns')
        .select('*')
        .gte('end_date', new Date().toISOString().split('T')[0])

      const marketsQuery = supabase.from('markets').select('*')
      let playbacksQuery = supabase.from('playbacks').select('*')

      // Apply role-based filtering
      if (userRole?.role === 'client') {
        // Clients only see their own campaigns
        campaignsQuery = campaignsQuery.eq('client', userRole.user_id)
      } else if (userRole?.role === 'market') {
        // Markets only see campaigns for their devices
        const { data: devices } = await supabase
          .from('devices')
          .select('id')
          .eq('market_id', userRole.market_id)
        
        if (devices && devices.length > 0) {
          const deviceIds = devices.map(d => d.id)
          playbacksQuery = playbacksQuery.in('device_id', deviceIds)
        }
      }

      const [campaignsResult, marketsResult, playbacksResult] = await Promise.all([
        campaignsQuery,
        marketsQuery,
        playbacksQuery
      ])

      if (campaignsResult.data) setCampaigns(campaignsResult.data)
      if (marketsResult.data) setMarkets(marketsResult.data)
      if (playbacksResult.data) setPlaybacks(playbacksResult.data)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [userRole])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const getCampaignStats = () => {
    const totalCampaigns = campaigns.length
    const activeCampaigns = campaigns.filter(c => 
      new Date(c.start_date) <= new Date() && new Date(c.end_date) >= new Date()
    ).length
    
    const totalPlaybacks = playbacks.length
    const totalDuration = playbacks.reduce((sum, p) => sum + p.duration, 0)

    return {
      totalCampaigns,
      activeCampaigns,
      totalPlaybacks,
      totalDuration: Math.round(totalDuration / 60) // Convert to minutes
    }
  }

  const getMarketData = () => {
    if (userRole?.role === 'market') {
      return markets.filter(m => m.id === userRole.market_id)
    }
    return markets
  }

  const getPlaybackData = () => {
    const marketPlaybacks = playbacks.reduce((acc, playback) => {
      // This would need to be joined with devices and markets in a real query
      const marketId = 'market-1' // Placeholder
      acc[marketId] = (acc[marketId] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(marketPlaybacks).map(([marketId, count]) => ({
      market: marketId,
      playbacks: count
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const stats = getCampaignStats()
  const marketData = getMarketData()
  const playbackData = getPlaybackData()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Bienvenido al panel de control de Canal Mercado
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Campañas
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalCampaigns}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Campañas Activas
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.activeCampaigns}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Reproducciones
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalPlaybacks}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Tiempo Total (min)
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalDuration}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Playbacks by Market */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Reproducciones por Mercado
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={playbackData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="market" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="playbacks" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Campaign Status */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Estado de Campañas
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Activas', value: stats.activeCampaigns, color: '#10B981' },
                    { name: 'Inactivas', value: stats.totalCampaigns - stats.activeCampaigns, color: '#6B7280' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    { name: 'Activas', value: stats.activeCampaigns, color: '#10B981' },
                    { name: 'Inactivas', value: stats.totalCampaigns - stats.activeCampaigns, color: '#6B7280' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Campaigns */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Campañas Recientes
            </h3>
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {campaigns.slice(0, 5).map((campaign) => {
                    const isActive = new Date(campaign.start_date) <= new Date() && new Date(campaign.end_date) >= new Date()
                    return (
                      <tr key={campaign.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {campaign.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {campaign.client}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(campaign.start_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(campaign.end_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {isActive ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Campaign, Playback, Market, UserRole } from '@/lib/supabase'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

interface ReportGeneratorProps {
  userRole: UserRole | null
}

interface ReportData {
  campaigns: Campaign[]
  playbacks: Playback[]
  dateRange: {
    startDate: string
    endDate: string
  }
  selectedMarket: string
}

export default function ReportGenerator({ userRole }: ReportGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [selectedMarket, setSelectedMarket] = useState<string>('all')
  const [markets, setMarkets] = useState<Market[]>([])

  useEffect(() => {
    fetchMarkets()
  }, [])

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

  const generateReport = async (format: 'pdf' | 'excel') => {
    setLoading(true)
    try {
      const reportData = await fetchReportData()
      
      if (format === 'pdf') {
        generatePDF(reportData)
      } else {
        generateExcel(reportData)
      }
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReportData = async (): Promise<ReportData> => {
    let campaignsQuery = supabase
      .from('campaigns')
      .select('*')
      .gte('start_date', dateRange.startDate)
      .lte('end_date', dateRange.endDate)

    let playbacksQuery = supabase
      .from('playbacks')
      .select('*')
      .gte('date', dateRange.startDate)
      .lte('date', dateRange.endDate)

    // Apply role-based filtering
    if (userRole?.role === 'client') {
      campaignsQuery = campaignsQuery.eq('client', userRole.user_id)
    } else if (userRole?.role === 'market') {
      const { data: devices } = await supabase
        .from('devices')
        .select('id')
        .eq('market_id', userRole.market_id)
      
      if (devices && devices.length > 0) {
        const deviceIds = devices.map(d => d.id)
        playbacksQuery = playbacksQuery.in('device_id', deviceIds)
      }
    }

    // Apply market filter if selected
    if (selectedMarket !== 'all') {
      const { data: devices } = await supabase
        .from('devices')
        .select('id')
        .eq('market_id', selectedMarket)
      
      if (devices && devices.length > 0) {
        const deviceIds = devices.map(d => d.id)
        playbacksQuery = playbacksQuery.in('device_id', deviceIds)
      }
    }

    const [campaignsResult, playbacksResult] = await Promise.all([
      campaignsQuery,
      playbacksQuery
    ])

    return {
      campaigns: campaignsResult.data || [],
      playbacks: playbacksResult.data || [],
      dateRange,
      selectedMarket
    }
  }

  const generatePDF = (data: ReportData) => {
    const doc = new jsPDF()
    
    // Title
    doc.setFontSize(20)
    doc.text('Reporte de Campañas - Canal Mercado', 20, 20)
    
    // Date range
    doc.setFontSize(12)
    doc.text(`Período: ${new Date(data.dateRange.startDate).toLocaleDateString()} - ${new Date(data.dateRange.endDate).toLocaleDateString()}`, 20, 35)
    
    // Market info
    if (data.selectedMarket !== 'all') {
      const market = markets.find(m => m.id === data.selectedMarket)
      if (market) {
        doc.text(`Mercado: ${market.name} - ${market.city}`, 20, 45)
      }
    }

    // Campaigns table
    doc.setFontSize(14)
    doc.text('Resumen de Campañas', 20, 60)
    
    const campaignData = data.campaigns.map((c: Campaign) => [
      c.name,
      c.client,
      new Date(c.start_date).toLocaleDateString(),
      new Date(c.end_date).toLocaleDateString(),
      data.playbacks.filter((p: Playback) => p.campaign_id === c.id).length
    ])

    autoTable(doc, {
      head: [['Nombre', 'Cliente', 'Inicio', 'Fin', 'Reproducciones']],
      body: campaignData,
      startY: 70,
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
      },
    })

    // Playbacks summary
    const totalPlaybacks = data.playbacks.length
    const totalDuration = data.playbacks.reduce((sum: number, p: Playback) => sum + p.duration, 0)
    
    doc.setFontSize(14)
    doc.text('Resumen de Reproducciones', 20, 200)
    
    const summaryData = [
      ['Total Reproducciones', totalPlaybacks.toString()],
      ['Tiempo Total (segundos)', totalDuration.toString()],
      ['Tiempo Total (minutos)', Math.round(totalDuration / 60).toString()],
      ['Tiempo Total (horas)', Math.round(totalDuration / 3600).toString()],
    ]

    autoTable(doc, {
      body: summaryData,
      startY: 220,
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
    })

    // Save PDF
    doc.save(`reporte-canal-mercado-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const generateExcel = (data: ReportData) => {
    // Create workbook
    const wb = XLSX.utils.book_new()
    
    // Campaigns sheet
    const campaignData = data.campaigns.map((c: Campaign) => ({
      'Nombre': c.name,
      'Cliente': c.client,
      'Fecha Inicio': new Date(c.start_date).toLocaleDateString(),
      'Fecha Fin': new Date(c.end_date).toLocaleDateString(),
      'Reproducciones': data.playbacks.filter((p: Playback) => p.campaign_id === c.id).length
    }))
    
    const campaignsSheet = XLSX.utils.json_to_sheet(campaignData)
    XLSX.utils.book_append_sheet(wb, campaignsSheet, 'Campañas')
    
    // Playbacks sheet
    const playbackData = data.playbacks.map((p: Playback) => ({
      'Fecha': p.date,
      'Hora': p.time,
      'Duración (seg)': p.duration,
      'ID Campaña': p.campaign_id,
      'ID Dispositivo': p.device_id
    }))
    
    const playbacksSheet = XLSX.utils.json_to_sheet(playbackData)
    XLSX.utils.book_append_sheet(wb, playbacksSheet, 'Reproducciones')
    
    // Summary sheet
    const totalPlaybacks = data.playbacks.length
    const totalDuration = data.playbacks.reduce((sum: number, p: Playback) => sum + p.duration, 0)
    
    const summaryData = [
      ['Métrica', 'Valor'],
      ['Total Campañas', data.campaigns.length],
      ['Total Reproducciones', totalPlaybacks],
      ['Tiempo Total (segundos)', totalDuration],
      ['Tiempo Total (minutos)', Math.round(totalDuration / 60)],
      ['Tiempo Total (horas)', Math.round(totalDuration / 3600)],
      ['Período Inicio', new Date(data.dateRange.startDate).toLocaleDateString()],
      ['Período Fin', new Date(data.dateRange.endDate).toLocaleDateString()],
    ]
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Resumen')
    
    // Save Excel file
    XLSX.writeFile(wb, `reporte-canal-mercado-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Generador de Reportes
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha Inicio
          </label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha Fin
          </label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {userRole?.role === 'admin' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mercado
            </label>
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los Mercados</option>
              {markets.map((market) => (
                <option key={market.id} value={market.id}>
                  {market.name} - {market.city}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      <div className="flex space-x-4">
        <button
          onClick={() => generateReport('pdf')}
          disabled={loading}
          className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
        >
          {loading ? 'Generando...' : 'Exportar PDF'}
        </button>
        
        <button
          onClick={() => generateReport('excel')}
          disabled={loading}
          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
        >
          {loading ? 'Generando...' : 'Exportar Excel'}
        </button>
      </div>
      
      <p className="text-sm text-gray-500 mt-4">
        Los reportes incluirán todas las campañas y reproducciones del período seleccionado.
      </p>
    </div>
  )
}

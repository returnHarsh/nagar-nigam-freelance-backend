import React, { useEffect, useState } from "react"
import { ApiClient } from "adminjs"

const api = new ApiClient()

const ShowTaxDetails = (props) => {
  const { record } = props
  
  const [taxData, setTaxData] = useState({
    dueTax: null,
    totalTax: null,
    loading: false,
    error: null
  })

  /**
   * Fetch tax details from the backend via AdminJS API
   */
  const fetchTaxDetails = async (propertyId) => {
    try {
      setTaxData(prev => ({ ...prev, loading: true, error: null }))

      // ✅ Call the backend action
      const response = await api.resourceAction({
        resourceId: "Tax", // Change to your resource ID
        actionName: "getTaxDetails",
        params: {
          propertyId: propertyId
        }
      })

      console.log('Tax details response:', response)

      if (response.data) {
        setTaxData({
          dueTax: response.data.data.dueTax || 0,
          totalTax: response.data.data.totalTax || 0,
          loading: false,
          error: response.data.error || null
        })
      } else {
        setTaxData({
          dueTax: 0,
          totalTax: 0,
          loading: false,
          error: 'No data returned from server'
        })
      }

    } catch (err) {
      console.error("[Error] in ShowTaxDetails component:", err.message)
      setTaxData({
        dueTax: null,
        totalTax: null,
        loading: false,
        error: 'Failed to fetch tax details'
      })
    }
  }

  useEffect(() => {
    const propertyId = record?.params?.propertyId
    
    if (propertyId) {
      fetchTaxDetails(propertyId)
    } else {
      // Reset state if no propertyId
      setTaxData({
        dueTax: null,
        totalTax: null,
        loading: false,
        error: null
      })
    }
  }, [record?.params?.propertyId])

  // Styles (keeping your existing styles)
  const containerStyle = {
    padding: "15px",
    marginBottom: "20px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderRadius: "10px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    color: "white"
  }

  const headerStyle = {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  }

  const taxGridStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
    marginTop: "10px"
  }

  const taxCardStyle = {
    background: "rgba(255, 255, 255, 0.2)",
    backdropFilter: "blur(10px)",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.3)"
  }

  const labelStyle = {
    fontSize: "12px",
    opacity: 0.9,
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  }

  const valueStyle = {
    fontSize: "24px",
    fontWeight: "700",
    display: "flex",
    alignItems: "baseline",
    gap: "4px"
  }

  const currencyStyle = {
    fontSize: "18px",
    fontWeight: "500"
  }

  const loadingStyle = {
    textAlign: "center",
    padding: "20px",
    opacity: 0.8
  }

  const errorStyle = {
    background: "rgba(255, 107, 107, 0.2)",
    padding: "12px",
    borderRadius: "6px",
    border: "1px solid rgba(255, 107, 107, 0.4)",
    fontSize: "14px"
  }

  const noDataStyle = {
    textAlign: "center",
    padding: "15px",
    opacity: 0.8,
    fontSize: "14px"
  }

  // Icon component
  const TaxIcon = () => (
    <svg 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <line x1="3" y1="9" x2="21" y2="9"/>
      <line x1="9" y1="21" x2="9" y2="9"/>
    </svg>
  )

  // Loading state
  if (taxData.loading) {
    return (
      <div style={containerStyle}>
        <div style={loadingStyle}>
          <span>Loading tax details...</span>
        </div>
      </div>
    )
  }

  // No property selected
  if (!record?.params?.propertyId) {
    return (
      <div style={containerStyle}>
        <div style={noDataStyle}>
          <span>📋 Select a Property to view tax details</span>
        </div>
      </div>
    )
  }

  // Error state
  if (taxData.error && taxData.dueTax === null) {
    return (
      <div style={containerStyle}>
        <div style={errorStyle}>
          <span>⚠️ {taxData.error}</span>
        </div>
      </div>
    )
  }

  // Success state with data
  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <TaxIcon />
        <span>Tax Information</span>
      </div>

      <div style={taxGridStyle}>
        {/* Due Tax Card */}
        <div style={taxCardStyle}>
          <div style={labelStyle}>Due Tax</div>
          <div style={valueStyle}>
            <span style={currencyStyle}>₹</span>
            <span>{taxData.dueTax?.toLocaleString('en-IN') || '0'}</span>
          </div>
        </div>

        {/* Total Tax Card */}
        <div style={taxCardStyle}>
          <div style={labelStyle}>Total Tax</div>
          <div style={valueStyle}>
            <span style={currencyStyle}>₹</span>
            <span>{taxData.totalTax?.toLocaleString('en-IN') || '0'}</span>
          </div>
        </div>
      </div>

      {/* Optional: Show calculation info */}
      {taxData.dueTax > 0 && (
        <div style={{
          marginTop: "12px",
          fontSize: "12px",
          opacity: 0.85,
          padding: "8px",
          background: "rgba(255, 255, 255, 0.15)",
          borderRadius: "6px"
        }}>
          💡 Due amount needs to be paid
        </div>
      )}
    </div>
  )
}

export default ShowTaxDetails
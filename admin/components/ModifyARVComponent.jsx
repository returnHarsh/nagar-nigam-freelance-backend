import React, { useEffect, useState } from "react"
import { ApiClient } from "adminjs"

const api = new ApiClient()

const ModifyARVComponent = (props) => {
  const { record } = props
  
  const [state, setState] = useState({
    currentARV: null,
    currentTotalTax: null,
    estimatedARV: '',
    estimatedNewTax: null,
    bakaya : 0,
    loading: false,
    calculating: false,
    error: null,
    dueTax : null,
  })

  /**
   * Fetch current ARV and Tax details
   */
  const fetchTaxARV = async (propertyId) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const response = await api.resourceAction({
        resourceId: "Tax",
        actionName: "getTaxARV",
        params: { propertyId }
      })

      console.log("RESPONSE IS : ", response)

      if (response.data) {
        setState(prev => ({
          ...prev,
          currentARV: response.data?.data?.currentARV || 0,
          currentTotalTax: response.data?.data?.currentTotalTax || 0,
          bakaya : response.data?.data?.bakaya || 0,
          loading: false,
          error: response.data?.data?.error || null,
          dueAmount : response.data?.data?.dueAmount,
          paidAmount : response?.data?.data?.paidAmount || 0
        }))
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'No data returned from server'
        }))
      }
    } catch (err) {
      console.error("[Error] fetching tax ARV:", err)
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch tax details'
      }))
    }
  }

  /**
   * Calculate estimated tax based on user input ARV
   */
  const calculateEstimatedTax = async (estimatedARV) => {
    if (!estimatedARV || isNaN(estimatedARV) || estimatedARV <= 0) {
      setState(prev => ({ ...prev, estimatedNewTax: null }))
      return
    }

    try {
      setState(prev => ({ ...prev, calculating: true, error: null }))

      const houseTax = Math.round((10 / 100) * estimatedARV);
	    const waterTax = Math.round((7.5 / 100) * estimatedARV);
	    const totalTax = houseTax + waterTax + state.bakaya;

        setState(prev => ({
          ...prev,
          estimatedNewTax: totalTax,
          calculating: false
      }))

    } catch (err) {
      console.error("[Error] calculating estimated tax:", err)
      setState(prev => ({
        ...prev,
        calculating: false,
        error: 'Failed to calculate tax estimate'
      }))
    }
  }

  /**
   * Handle ARV input change with debounce
   */
  const handleARVChange = (value) => {
    setState(prev => ({ ...prev, estimatedARV: value, estimatedNewTax: null }))
    
    // Clear previous timer
    if (state.debounceTimer) clearTimeout(state.debounceTimer)
    
    // Set new timer for calculation
    const timer = setTimeout(() => {
      calculateEstimatedTax(value)
    }, 800) // 800ms debounce
    
    setState(prev => ({ ...prev, debounceTimer: timer }))
  }

  useEffect(() => {
    const propertyId = record?.params?.propertyId
    
    if (propertyId) {
      fetchTaxARV(propertyId)
    }
    
    // Cleanup
    return () => {
      if (state.debounceTimer) clearTimeout(state.debounceTimer)
    }
  }, [record?.params?.propertyId])

  // Styles
  const containerStyle = {
    padding: "20px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    color: "white",
    marginBottom: "20px"
  }

  const cardStyle = {
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "10px",
    padding: "20px",
    marginTop: "15px",
    color: "#333"
  }

  const headerStyle = {
    fontSize: "18px",
    fontWeight: "700",
    marginBottom: "15px",
    display: "flex",
    alignItems: "center",
    gap: "10px"
  }

  const statGridStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
    marginBottom: "20px"
  }

  const statBoxStyle = {
    background: "rgba(102, 126, 234, 0.1)",
    padding: "15px",
    borderRadius: "8px",
    border: "2px solid rgba(102, 126, 234, 0.3)"
  }

  const labelStyle = {
    fontSize: "12px",
    fontWeight: "600",
    color: "#666",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  }

  const valueStyle = {
    fontSize: "24px",
    fontWeight: "700",
    color: "#667eea",
    display: "flex",
    alignItems: "baseline",
    gap: "4px"
  }

  const inputGroupStyle = {
    marginBottom: "20px"
  }

  const inputStyle = {
    width: "90%",
    padding: "12px",
    fontSize: "16px",
    borderRadius: "6px",
    border: "2px solid #e0e0e0",
    transition: "border-color 0.3s",
    fontFamily: "inherit"
  }

  const estimatedTaxStyle = {
    background: "rgba(76, 175, 80, 0.1)",
    padding: "15px",
    borderRadius: "8px",
    border: "2px solid rgba(76, 175, 80, 0.3)",
    marginTop: "15px"
  }

  const infoBoxStyle = {
    background: "rgba(33, 150, 243, 0.1)",
    padding: "12px",
    borderRadius: "6px",
    fontSize: "13px",
    color: "#1976d2",
    marginTop: "15px",
    display: "flex",
    alignItems: "start",
    gap: "8px"
  }

  if (state.loading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center", padding: "20px" }}>
          Loading ARV details...
        </div>
      </div>
    )
  }

  if (!record?.params?.propertyId) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center", padding: "20px" }}>
          Select a Property to view ARV calculator
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
        <span>ARV & Tax Calculator</span>
      </div>

      {state.error && (
        <div style={{
          background: "rgba(244, 67, 54, 0.9)",
          padding: "12px",
          borderRadius: "6px",
          marginBottom: "15px",
          fontSize: "14px"
        }}>
          ⚠️ {state.error}
        </div>
      )}

      <div style={cardStyle}>
        {/* Current Stats */}
        <div style={statGridStyle}>
          <div style={statBoxStyle}>
            <div style={labelStyle}>Current ARV</div>
            <div style={valueStyle}>
              {/* <span style={{ fontSize: "18px" }}>₹</span> */}
              <span>{state.currentARV?.toLocaleString('en-IN') || '0'}</span>
            </div>
          </div>

          <div style={statBoxStyle}>
            <div style={labelStyle}>Current Total Tax</div>
            <div style={valueStyle}>
              <span style={{ fontSize: "18px" }}>₹</span>
              <span>{state.currentTotalTax?.toLocaleString('en-IN') || '0'}</span>
            </div>
          </div>

          <div style={statBoxStyle}>
            <div style={labelStyle}>Due Amount</div>
            <div style={valueStyle}>
              <span style={{ fontSize: "18px" }}>₹</span>
              <span>{state.dueAmount?.toLocaleString('en-IN') || '0'}</span>
            </div>
          </div>

          <div style={statBoxStyle}>
            <div style={labelStyle}>Total Paid Amount</div>
            <div style={valueStyle}>
              <span style={{ fontSize: "18px" }}>₹</span>
              <span>{state.paidAmount?.toLocaleString('en-IN') || '0'}</span>
            </div>
          </div>

        </div>

        {/* ARV Estimator */}
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Estimate New ARV</label>
          <input
            type="number"
            style={inputStyle}
            placeholder="Enter estimated ARV to calculate tax"
            value={state.estimatedARV}
            onChange={(e) => handleARVChange(e.target.value)}
            min="0"
            step="100"
          />
          {state.calculating && (
            <div style={{ fontSize: "12px", color: "#666", marginTop: "5px", fontStyle: "italic" }}>
              Calculating estimated tax...
            </div>
          )}
        </div>

        {/* Estimated Tax Result */}
        {state.estimatedNewTax !== null && (
          <>
          <div style={estimatedTaxStyle}>
            <div style={labelStyle}>Estimated Total Tax</div>
            <div style={{ ...valueStyle, color: "#4CAF50" }}>
              <span style={{ fontSize: "18px" }}>₹</span>
              <span>{state.estimatedNewTax.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
              Tax difference: ₹{Math.abs(state.estimatedNewTax - state.currentTotalTax).toLocaleString('en-IN')}
              {state.estimatedNewTax > state.currentTotalTax ? ' (increase ↑)' : ' (decrease ↓)'}
            </div>
            
          </div>

          <div style={estimatedTaxStyle}>
            <div style={labelStyle}> New Amount To Paid</div>
            <div style={{ ...valueStyle, color: "#4CAF50" }}>
              <span style={{ fontSize: "18px" }}>₹</span>
              <span>{ (state.estimatedNewTax - state.paidAmount).toLocaleString('en-IN') }</span>
            </div>
            {/* <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
              Tax difference: ₹{Math.abs(state.estimatedNewTax - state.currentTotalTax).toLocaleString('en-IN')}
              {state.estimatedNewTax > state.currentTotalTax ? ' (increase ↑)' : ' (decrease ↓)'}
            </div> */}
            
          </div>
          </>
        )}

        {/* Info Box */}
        <div style={infoBoxStyle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
          <span>
            This is an estimation tool. Use it to preview tax changes before entering the actual modification details in the form fields below.
          </span>
        </div>
      </div>
    </div>
  )
}

export default ModifyARVComponent
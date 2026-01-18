import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminDashboardStats = () => {
  const [stats, setStats] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [wards, setWards] = useState([]);
  const [selectedWard, setSelectedWard] = useState("");

  const fetchStats = async (wardNumber) => {
    try {
      const res = await axios({
        url: `https://api.npup.in/bewar/admin-info/stats/?wardNumber=${wardNumber}`,
        method: "get",
        // data: { wardNumber: wardNumber }
      });

      console.log("stats are:", res.data.data);
      setStats(res.data.data);
    } catch (err) {
      console.log("Error loading stats:", err.message);
    }
  };

  const fetchWardDetails = async () => {
    try {
      const res = (await axios({
        url: "https://api.npup.in/bewar/admin-info/ward-details",
        method: "get"
      })).data;

      console.log("res is:", res);
      setWards(res?.data || []);
    } catch (err) {
      console.log("[ERROR] in fetchWardDetails", err.message);
    }
  };

  const handleWardChange = (e) => {
    let newWard = e.target.value == "allWards" ? undefined : e.target.value;
	console.log("new ward is : " , newWard)
    setSelectedWard(newWard);
    fetchStats(newWard);
  };

  useEffect(() => {
    fetchStats(selectedWard);
    fetchWardDetails();
  }, []);

  if (!stats) return <div style={styles.loading}>Loading...</div>;

  const formatNumber = (num) => {
    return num?.toLocaleString() || "0";
  };

  const cards = [
    {
      title: "TOTAL PROPERTIES",
      value: formatNumber(stats.totalProperties),
      change: "+2.5%",
      changeText: "vs last month",
      icon: "🏢",
      bgColor: "linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)",
      iconBg: "#1E40AF",
      positive: true,
    },
    {
      title: "RESIDENTIAL",
      value: formatNumber(stats.totalResidentialProperty),
      change: "+1.8%",
      changeText: "vs last month",
      icon: "🏠",
      bgColor: "linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)",
      iconBg: "#0891B2",
      positive: true,
    },
    {
      title: "NON-RESIDENTIAL",
      value: formatNumber(stats.totalCommercialProperty),
      change: "-5.2%",
      changeText: "vs last month",
      icon: "🏢",
      bgColor: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
      iconBg: "#EA580C",
      positive: false,
    },
    {
      title: "MIXED PROPERTIES",
      value: formatNumber(stats.totalMixedProperty),
      change: "+3.1%",
      changeText: "vs last month",
      icon: "👥",
      bgColor: "linear-gradient(135deg, #E2E8F0 0%, #CBD5E1 100%)",
      iconBg: "#475569",
      positive: true,
    },
  ];

  const taxCards = [
    {
      title: "TOTAL TAX",
      value: `₹${formatNumber(stats.taxStats.totalTax)}`,
      subtitle: "Overall tax liability",
      icon: "📄",
      bgColor: "linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)",
      iconBg: "#F59E0B",
    },
    {
      title: "TOTAL TAX PAID",
      value: `₹${formatNumber(stats.taxStats.totalAmountPaid)}`,
      subtitle: "Amount collected",
      icon: "✅",
      bgColor: "linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)",
      iconBg: "#059669",
    },
    {
      title: "DUE TAX AMOUNT",
      value: `₹${formatNumber(stats.taxStats.dueTaxAmount)}`,
      subtitle: "Outstanding amount",
      icon: "⏰",
      bgColor: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
      iconBg: "#DC2626",
    },
    {
      title: "TOTAL ARV",
      value: `₹${formatNumber(stats.taxStats.totalARV)}`,
      subtitle: "Annual Rental Value",
      icon: "💰",
      bgColor: "linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)",
      iconBg: "#9333EA",
    },
    {
      title: "TOTAL BAKAYA",
      value: `₹${formatNumber(stats.taxStats.totalBakaya)}`,
      subtitle: "Arrears amount",
      icon: "📊",
      bgColor: "linear-gradient(135deg, #FED7AA 0%, #FDBA74 100%)",
      iconBg: "#C2410C",
    },
    {
      title: "INTEREST ON BAKAYA",
      value: `₹${formatNumber(stats.taxStats.totalInterestAmountOnBakaya)}`,
      subtitle: `Rate: ${stats.taxStats.interestRate}%`,
      icon: "📈",
      bgColor: "linear-gradient(135deg, #FECACA 0%, #FCA5A5 100%)",
      iconBg: "#B91C1C",
    },
    {
      title: "TAX WITHOUT BAKAYA",
      value: `₹${formatNumber(stats.taxStats.totalTaxWithoutBakaya)}`,
      subtitle: "Current year tax",
      icon: "🧾",
      bgColor: "linear-gradient(135deg, #BAE6FD 0%, #7DD3FC 100%)",
      iconBg: "#0284C7",
    },
  ];

  const taxStatusCards = [
    {
      title: "Pending Payments",
      value: formatNumber(stats.taxStats.taxStatus?.pending || 0),
      icon: "⏳",
      iconBg: "#F59E0B",
      bgColor: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
    },
    {
      title: "Partial Payments",
      value: formatNumber(stats.taxStats.taxStatus?.partial || 0),
      icon: "📝",
      iconBg: "#3B82F6",
      bgColor: "linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)",
    },
    {
      title: "Fully Paid",
      value: formatNumber(stats.taxStats.taxStatus?.paid || 0),
      icon: "✔️",
      iconBg: "#10B981",
      bgColor: "linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)",
    },
  ];

  const kpiCards = [
    {
      title: "Total Survey Done",
      value: formatNumber(stats.surveyStats.total),
      icon: "🎯",
      iconBg: "#10B981",
      bgColor: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
    },
    {
      title: "Total Successful Survey",
      value: formatNumber(stats.surveyStats.verified),
      icon: "🛡️",
      iconBg: "#3B82F6",
      bgColor: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
    },
    {
      title: "Verification Window",
      value: stats.verificationStats.formattedVerification,
      icon: "⚡",
      iconBg: "#F59E0B",
      bgColor: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)",
    },
    {
      title: "Success Rate RN",
      value: `${stats.surveyStats.verifiedPercent || "0"}%`,
      icon: "🌐",
      iconBg: "#8B5CF6",
      bgColor: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)",
    },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.topBar}>
          <div style={styles.dateBadge}>
            <span style={styles.dateIcon}>📅</span>
            <span style={styles.dateText}>
              Today,{" "}
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          <div style={styles.wardSelectContainer}>
            <label style={styles.wardLabel}>Ward</label>
            <select
              value={selectedWard}
              onChange={handleWardChange}
              style={styles.wardSelect}
            >
              {wards.length === 0 ? (
                <option value={selectedWard}>All Wards</option>
              ) : (
                [{ wardNumber: "", ward: "All Wards" }, ...wards].map((ward) => (
                  <option key={ward.wardNumber} value={ward.wardNumber}>
                    {ward.wardNumber ? `Ward ${ward.wardNumber} - ${ward.ward}` : ward.ward}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <h1 style={styles.title}>Welcome back, Admin</h1>
        <p style={styles.subtitle}>
          Monitor your property surveys, track progress across zones, and manage
          your team's activities from this comprehensive dashboard.
        </p>
      </div>

      <div style={styles.content}>
        {/* Property Cards */}
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Property Overview</h2>
        </div>
        <div style={styles.grid4}>
          {cards.map((card, idx) => (
            <div
              key={idx}
              style={{
                ...styles.card,
                background: card.bgColor,
                transform: hoveredCard === `card-${idx}` ? "translateY(-8px)" : "translateY(0)",
                boxShadow: hoveredCard === `card-${idx}` 
                  ? "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)"
                  : "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              }}
              onMouseEnter={() => setHoveredCard(`card-${idx}`)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div style={styles.cardContent}>
                <div style={styles.cardInfo}>
                  <div style={styles.cardTitle}>{card.title}</div>
                  <div style={styles.cardValue}>{card.value}</div>
                  <div style={styles.changeContainer}>
                    <span
                      style={{
                        ...styles.change,
                        color: card.positive ? "#059669" : "#DC2626",
                      }}
                    >
                      {card.positive ? "↗" : "↘"} {card.change}
                    </span>
                    <span style={styles.changeText}>{card.changeText}</span>
                  </div>
                </div>
                <div style={{ ...styles.iconBox, background: card.iconBg }}>
                  <span style={styles.iconEmoji}>{card.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tax Cards */}
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Tax Analytics</h2>
        </div>
        <div style={styles.grid3}>
          {taxCards.map((card, idx) => (
            <div
              key={idx}
              style={{
                ...styles.card,
                background: card.bgColor,
                transform: hoveredCard === `tax-${idx}` ? "translateY(-8px)" : "translateY(0)",
                boxShadow: hoveredCard === `tax-${idx}` 
                  ? "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)"
                  : "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              }}
              onMouseEnter={() => setHoveredCard(`tax-${idx}`)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div style={styles.cardContent}>
                <div style={styles.cardInfo}>
                  <div style={styles.cardTitle}>{card.title}</div>
                  <div style={styles.cardValue}>{card.value}</div>
                  <div style={styles.subtitle2}>{card.subtitle}</div>
                </div>
                <div style={{ ...styles.iconBox, background: card.iconBg }}>
                  <span style={styles.iconEmoji}>{card.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tax Status Cards */}
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Payment Status</h2>
        </div>
        <div style={styles.grid3}>
          {taxStatusCards.map((card, idx) => (
            <div
              key={idx}
              style={{
                ...styles.card,
                background: card.bgColor,
                transform: hoveredCard === `status-${idx}` ? "translateY(-8px)" : "translateY(0)",
                boxShadow: hoveredCard === `status-${idx}` 
                  ? "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)"
                  : "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              }}
              onMouseEnter={() => setHoveredCard(`status-${idx}`)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div style={styles.cardContent}>
                <div style={styles.cardInfo}>
                  <div style={styles.kpiTitle}>{card.title}</div>
                  <div style={styles.kpiValue}>{card.value}</div>
                </div>
                <div style={{ ...styles.kpiIcon, background: card.iconBg }}>
                  <span style={styles.iconEmoji}>{card.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* KPI Cards */}
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Survey Metrics</h2>
        </div>
        <div style={styles.grid4}>
          {kpiCards.map((card, idx) => (
            <div
              key={idx}
              style={{
                ...styles.card,
                background: card.bgColor,
                transform: hoveredCard === `kpi-${idx}` ? "translateY(-8px)" : "translateY(0)",
                boxShadow: hoveredCard === `kpi-${idx}` 
                  ? "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)"
                  : "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              }}
              onMouseEnter={() => setHoveredCard(`kpi-${idx}`)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div style={styles.cardContent}>
                <div style={styles.cardInfo}>
                  <div style={styles.kpiTitle}>{card.title}</div>
                  <div style={styles.kpiValue}>{card.value}</div>
                </div>
                <div style={{ ...styles.kpiIcon, background: card.iconBg }}>
                  <span style={styles.iconEmoji}>{card.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "80vh",
    background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)",
    padding: "40px 32px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    overflow: "scroll"
  },
  loading: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    color: "#64748B",
    fontWeight: "500",
  },
  header: {
    maxWidth: "1400px",
    margin: "0 auto 56px",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "28px",
    gap: "20px",
    flexWrap: "wrap",
  },
  dateBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    background: "#FFFFFF",
    padding: "10px 20px",
    borderRadius: "50px",
    fontSize: "14px",
    color: "#475569",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)",
    border: "1px solid #E2E8F0",
    fontWeight: "500",
  },
  dateIcon: {
    fontSize: "18px",
  },
  dateText: {
    color: "#334155",
  },
  wardSelectContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "#FFFFFF",
    padding: "10px 20px",
    borderRadius: "50px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)",
    border: "1px solid #E2E8F0",
  },
  wardLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  wardSelect: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1E293B",
    border: "none",
    background: "transparent",
    outline: "none",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "8px",
    transition: "background 0.2s",
  },
  title: {
    fontSize: "52px",
    fontWeight: "700",
    color: "#1E293B",
    margin: "0 0 20px 0",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "18px",
    color: "#64748B",
    maxWidth: "800px",
    lineHeight: "1.7",
    margin: 0,
    fontWeight: "400",
  },
  content: {
    maxWidth: "1400px",
    margin: "0 auto",
  },
  sectionHeader: {
    marginBottom: "20px",
  },
  sectionTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#1E293B",
    margin: 0,
    letterSpacing: "-0.3px",
  },
  grid4: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "28px",
    marginBottom: "48px",
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "28px",
    marginBottom: "48px",
  },
  card: {
    borderRadius: "20px",
    padding: "28px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    cursor: "pointer",
    border: "1px solid rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(10px)",
  },
  cardContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: "1px",
    marginBottom: "14px",
    textTransform: "uppercase",
  },
  cardValue: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: "14px",
    lineHeight: "1.1",
  },
  subtitle2: {
    fontSize: "13px",
    color: "#64748B",
    fontWeight: "500",
    marginTop: "8px",
  },
  changeContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  change: {
    fontSize: "15px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  changeText: {
    fontSize: "13px",
    color: "#64748B",
    fontWeight: "500",
  },
  iconBox: {
    width: "64px",
    height: "64px",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    boxShadow: "0 8px 16px -4px rgba(0, 0, 0, 0.2)",
    flexShrink: 0,
  },
  iconEmoji: {
    filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))",
  },
  kpiTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#334155",
    marginBottom: "14px",
    lineHeight: "1.4",
  },
  kpiValue: {
    fontSize: "40px",
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: "1.1",
  },
  kpiIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    boxShadow: "0 8px 16px -4px rgba(0, 0, 0, 0.2)",
    flexShrink: 0,
  },
};

export default AdminDashboardStats;
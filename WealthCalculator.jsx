import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ReferenceLine,
  Label
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Flame, 
  Info,
  CalendarDays,
  PiggyBank,
  AlertTriangle,
  Gauge,
  Activity,
  Eye,
  EyeOff,
  Target,
  Scissors
} from 'lucide-react';

// --- Helper Components ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl ${className}`}>
    {children}
  </div>
);

const StatCard = ({ label, value, subtext, icon: Icon, colorClass, actionElement }) => (
  <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 flex flex-col justify-between hover:bg-slate-700/40 transition-colors duration-300 relative group min-h-[110px]">
    <div className="flex justify-between items-start mb-2">
      <div className={`p-2 rounded-lg bg-opacity-20 ${colorClass.replace('text-', 'bg-')}`}>
        <Icon className={`w-5 h-5 ${colorClass}`} />
      </div>
      {actionElement && (
        <div className="opacity-90 group-hover:opacity-100 transition-opacity">
          {actionElement}
        </div>
      )}
    </div>
    <div>
      <h3 className="text-slate-400 text-sm font-medium mb-1 flex items-center gap-2">
        {label}
      </h3>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
    </div>
  </div>
);

const InputGroup = ({ label, value, onChange, min, max, step = 1, unit = "", icon: Icon, color = "emerald" }) => {
  const accentColor = color === "rose" ? "accent-rose-500" : "accent-emerald-500";
  const ringColor = color === "rose" ? "focus:ring-rose-500/50" : "focus:ring-emerald-500/50";
  const iconColor = color === "rose" ? "text-rose-400" : "text-emerald-400";
  const badgeBg = color === "rose" ? "bg-rose-900/30 border-rose-900/50 text-rose-300" : "bg-emerald-900/30 border-emerald-900/50 text-emerald-300";

  return (
    <div className="mb-6 group">
      <div className="flex justify-between items-center mb-2">
        <label className="flex items-center text-sm font-medium text-slate-300 gap-2">
          {Icon && <Icon className={`w-4 h-4 ${iconColor}`} />}
          {label}
        </label>
        <span className={`text-sm font-mono px-2 py-0.5 rounded border ${badgeBg}`}>
          {unit === "$" ? "$" : ""}{value.toLocaleString()}{unit !== "$" ? unit : ""}
        </span>
      </div>
      <div className="relative h-6 flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer ${accentColor} hover:brightness-110 transition-all focus:outline-none focus:ring-2 ${ringColor}`}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <span>{unit === "$" ? "$" : ""}{min}</span>
        <span>{unit === "$" ? "$" : ""}{max}</span>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label, isInflationAdjusted }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 border border-slate-700 p-4 rounded-lg shadow-2xl backdrop-blur-xl z-50">
        <p className="text-slate-300 font-medium mb-2">Year {label}</p>
        <div className="space-y-2">
          <div className="pt-1 pb-1 border-b border-slate-700/50">
             <p className="text-emerald-300 text-xs uppercase tracking-wider font-semibold">Probable Outcomes</p>
          </div>
          
          <div className="flex justify-between items-center gap-6">
            <span className="text-emerald-400 text-xs">Optimistic (90th %)</span>
            <span className="font-mono text-emerald-400 font-bold">
              ${(isInflationAdjusted ? data.optimisticReal : data.optimistic).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>

          <div className="flex justify-between items-center gap-6">
            <span className="text-slate-200 text-sm font-bold">Median (Expected)</span>
            <span className="font-mono text-white font-bold text-lg">
              ${(isInflationAdjusted ? data.medianReal : data.median).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          
          <div className="flex justify-between items-center gap-6">
            <span className="text-rose-400 text-xs">Pessimistic (10th %)</span>
            <span className="font-mono text-rose-400 font-bold">
              ${(isInflationAdjusted ? data.pessimisticReal : data.pessimistic).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>

          <p className="text-slate-500 text-xs mt-2 pt-2 border-t border-slate-700">
             Principal: ${(data.totalPrincipal).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          
          {isInflationAdjusted && (
             <p className="text-amber-500/80 text-[10px] mt-1">
               *Values adjusted for {data.inflationRate}% inflation
             </p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

// --- Helpers for Monte Carlo ---

// Box-Muller transform for normal distribution
const randn_bm = () => {
  let u = 0, v = 0;
  while(u === 0) u = Math.random(); 
  while(v === 0) v = Math.random();
  return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
};

export default function WealthCalculator() {
  // State for inputs
  const [initialAmount, setInitialAmount] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [years, setYears] = useState(25);
  const [annualReturn, setAnnualReturn] = useState(8);
  const [inflationRate, setInflationRate] = useState(3);
  const [expenseRatio, setExpenseRatio] = useState(0.1);
  
  // Risk Scenarios
  const [isStressTest, setIsStressTest] = useState(false);
  const [marketTemp, setMarketTemp] = useState('Normal'); 
  
  // State for Toggle
  const [isInflationAdjusted, setIsInflationAdjusted] = useState(false);

  // Calculation Logic (Monte Carlo)
  const { data, summary, grindYear, grindPercent } = useMemo(() => {
    const SIMULATIONS = 500;
    const VOLATILITY = 0.15; 
    
    // Arrays to store simulation outcomes
    // Each index 'i' corresponds to year 'i', containing an array of 500 simulation values
    const simulationResults = Array.from({ length: years + 1 }, () => []);
    const grossSimulationResults = Array.from({ length: years + 1 }, () => []); // For calculating lost fees
    const principalOverTime = Array.from({ length: years + 1 }, () => 0);

    // Run Simulations
    for (let sim = 0; sim < SIMULATIONS; sim++) {
      let currentBalanceNet = initialAmount;
      let currentBalanceGross = initialAmount;
      let currentPrincipal = initialAmount;
      
      // Year 0
      simulationResults[0].push(currentBalanceNet);
      grossSimulationResults[0].push(currentBalanceGross);
      if (sim === 0) principalOverTime[0] = currentPrincipal;

      for (let year = 1; year <= years; year++) {
        let effectiveAnnualReturn = annualReturn;
        
        // Market Temperature Logic
        if (year <= 5) {
          if (marketTemp === 'High') effectiveAnnualReturn -= 3;
          if (marketTemp === 'Low') effectiveAnnualReturn += 3;
        }

        // Generate Random Return
        let randomReturn = (effectiveAnnualReturn / 100) + (randn_bm() * VOLATILITY);
        
        // Stress Test Logic
        if (isStressTest && year === 5) {
            randomReturn = -0.30; 
        }
        
        // Gross Return (No Fees)
        currentBalanceGross = currentBalanceGross * (1 + randomReturn);
        
        // Net Return (Fees Subtracted)
        // Fees are subtracted from the return before compounding
        const netReturn = randomReturn - (expenseRatio / 100);
        currentBalanceNet = currentBalanceNet * (1 + netReturn);
        
        // Contributions
        const yearlyContribution = monthlyContribution * 12;
        currentBalanceGross += yearlyContribution;
        currentBalanceNet += yearlyContribution;
        currentPrincipal += yearlyContribution;

        // Store
        grossSimulationResults[year].push(currentBalanceGross);
        simulationResults[year].push(currentBalanceNet);
        
        if (sim === 0) {
           principalOverTime[year] = currentPrincipal;
        }
      }
    }

    // Identify the "Grind" year (First time crossing 100k median nominal NET)
    let grindYearFound = null;

    // Process Statistics
    const yearlyData = simulationResults.map((balances, year) => {
      balances.sort((a, b) => a - b);
      
      const pessimistic = balances[Math.floor(balances.length * 0.1)]; 
      const median = balances[Math.floor(balances.length * 0.5)];      
      const optimistic = balances[Math.floor(balances.length * 0.9)];  

      if (grindYearFound === null && median >= 100000) {
        grindYearFound = year;
      }

      const discountFactor = Math.pow(1 + inflationRate / 100, year);

      return {
        year,
        pessimistic: Math.round(pessimistic),
        median: Math.round(median),
        optimistic: Math.round(optimistic),
        
        pessimisticReal: Math.round(pessimistic / discountFactor),
        medianReal: Math.round(median / discountFactor),
        optimisticReal: Math.round(optimistic / discountFactor),
        
        coneDelta: Math.round(optimistic - pessimistic),
        coneDeltaReal: Math.round((optimistic - pessimistic) / discountFactor),

        totalPrincipal: principalOverTime[year],
        inflationRate
      };
    });

    const finalData = yearlyData[yearlyData.length - 1];
    
    // Calculate Lost to Fees based on Median differences
    const finalGrossBalances = grossSimulationResults[years];
    finalGrossBalances.sort((a, b) => a - b);
    const medianGross = finalGrossBalances[Math.floor(finalGrossBalances.length * 0.5)];
    const medianNet = finalData.median;

    // Calculate Real values for summary
    const discountFactorFinal = Math.pow(1 + inflationRate / 100, years);
    
    const finalBalance = isInflationAdjusted ? finalData.medianReal : medianNet;
    const finalPrincipal = finalData.totalPrincipal;
    const totalGrowth = finalBalance - finalPrincipal;

    // Lost to Fees
    const lostToFeesNominal = medianGross - medianNet;
    const lostToFeesReal = lostToFeesNominal / discountFactorFinal;
    const lostToFees = isInflationAdjusted ? lostToFeesReal : lostToFeesNominal;

    // Gradient offset calculation for 100k line
    const grindPercentVal = grindYearFound === null 
        ? 1 
        : grindYearFound === 0 
            ? 0 
            : grindYearFound / years;

    return { 
      data: yearlyData, 
      grindYear: grindYearFound,
      grindPercent: grindPercentVal,
      summary: {
        balance: finalBalance,
        principal: finalPrincipal,
        growth: totalGrowth,
        lostToFees: lostToFees
      }
    };
  }, [initialAmount, monthlyContribution, years, annualReturn, inflationRate, isInflationAdjusted, isStressTest, marketTemp, expenseRatio]);

  const keyMap = useMemo(() => ({
    pessimistic: isInflationAdjusted ? "pessimisticReal" : "pessimistic",
    median: isInflationAdjusted ? "medianReal" : "median",
    optimistic: isInflationAdjusted ? "optimisticReal" : "optimistic",
    coneDelta: isInflationAdjusted ? "coneDeltaReal" : "coneDelta",
  }), [isInflationAdjusted]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Real Wealth Calculator
            </h1>
            <p className="text-slate-400 mt-2">
              Monte Carlo simulation projecting your wealth with market uncertainty & inflation.
            </p>
          </div>
          
          {/* Grind Badge - Shows up if we have a grind year */}
          {grindYear !== null && grindYear > 0 && (
            <div className="flex items-center gap-3 bg-slate-900/50 p-2 px-4 rounded-xl border border-slate-800/50">
               <div className="bg-slate-700/50 p-1.5 rounded-lg">
                  <Target className="w-4 h-4 text-slate-300" />
               </div>
               <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">The Grind (First $100k)</p>
                  <p className="text-sm text-slate-200">
                    Takes <span className="text-white font-bold">{grindYear} years</span>
                    <span className="text-slate-500 text-xs ml-1">to breakthrough</span>
                  </p>
               </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Controls */}
          <div className="lg:col-span-4 space-y-6">
            <Card>
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                Investment Parameters
              </h2>
              
              <InputGroup 
                label="Starting Amount" 
                value={initialAmount} 
                onChange={setInitialAmount} 
                min={0} 
                max={500000} 
                step={1000} 
                unit="$"
                icon={PiggyBank}
              />
              
              <InputGroup 
                label="Monthly Contribution" 
                value={monthlyContribution} 
                onChange={setMonthlyContribution} 
                min={0} 
                max={10000} 
                step={50} 
                unit="$"
                icon={DollarSign}
              />
              
              <InputGroup 
                label="Time Horizon" 
                value={years} 
                onChange={setYears} 
                min={1} 
                max={50} 
                unit=" Years"
                icon={Clock}
              />
              
              <InputGroup 
                label="Annual Return" 
                value={annualReturn} 
                onChange={setAnnualReturn} 
                min={1} 
                max={15} 
                step={0.1}
                unit="%"
                icon={TrendingUp}
              />
              
              {/* NEW: Expense Ratio Input */}
               <InputGroup 
                label="Expense Ratio (Fees)" 
                value={expenseRatio} 
                onChange={setExpenseRatio} 
                min={0} 
                max={3} 
                step={0.05}
                unit="%"
                icon={Scissors}
                color="rose"
              />
              
              <div className="py-4 border-t border-b border-slate-700/50">
                 <InputGroup 
                  label="Inflation Rate" 
                  value={inflationRate} 
                  onChange={setInflationRate} 
                  min={0} 
                  max={15} 
                  step={0.1}
                  unit="%"
                  icon={Flame}
                />
              </div>

              {/* Risk Scenarios Section */}
              <div className="pt-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Stress Testing
                </h3>
                
                {/* Market Temp */}
                <div className="mb-4">
                    <label className="flex items-center text-sm font-medium text-slate-400 mb-2 gap-2">
                        <Gauge className="w-4 h-4 text-blue-400" />
                        Starting Valuation
                    </label>
                    <select 
                        value={marketTemp}
                        onChange={(e) => setMarketTemp(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                        <option value="Low">Low (Undervalued)</option>
                        <option value="Normal">Normal</option>
                        <option value="High">High (Overvalued)</option>
                    </select>
                     <p className="text-xs text-slate-500 mt-2 px-1 leading-relaxed">
                        {marketTemp === 'High' ? <span className="text-rose-400">Reduces annual returns by 3% for the first 5 years to simulate buying at a peak.</span> : 
                         marketTemp === 'Low' ? <span className="text-emerald-400">Boosts annual returns by 3% for the first 5 years to simulate buying the dip.</span> : 
                         'Standard linear return projection.'}
                    </p>
                </div>

                {/* Stress Test Toggle */}
                <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 hover:bg-slate-900 transition-colors cursor-pointer" onClick={() => setIsStressTest(!isStressTest)}>
                    <div className="flex flex-col justify-center">
                        <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                          Year 5 Crash
                          <Activity className="w-3 h-3 text-rose-500" />
                        </span>
                        <span className="text-xs text-slate-500 mt-0.5">Simulate 30% drop</span>
                    </div>
                    {/* Toggle Button Container */}
                    <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out flex items-center ${isStressTest ? 'bg-rose-500' : 'bg-slate-700'}`}>
                        <span className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ml-1 ${isStressTest ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                </div>
              </div>

            </Card>

            <div className="bg-indigo-900/20 border border-indigo-500/20 p-4 rounded-xl flex gap-3">
              <Info className="w-6 h-6 text-indigo-400 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-sm text-indigo-200">
                  {isInflationAdjusted 
                    ? "You are viewing 'Real' dollars adjusted for inflation."
                    : "You are viewing 'Nominal' dollars (account balance)."}
                </p>
                <p className="text-xs text-indigo-300/60">
                  The chart line is grey during "The Grind" (under $100k) to visualize the hardest phase of wealth accumulation.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Visualization */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                label="Total Invested" 
                value={`$${summary.principal.toLocaleString()}`} 
                subtext="Your principal contributions"
                icon={DollarSign}
                colorClass="text-blue-400"
              />
              <StatCard 
                label={isInflationAdjusted ? "Real Growth" : "Interest Earned"} 
                value={`$${summary.growth.toLocaleString()}`} 
                subtext="Median expected return"
                icon={TrendingUp}
                colorClass={summary.growth >= 0 ? "text-emerald-400" : "text-rose-400"}
              />

              {/* NEW: Lost to Fees Card */}
              <StatCard 
                label="Lost to Fees" 
                value={`$${summary.lostToFees.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} 
                subtext={`Impact of ${expenseRatio}% ratio`}
                icon={Scissors}
                colorClass="text-rose-400"
              />
              
              {/* FINAL BALANCE CARD */}
              <StatCard 
                label={isInflationAdjusted ? "Real Purchasing Power" : "Final Balance"}
                value={`$${summary.balance.toLocaleString()}`} 
                subtext={isInflationAdjusted ? `Adjusted for ${inflationRate}% inflation` : "Nominal account value"}
                icon={CalendarDays}
                colorClass={isInflationAdjusted ? "text-amber-400" : "text-cyan-400"}
                actionElement={
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsInflationAdjusted(!isInflationAdjusted); }}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-700 hover:bg-slate-600 text-[10px] font-medium text-slate-300 border border-slate-600 transition-colors"
                    title="Toggle Real Purchasing Power"
                  >
                    {isInflationAdjusted ? <Eye className="w-3 h-3 text-amber-400"/> : <EyeOff className="w-3 h-3"/>}
                    {isInflationAdjusted ? "Real" : "Nominal"}
                  </button>
                }
              />
            </div>

            {/* Main Chart */}
            <Card className="h-[500px] flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-3">
                  Wealth Projection 
                  <span className={`text-xs font-normal px-2 py-0.5 rounded-full border ${isInflationAdjusted ? 'border-amber-500/30 text-amber-400 bg-amber-900/20' : 'border-slate-600 text-slate-400 bg-slate-800'}`}>
                    {isInflationAdjusted ? "Inflation Adjusted" : "Nominal"}
                  </span>
                </h3>
              </div>

              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCone" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isInflationAdjusted ? "#f59e0b" : "#10b981"} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={isInflationAdjusted ? "#f59e0b" : "#10b981"} stopOpacity={0.05}/>
                      </linearGradient>
                      
                      {/* Gradient for "The Grind" Line Color Split */}
                      <linearGradient id="splitColor" x1="0" y1="0" x2="1" y2="0">
                        <stop offset={grindPercent} stopColor="#94a3b8" /> {/* Slate-400 for Grind */}
                        <stop offset={grindPercent} stopColor={isInflationAdjusted ? "#f59e0b" : "#10b981"} /> {/* Green/Amber for Growth */}
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis 
                      dataKey="year" 
                      stroke="#94a3b8" 
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                      tickMargin={10}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      tickFormatter={(value) => 
                        new Intl.NumberFormat('en-US', {
                          notation: "compact",
                          compactDisplay: "short",
                        }).format(value)
                      }
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip isInflationAdjusted={isInflationAdjusted} />} />
                    
                    {/* The Cone Areas */}
                    <Area 
                      type="monotone" 
                      dataKey={keyMap.pessimistic}
                      stackId="1" 
                      stroke="none"
                      fill="none" 
                      isAnimationActive={false}
                    />
                    <Area 
                      type="monotone" 
                      dataKey={keyMap.coneDelta}
                      stackId="1" 
                      stroke="none"
                      fill="url(#colorCone)" 
                      animationDuration={1500}
                    />

                    {/* Median Line with GRIND GRADIENT */}
                    <Line 
                      type="monotone" 
                      dataKey={keyMap.median}
                      stroke="url(#splitColor)" 
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: isInflationAdjusted ? "#f59e0b" : "#10b981" }}
                      name="Median"
                    />

                    {/* The Grind Reference Line (Vertical) */}
                    {grindYear !== null && grindYear > 0 && grindYear < years && (
                      <ReferenceLine x={grindYear} stroke="#64748b" strokeDasharray="3 3">
                        <Label 
                            value="First $100k" 
                            position="insideTopRight" 
                            fill="#94a3b8" 
                            fontSize={10} 
                            offset={10}
                        />
                      </ReferenceLine>
                    )}

                    {/* Optimistic Border Line */}
                    <Line 
                      type="monotone" 
                      dataKey={keyMap.optimistic}
                      stroke={isInflationAdjusted ? "#f59e0b" : "#10b981"} 
                      strokeWidth={1}
                      strokeOpacity={0.3}
                      strokeDasharray="4 4"
                      dot={false}
                      activeDot={false}
                    />

                    {/* Pessimistic Border Line */}
                    <Line 
                      type="monotone" 
                      dataKey={keyMap.pessimistic}
                      stroke={isInflationAdjusted ? "#f59e0b" : "#10b981"} 
                      strokeWidth={1}
                      strokeOpacity={0.3}
                      strokeDasharray="4 4"
                      dot={false}
                      activeDot={false}
                    />
                    
                    {/* Principal Line */}
                    <Line 
                      type="monotone" 
                      dataKey="totalPrincipal" 
                      stroke="#475569" 
                      strokeDasharray="2 2" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={false}
                    />

                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-4">
                 <div className="flex items-center gap-2 text-sm text-slate-400">
                  <div className="w-3 h-3 rounded bg-slate-400"></div>
                  <span>The Grind (&lt;$100k)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <div className={`w-3 h-3 rounded ${isInflationAdjusted ? "bg-amber-500" : "bg-emerald-500"}`}></div>
                  <span>Median</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <div className={`w-3 h-3 rounded opacity-30 ${isInflationAdjusted ? "bg-amber-500" : "bg-emerald-500"}`}></div>
                  <span>90% Probability</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

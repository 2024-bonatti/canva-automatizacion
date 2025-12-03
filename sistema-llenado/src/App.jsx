import React, { useState, useEffect } from 'react';
import { Clock, Power, Settings, Activity, Play, RefreshCw, Volume2 } from 'lucide-react';

// --- COMPONENTE DE BOTONERA MANUAL (Solo se mantiene para Manual) ---
const BotoneraManual = ({ activo, onMarcha, onParo, estado }) => {
  return (
    <div className={`flex flex-col items-center gap-3 p-3 rounded-lg border-2 transition-all duration-300 ${activo ? 'bg-slate-700/80 border-slate-500 opacity-100 shadow-lg' : 'bg-slate-800/50 border-slate-700 opacity-40 grayscale pointer-events-none'}`}>
      <span className="text-xs font-bold tracking-wider text-yellow-400">MANUAL</span>
      
      {/* Botón Marcha */}
      <div className="flex flex-col items-center group">
        <button 
          onClick={activo ? onMarcha : undefined}
          disabled={!activo || estado === 'llenando' || estado === 'espera'}
          className={`w-14 h-14 rounded-full border-4 shadow-md active:scale-95 transition-all flex items-center justify-center
            ${(estado === 'llenando' || estado === 'espera') && activo
              ? 'bg-green-500 border-green-700 shadow-green-500/50 ring-2 ring-green-300' 
              : 'bg-green-600 border-green-800 hover:bg-green-500'}`}
        >
          <div className="w-8 h-8 border-2 border-green-400/30 rounded-full"></div>
        </button>
        <span className="text-white text-[9px] font-bold mt-1 uppercase">Marcha</span>
      </div>

      {/* Botón Paro */}
      <div className="flex flex-col items-center">
        <button 
          onClick={activo ? onParo : undefined}
          className="w-14 h-14 rounded-full border-4 border-red-800 bg-red-600 shadow-md active:scale-95 transition-all hover:bg-red-500 flex items-center justify-center"
        >
          <div className="w-8 h-8 border-2 border-red-400/30 rounded-full flex items-center justify-center">
             {activo && (estado === 'llenando' || estado === 'espera') && (
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
             )}
          </div>
        </button>
        <span className="text-white text-[9px] font-bold mt-1 uppercase">Paro</span>
      </div>
    </div>
  );
};

const SistemaLlenadoCisterna = () => {
  const [estado, setEstado] = useState('inactivo'); 
  const [tiempoRestante, setTiempoRestante] = useState(5);
  const [nivelTanque, setNivelTanque] = useState(0); // Porcentaje visual (0-100)
  const [volumenActual, setVolumenActual] = useState(0); // Volumen real en m3
  const [modo, setModo] = useState('automatico');
  
  // Consigna ingresada por el usuario (Set Point) -> POR DEFECTO EN 19
  const [consigna, setConsigna] = useState(19); 
  
  // Datos del sensor simulado
  const [flujoSensor, setFlujoSensor] = useState(0);

  // Estado para la alarma visual
  const [alarmaActiva, setAlarmaActiva] = useState(false);

  const CAPACIDAD_MAXIMA = 20; // 20 m3 es el 100%

  // Lógica del temporizador de arranque (Solo Automático)
  useEffect(() => {
    let intervalo;
    if (estado === 'espera') {
      intervalo = setInterval(() => {
        setTiempoRestante((prev) => {
          if (prev <= 1) {
            setEstado('llenando');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalo);
  }, [estado]);

  // Lógica de llenado y Alarma de Nivel Alto
  useEffect(() => {
    let intervalo;
    if (estado === 'llenando') {
      // Velocidad reducida: cada 200ms
      intervalo = setInterval(() => {
        
        // Simular variación en el sensor de flujo
        const flujoRandom = (Math.random() * 2) + 15; // L/min aprox
        setFlujoSensor(flujoRandom);

        setVolumenActual((prevVol) => {
          const incremento = 0.1; 
          const nuevoVolumen = prevVol + incremento;

          // Calcular porcentaje visual basado en 20m3
          const nuevoPorcentaje = (nuevoVolumen / CAPACIDAD_MAXIMA) * 100;
          setNivelTanque(Math.min(nuevoPorcentaje, 100));

          // ACTIVACIÓN DE ALARMA (NIVEL ALTO > 90%)
          if (nuevoPorcentaje >= 90) {
            setAlarmaActiva(true);
          } else {
            setAlarmaActiva(false);
          }

          // Logica de Parada Automática
          if (modo === 'automatico') {
             if (nuevoVolumen >= consigna || nuevoVolumen >= CAPACIDAD_MAXIMA) {
                setEstado('lleno'); // Parada por alcanzar Set Point
                setFlujoSensor(0);
                return nuevoVolumen >= CAPACIDAD_MAXIMA ? CAPACIDAD_MAXIMA : consigna;
             }
          } else {
             // Manual: para al 100% físico
             if (nuevoVolumen >= CAPACIDAD_MAXIMA) {
                setEstado('lleno');
                setFlujoSensor(0);
                return CAPACIDAD_MAXIMA;
             }
          }
          
          return nuevoVolumen;
        });
      }, 200); 
    } else {
        setFlujoSensor(0);
        // Si no está llenando, mantenemos la alarma si sigue lleno (>90%)
        if (nivelTanque >= 90) {
            setAlarmaActiva(true);
        } else {
            setAlarmaActiva(false);
        }
    }
    return () => clearInterval(intervalo);
  }, [estado, modo, consigna, nivelTanque]);

  // --- FUNCIONES DE CONTROL ---

  const iniciarManual = () => {
    if (volumenActual >= CAPACIDAD_MAXIMA) {
        setVolumenActual(0);
        setNivelTanque(0);
        setAlarmaActiva(false);
    }
    setTiempoRestante(0);
    setEstado('llenando');
  };

  const pararManual = () => {
    setEstado('inactivo');
  };

  const confirmarInicioAuto = () => {
    if (consigna > 0 && consigna <= 20) {
        setVolumenActual(0);
        setNivelTanque(0);
        setAlarmaActiva(false);
        setTiempoRestante(5);
        setEstado('espera'); 
    } else {
        alert("Por favor ingrese un valor válido (0 - 20 m³)");
    }
  };

  const resetAutomatico = () => {
    // Resetea valores y ARRANCA de nuevo automáticamente
    if (consigna > 0 && consigna <= 20) {
      setVolumenActual(0);
      setNivelTanque(0);
      setAlarmaActiva(false);
      setTiempoRestante(5);
      setEstado('espera'); // Reinicia el ciclo completo (Timer -> Llenado)
    }
  };

  const colorBomba = estado === 'llenando' ? '#22c55e' : (estado === 'espera' ? '#fbbf24' : '#94a3b8');
  const colorFluido = estado === 'llenando' ? '#3b82f6' : 'transparent';
  
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-50 min-h-screen font-sans">
      
      <div className="w-full max-w-6xl bg-white shadow-lg rounded-xl p-6 mb-6 border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 mb-2 border-b pb-2">Control de Llenado - Sistema PLC</h1>
        
        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          
          {/* --- PANEL DE OPERADOR --- */}
          <div className="bg-slate-800 p-4 rounded-lg shadow-inner border-2 border-slate-600 flex flex-col items-center flex-shrink-0">
            <h3 className="text-white text-xs font-bold uppercase tracking-wider mb-4 text-center border-b border-slate-600 pb-2 w-full">HMI / PANEL</h3>
            
            {/* Selector Central */}
            <div className="flex flex-col items-center mb-6 bg-slate-900/50 p-2 rounded-lg border border-slate-600 w-full">
              <span className="text-slate-400 text-[9px] font-bold mb-1 uppercase tracking-widest">Selector de Modo</span>
              <div className="flex items-center gap-4">
                <span className={`text-xs font-bold transition-colors ${modo === 'manual' ? 'text-yellow-400' : 'text-slate-600'}`}>MANUAL</span>
                
                <div 
                  className="relative w-14 h-7 bg-black rounded-full cursor-pointer border-2 border-slate-500 shadow-inner"
                  onClick={() => {
                    setModo(modo === 'automatico' ? 'manual' : 'automatico');
                    setEstado('inactivo');
                    setFlujoSensor(0);
                  }}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-gradient-to-br from-gray-200 to-gray-400 rounded-full shadow transition-all duration-300 transform ${modo === 'automatico' ? 'left-[30px] bg-green-500' : 'left-0.5'}`}></div>
                </div>

                <span className={`text-xs font-bold transition-colors ${modo === 'automatico' ? 'text-green-400' : 'text-slate-600'}`}>AUTO</span>
              </div>
            </div>

            <div className="flex gap-4 items-start w-full justify-center">
              
              {/* Lado Manual */}
              <BotoneraManual 
                activo={modo === 'manual'} 
                estado={estado}
                onMarcha={iniciarManual}
                onParo={pararManual}
              />
              
              <div className="w-0.5 h-48 bg-slate-600 rounded-full"></div>

              {/* Lado Automático: Config + OK + RESET */}
              <div className={`flex flex-col gap-4 p-3 rounded-lg border-2 transition-all duration-300 w-40 ${modo === 'automatico' ? 'bg-slate-700/80 border-slate-500 opacity-100' : 'bg-slate-800/50 border-slate-700 opacity-30 grayscale pointer-events-none'}`}>
                 <span className="text-xs font-bold tracking-wider text-green-400 text-center">AUTO / SET POINT</span>
                 
                 <div className="flex flex-col gap-1 mt-2">
                    <label className="text-[10px] text-slate-300 font-bold">Volumen a Llenar:</label>
                    <div className="flex items-center gap-2">
                        {/* Input de Seteo */}
                        <div className="bg-black border border-green-600 rounded px-2 py-2 w-full flex items-center justify-between">
                            <input 
                                type="number" 
                                min="0" 
                                max="20"
                                value={consigna}
                                onChange={(e) => {
                                  // Validación estricta 0-20
                                  let val = parseInt(e.target.value);
                                  if (isNaN(val)) val = 0;
                                  if (val > 20) val = 20;
                                  if (val < 0) val = 0;
                                  setConsigna(val);
                                }}
                                disabled={estado !== 'inactivo' && estado !== 'lleno'}
                                className="w-full bg-transparent text-green-400 font-mono text-lg font-bold focus:outline-none text-center"
                            />
                        </div>
                        <span className="text-white text-xs">m³</span>
                    </div>
                 </div>

                 {/* Botones de Control Automático */}
                 <div className="flex gap-2 mt-1">
                    {/* Botón OK / RUN */}
                    <button 
                        onClick={confirmarInicioAuto}
                        title="Iniciar Ciclo"
                        disabled={estado !== 'inactivo'}
                        className={`
                            flex-1 flex items-center justify-center px-2 py-3 rounded shadow-lg border-b-4 active:border-b-0 active:translate-y-1 transition-all
                            ${estado === 'inactivo' 
                                ? 'bg-blue-600 border-blue-800 hover:bg-blue-500 text-white' 
                                : 'bg-slate-600 border-slate-800 text-slate-400 cursor-not-allowed'}
                        `}
                    >
                        <Play size={16} fill="currentColor" />
                    </button>

                    {/* Botón RESET / RESTART */}
                    <button 
                        onClick={resetAutomatico}
                        title="Resetear y Reiniciar Ciclo"
                        // El reset suele estar disponible siempre, especialmente al final ('lleno')
                        disabled={modo !== 'automatico'} 
                        className={`
                            flex-1 flex items-center justify-center px-2 py-3 rounded shadow-lg border-b-4 active:border-b-0 active:translate-y-1 transition-all
                            ${modo === 'automatico'
                                ? 'bg-orange-500 border-orange-700 hover:bg-orange-400 text-white' 
                                : 'bg-slate-600 border-slate-800 text-slate-400 cursor-not-allowed'}
                        `}
                    >
                        <RefreshCw size={16} />
                    </button>
                 </div>
                 
                 {/* Etiquetas de estado */}
                 <div className="h-4">
                    {estado === 'llenando' && (
                        <div className="text-[9px] text-green-400 text-center animate-pulse font-bold">EN PROCESO...</div>
                    )}
                    {estado === 'lleno' && (
                        <div className="text-[9px] text-orange-400 text-center font-bold animate-bounce">¡FIN DE CICLO!</div>
                    )}
                 </div>
              </div>
            </div>
          </div>

          {/* Información de Estado */}
          <div className="flex-grow bg-slate-50 p-6 rounded-lg border border-slate-200 flex flex-col justify-center shadow-sm relative overflow-hidden">
            {/* Visualización de Datos PLC */}
            <div className="absolute top-4 right-4 bg-black p-2 rounded border border-slate-600 shadow-sm z-20">
                 <div className="flex items-center gap-2 mb-1">
                    <Activity size={14} className="text-green-500" />
                    <span className="text-[10px] text-green-500 font-mono">ENTRADA PLC (I:0.0)</span>
                 </div>
                 <div className="font-mono text-xl text-green-400 text-right">
                    {flujoSensor.toFixed(1)} <span className="text-xs">L/min</span>
                 </div>
            </div>

            {/* Alerta Visual en Panel (Solo si alarma activa) */}
            {alarmaActiva && (
                <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded animate-pulse z-20 font-bold border-2 border-red-800 shadow-lg flex items-center gap-2">
                    <Volume2 size={16} /> ALARMA NIVEL ALTO
                </div>
            )}

            <div className="flex items-center gap-4 mb-4 z-10 mt-8">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${estado === 'espera' ? 'bg-yellow-50 border-yellow-200 text-yellow-700 animate-pulse' : 'bg-white border-slate-200 text-slate-500'}`}>
                {modo === 'manual' ? <Power size={20} /> : <Clock size={20} />}
                <span className="font-mono font-bold text-lg">
                  {modo === 'manual' 
                    ? (estado === 'llenando' ? 'BOMBA ON' : 'PAUSA') 
                    : (estado === 'espera' ? `Arranca en ${tiempoRestante}s` : (estado === 'inactivo' ? 'LISTO' : (estado === 'lleno' ? 'COMPLETADO' : 'AUTO RUN')))}
                </span>
              </div>
              
              <div className="flex flex-col bg-slate-800 text-green-400 px-4 py-2 rounded-lg border-2 border-slate-600 shadow-inner font-mono">
                <span className="text-[10px] text-slate-400">VOLUMEN ACUMULADO</span>
                <span className="text-xl font-bold tracking-widest">
                    {volumenActual.toFixed(2)} <span className="text-sm text-slate-500">/ 20 m³</span>
                </span>
              </div>
            </div>
            
            <div className="border-t border-slate-200 pt-4 mt-2 z-10">
              <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <Settings size={16} /> Estado del Proceso:
              </h4>
               <p className="text-sm text-slate-600">
                  {modo === 'automatico' 
                    ? `Objetivo: Llenar ${consigna} m³. Sensor ultrasónico monitoreando nivel. Alarma activa al 90%.` 
                    : `Control Manual. Alarma de seguridad de nivel alto activa (90%).`}
               </p>
            </div>
          </div>
        </div>

        {/* ÁREA DE DIBUJO (CANVA) */}
        <div className="relative w-full aspect-video bg-white border-2 border-slate-200 rounded-lg overflow-hidden shadow-inner">
          <svg viewBox="0 0 800 500" className="w-full h-full">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
              </marker>
              <pattern id="waterPattern" patternUnits="userSpaceOnUse" width="10" height="10">
                <path d="M 0 0 L 10 10 M -2 2 L 2 -2 M 8 12 L 12 8" stroke="#60a5fa" strokeWidth="1" />
              </pattern>
            </defs>

            {/* 1. BOMBA */}
            <g transform="translate(100, 350)">
              <rect x="-40" y="20" width="80" height="10" fill="#64748b" />
              <circle cx="0" cy="0" r="30" fill={colorBomba} stroke="#334155" strokeWidth="3" />
              <path d="M -15 -10 L -15 10 L 15 0 Z" fill="white" opacity="0.8" />
              <text x="0" y="50" textAnchor="middle" className="text-sm font-bold fill-slate-700">BOMBA</text>
              
              {modo === 'automatico' && (
                <g transform="translate(-80, -90)" className={estado === 'espera' ? 'opacity-100' : 'opacity-0 transition-opacity'}>
                    <rect x="0" y="0" width="160" height="40" rx="5" fill="#fef9c3" stroke="#eab308" strokeWidth="1" />
                    <text x="80" y="18" textAnchor="middle" className="text-xs font-bold fill-yellow-700">NO ARRANCA</text>
                    <text x="80" y="32" textAnchor="middle" className="text-xs fill-yellow-700">hasta terminar tiempo</text>
                    <line x1="80" y1="40" x2="80" y2="55" stroke="#eab308" strokeWidth="2" markerEnd="url(#arrowhead)" />
                </g>
              )}
            </g>

            {/* 2. TUBERÍA IZQ */}
            <line x1="130" y1="350" x2="280" y2="350" stroke="#94a3b8" strokeWidth="12" />
            <line x1="130" y1="350" x2="280" y2="350" stroke={colorFluido} strokeWidth="6" strokeDasharray={estado === 'llenando' ? "10,5" : "0"} className={estado === 'llenando' ? "animate-pulse" : ""} />

            {/* 3. SENSOR DE FLUJO (Reemplaza a la válvula) */}
            <g transform="translate(300, 350)">
               {/* Cuerpo del sensor */}
               <rect x="-25" y="-20" width="50" height="40" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="2" />
               <rect x="-20" y="-15" width="40" height="30" fill="#0f172a" />
               
               {/* Pantallita del sensor */}
               <text x="0" y="5" textAnchor="middle" className="font-mono text-[10px] fill-green-400 font-bold tracking-tighter">
                   {flujoSensor.toFixed(1)}
               </text>
               <text x="0" y="25" textAnchor="middle" className="text-[6px] fill-slate-500 font-bold">SENSOR FLUJO</text>
               
               {/* Hélice/Indicador de funcionamiento */}
               {estado === 'llenando' && (
                   <circle cx="15" cy="-10" r="2" fill="red" className="animate-ping" />
               )}

               {/* CABLE DE DATOS HACIA ARRIBA */}
               <g className={estado === 'llenando' ? 'opacity-100' : 'opacity-20'}>
                   <path d="M 0 -20 L 0 -100 L -150 -100 L -150 -200" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="5,5" className={estado === 'llenando' ? 'animate-[dash_1s_linear_infinite]' : ''} />
                   <text x="-75" y="-110" textAnchor="middle" className="text-[10px] fill-green-600 font-mono bg-white">PULSOS → PLC</text>
               </g>
            </g>

            {/* 4. TUBERÍA DER */}
            <line x1="325" y1="350" x2="450" y2="350" stroke="#94a3b8" strokeWidth="12" />
            <line x1="325" y1="350" x2="450" y2="350" stroke={colorFluido} strokeWidth="6" strokeDasharray={estado === 'llenando' ? "10,5" : "0"} className={estado === 'llenando' ? "animate-pulse" : ""} />

            {/* Brazo de carga */}
            <path d="M 450 350 L 450 150 L 550 150 L 550 190" fill="none" stroke="#94a3b8" strokeWidth="12" strokeLinejoin="round" />
            <path d="M 450 350 L 450 150 L 550 150 L 550 190" fill="none" stroke={colorFluido} strokeWidth="6" strokeLinejoin="round" strokeDasharray={estado === 'llenando' ? "10,5" : "0"} className={estado === 'llenando' ? "animate-pulse" : ""} />

            {/* 5. CAMIÓN CISTERNA */}
            <g transform="translate(500, 250)">
              {/* Cabina con SIRENA */}
              <g>
                  <path d="M 180 50 L 210 50 L 230 80 L 230 130 L 180 130 Z" fill="#ef4444" stroke="#7f1d1d" strokeWidth="2" />
                  <rect x="210" y="60" width="15" height="20" fill="#bae6fd" stroke="#3b82f6" />
                  
                  {/* SIRENA DE ALARMA (Sobre la cabina) */}
                  <g transform="translate(205, 40)">
                      <rect x="0" y="5" width="20" height="5" fill="#1e293b" />
                      <path d="M 2 5 L 2 0 L 18 0 L 18 5 Z" fill={alarmaActiva ? "#ef4444" : "#94a3b8"} className={alarmaActiva ? "animate-pulse" : ""} />
                      {alarmaActiva && (
                          <g className="animate-ping" opacity="0.7">
                              <circle cx="10" cy="2" r="10" fill="#f59e0b" opacity="0.5" />
                              <circle cx="10" cy="2" r="15" fill="#ef4444" opacity="0.3" />
                          </g>
                      )}
                  </g>
              </g>

              {/* Tanque con SENSOR ULTRASÓNICO */}
              <g>
                  <path d="M 0 50 L 170 50 A 20 20 0 0 1 190 70 L 190 110 A 20 20 0 0 1 170 130 L 0 130 A 20 20 0 0 1 -20 110 L -20 70 A 20 20 0 0 1 0 50" fill="#e2e8f0" stroke="#475569" strokeWidth="2" />
                  
                  {/* SENSOR ULTRASÓNICO (Parte superior interna) */}
                  <g transform="translate(85, 50)">
                      <rect x="-10" y="0" width="20" height="10" fill="#334155" stroke="#1e293b" />
                      {/* Ondas del sensor */}
                      <path d="M -5 12 L 0 18 L 5 12" fill="none" stroke="#64748b" strokeWidth="1" className="animate-bounce" opacity="0.5" />
                      <path d="M -10 15 L 0 25 L 10 15" fill="none" stroke="#64748b" strokeWidth="1" className="animate-bounce" style={{animationDelay: '0.1s'}} opacity="0.3" />
                  </g>
                  
                  <clipPath id="tankClip">
                      <path d="M 0 50 L 170 50 A 20 20 0 0 1 190 70 L 190 110 A 20 20 0 0 1 170 130 L 0 130 A 20 20 0 0 1 -20 110 L -20 70 A 20 20 0 0 1 0 50" />
                  </clipPath>
                  
                  {/* Líquido */}
                  <rect x="-20" y={130 - (80 * (nivelTanque / 100))} width="210" height="80" fill="#3b82f6" opacity="0.6" clipPath="url(#tankClip)" />
              </g>

              <circle cx="20" cy="130" r="20" fill="#1e293b" />
              <circle cx="60" cy="130" r="20" fill="#1e293b" />
              <circle cx="190" cy="130" r="20" fill="#1e293b" />

              <text x="85" y="100" textAnchor="middle" className="text-sm font-bold fill-slate-500 opacity-50">CISTERNA</text>
              <text x="85" y="165" textAnchor="middle" className="text-sm font-bold fill-slate-700">CAMIÓN CISTERNA</text>
              
              {/* Etiqueta de Porcentaje y Volumen */}
              <text x="85" y="90" textAnchor="middle" className="text-lg font-bold fill-blue-800">{nivelTanque.toFixed(0)}%</text>
              <text x="85" y="105" textAnchor="middle" className="text-xs font-bold fill-blue-600">({volumenActual.toFixed(1)} / 20 m³)</text>
            </g>

            <rect x="535" y="190" width="30" height="10" fill="#64748b" />
            <text x="550" y="130" textAnchor="middle" className="text-sm font-bold fill-slate-700">BRAZO DE CARGA</text>

            <style>
                {`
                @keyframes dash {
                  to {
                    stroke-dashoffset: -10;
                  }
                }
                `}
            </style>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default SistemaLlenadoCisterna;
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryState, parseAsInteger } from "nuqs";
import { FaGlobe, FaGithub, FaFacebook, FaLinkedin } from "react-icons/fa";

declare global {
  interface Window {
    katex: {
      renderToString: (
        tex: string,
        options?: { displayMode?: boolean; throwOnError?: boolean }
      ) => string;
    };
  }
}

function useKatex() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Check if KaTeX is already loaded
    const checkKatex = () => {
      if (window.katex) {
        setReady(true);
        return true;
      }
      return false;
    };

    // Try immediately
    if (checkKatex()) return;

    // Poll for KaTeX availability
    const interval = setInterval(() => {
      if (checkKatex()) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return ready;
}

function Tex({
  children,
  math,
  display = false,
}: {
  children?: string;
  math?: string;
  display?: boolean;
}) {
  const ready = useKatex();

  // Ensure we always have a valid string
  const texString = String(math || children || "");

  if (!ready || !texString) {
    return <span className="font-mono text-cyan-300">{texString}</span>;
  }

  const html = window.katex.renderToString(texString, {
    displayMode: display,
    throwOnError: false,
  });

  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function BlockTex({ children, math }: { children?: string; math?: string }) {
  const texString = String(math || children || "");
  return (
    <div className="my-4 text-center">
      <Tex math={texString} display />
    </div>
  );
}

function useAnimationSteps(totalSteps: number, interval = 1200) {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setStep((prev) => {
        if (prev >= totalSteps - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [isPlaying, totalSteps, interval]);

  return {
    step,
    isPlaying,
    play: () => setIsPlaying(true),
    pause: () => setIsPlaying(false),
    reset: () => {
      setStep(0);
      setIsPlaying(false);
    },
    nextStep: () => setStep((prev) => Math.min(prev + 1, totalSteps - 1)),
    setStep: (s: number) => setStep(s),
  };
}

function AnimationControls({
  isPlaying,
  onPlay,
  onPause,
  onReset,
  onNext,
  step,
  totalSteps,
}: {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onNext: () => void;
  step: number;
  totalSteps: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 justify-center mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
      <Button
        variant="outline"
        size="sm"
        onClick={isPlaying ? onPause : onPlay}
        className="bg-emerald-600 hover:bg-emerald-700 border-emerald-500 text-white hover:text-white cursor-pointer"
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 mr-2" />
        ) : (
          <Play className="w-4 h-4 mr-2" />
        )}
        {isPlaying ? "Pause" : "Play Animation"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onNext}
        disabled={step >= totalSteps - 1}
        className="bg-blue-600 hover:bg-blue-700 border-blue-500 text-white hover:text-white disabled:opacity-50 cursor-pointer"
      >
        <SkipForward className="w-4 h-4 mr-2" />
        Next Step
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        className="bg-slate-600 hover:bg-slate-700 border-slate-500 text-white hover:text-white cursor-pointer"
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Reset
      </Button>
      <div className="flex items-center gap-2 ml-2">
        <span className="text-sm text-slate-400">Iteration:</span>
        <span className="px-3 py-1 bg-cyan-500/20 rounded-lg text-cyan-300 font-mono font-bold">
          {step + 1} / {totalSteps}
        </span>
      </div>
    </div>
  );
}

function NumberLine({
  points,
  min,
  max,
  root,
  activeStep,
  intervals,
}: {
  points: { x: number; label: string; color: string }[];
  min: number;
  max: number;
  root: number;
  activeStep: number;
  intervals?: { a: number; b: number }[];
}) {
  const scale = (x: number) => {
    const percent = ((x - min) / (max - min)) * 100;
    return Math.max(0, Math.min(100, percent));
  };

  // Calculate position within the line bounds (accounts for padding)
  const getPosition = (x: number) => {
    const percent = scale(x);
    // The line goes from 1rem to calc(100% - 1rem), so we position along that range
    return `calc(1rem + (100% - 2rem) * ${percent} / 100)`;
  };

  return (
    <div className="relative w-full h-32 my-4 px-4">
      {/* Interval brackets */}
      {intervals && intervals[activeStep] && (
        <div
          className="absolute top-4 h-6 bg-purple-500/30 border-l-2 border-r-2 border-purple-400 transition-all duration-700"
          style={{
            left: getPosition(intervals[activeStep].a),
            width: `calc((100% - 2rem) * ${
              scale(intervals[activeStep].b) - scale(intervals[activeStep].a)
            } / 100)`,
          }}
        />
      )}

      {/* Number line */}
      <div className="absolute top-16 left-4 right-4 h-1 bg-linear-to-br from-slate-600 via-slate-500 to-slate-600 rounded-full" />

      {/* Root marker */}
      {root >= min && root <= max && (
        <>
          <div
            className="absolute top-12 w-1 h-9 bg-emerald-500 transition-all duration-500"
            style={{ left: getPosition(root) }}
          />
          <div
            className="absolute top-24 text-xs text-emerald-400 font-bold -translate-x-1/2 transition-all duration-500"
            style={{ left: getPosition(root) }}
          >
            ROOT
          </div>
        </>
      )}

      {/* Animated points */}
      {points.slice(0, activeStep + 1).map((point, i) => {
        const isVisible = point.x >= min && point.x <= max;
        const isCurrentStep = i === activeStep;
        return isVisible ? (
          <div
            key={i}
            className="absolute transition-all duration-700 ease-out"
            style={{
              left: getPosition(point.x),
              opacity: 1,
            }}
          >
            <div
              className={`w-3 h-3 rounded-full ${point.color} ${
                i === activeStep
                  ? "ring-2 ring-white ring-offset-1 ring-offset-slate-900 shadow-lg"
                  : "opacity-60"
              }`}
              style={{
                marginTop: "60px",
                transform: `translateX(-50%) scale(${
                  i === activeStep ? 1.05 : 0.85
                })`,
              }}
            />
            {isCurrentStep && (
              <div
                className={`absolute -top-2 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap font-mono ${
                  i === activeStep ? "text-white font-bold" : "text-slate-400"
                }`}
              >
                {point.label}
              </div>
            )}
          </div>
        ) : null;
      })}

      {/* Scale markers */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <div
          key={t}
          className="absolute top-14 w-px h-5 bg-slate-500"
          style={{ left: getPosition(min + t * (max - min)) }}
        >
          <span className="absolute top-7 text-xs text-slate-500 -translate-x-1/2">
            {(min + t * (max - min)).toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}

function CartesianPlot({
  func,
  steps,
  activeStep,
  xMin,
  xMax,
  yMin,
  yMax,
}: {
  func: (x: number) => number;
  steps: { x: number; slope: number }[];
  activeStep: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}) {
  const width = 320;
  const height = 220;
  const padding = 40;

  const scaleX = (x: number) =>
    padding + ((x - xMin) / (xMax - xMin)) * (width - 2 * padding);
  const scaleY = (y: number) =>
    height - padding - ((y - yMin) / (yMax - yMin)) * (height - 2 * padding);

  const curvePoints: string[] = [];
  for (let x = xMin; x <= xMax; x += 0.02) {
    const y = func(x);
    if (y >= yMin && y <= yMax) {
      curvePoints.push(`${scaleX(x)},${scaleY(y)}`);
    }
  }

  return (
    <svg
      width={width}
      height={height}
      className="mx-auto bg-slate-900/50 rounded-lg border border-slate-700"
    >
      {/* Grid */}
      {[-2, -1, 0, 1, 2, 3].map((x) => (
        <line
          key={`vg${x}`}
          x1={scaleX(x)}
          y1={padding}
          x2={scaleX(x)}
          y2={height - padding}
          stroke="rgba(255,255,255,0.1)"
        />
      ))}
      {[-2, 0, 2, 4].map((y) => (
        <line
          key={`hg${y}`}
          x1={padding}
          y1={scaleY(y)}
          x2={width - padding}
          y2={scaleY(y)}
          stroke="rgba(255,255,255,0.1)"
        />
      ))}

      {/* Axes */}
      <line
        x1={padding}
        y1={scaleY(0)}
        x2={width - padding}
        y2={scaleY(0)}
        stroke="#64748b"
        strokeWidth="2"
      />
      <line
        x1={scaleX(0)}
        y1={padding}
        x2={scaleX(0)}
        y2={height - padding}
        stroke="#64748b"
        strokeWidth="2"
      />

      {/* Function curve */}
      <polyline
        points={curvePoints.join(" ")}
        fill="none"
        stroke="#22d3ee"
        strokeWidth="3"
      />

      {/* Tangent lines and points */}
      {steps.slice(0, activeStep + 1).map((s, i) => {
        const y = func(s.x);
        const xNext = s.x - y / s.slope;
        return (
          <g
            key={i}
            className="transition-all duration-500"
            style={{ opacity: i <= activeStep ? 1 : 0.3 }}
          >
            {/* Tangent line */}
            <line
              x1={scaleX(s.x - 1)}
              y1={scaleY(y - s.slope)}
              x2={scaleX(s.x + 1)}
              y2={scaleY(y + s.slope)}
              stroke={i === activeStep ? "#f472b6" : "#64748b"}
              strokeWidth={i === activeStep ? 2 : 1}
              strokeDasharray={i === activeStep ? "" : "4"}
            />
            {/* Point on curve */}
            <circle
              cx={scaleX(s.x)}
              cy={scaleY(y)}
              r={i === activeStep ? 8 : 5}
              fill={i === activeStep ? "#a855f7" : "#64748b"}
              stroke="white"
              strokeWidth={i === activeStep ? 2 : 0}
            />
            {/* Label */}
            <text
              x={scaleX(s.x)}
              y={scaleY(y) - 12}
              fill="#a855f7"
              fontSize="11"
              textAnchor="middle"
            >
              x{i}
            </text>
          </g>
        );
      })}

      {/* Axis labels */}
      <text
        x={width - padding + 10}
        y={scaleY(0) + 4}
        fill="#94a3b8"
        fontSize="12"
      >
        x
      </text>
      <text x={scaleX(0) + 5} y={padding - 10} fill="#94a3b8" fontSize="12">
        y
      </text>
    </svg>
  );
}

// ============== SLIDE COMPONENTS ==============

// Helper functions for dynamic iteration calculation
function computeBisectionIterations(
  f: (x: number) => number,
  a: number,
  b: number,
  maxSteps: number = 10,
  tolerance: number = 0.001
) {
  const iterations = [];
  let left = a;
  let right = b;

  for (let i = 0; i < maxSteps; i++) {
    const c = (left + right) / 2;
    const fc = f(c);
    iterations.push({ a: left, b: right, c, fc });

    if (Math.abs(fc) < tolerance || Math.abs(right - left) < tolerance) {
      break;
    }

    if (f(left) * fc < 0) {
      right = c;
    } else {
      left = c;
    }
  }

  return iterations;
}

function computeNewtonIterations(
  f: (x: number) => number,
  fPrime: (x: number) => number,
  x0: number,
  maxSteps: number = 10,
  tolerance: number = 0.0001
) {
  const iterations = [];
  let x = x0;

  for (let i = 0; i < maxSteps; i++) {
    const fx = f(x);
    const fpx = fPrime(x);

    iterations.push({ x, fx, fpx });

    if (Math.abs(fx) < tolerance) {
      break;
    }

    const next = x - fx / fpx;

    if (Math.abs(next - x) < tolerance) {
      iterations.push({ x: next, fx: f(next), fpx: fPrime(next) });
      break;
    }

    x = next;
  }

  return iterations;
}

function computeIterationMethod(
  g: (x: number) => number,
  x0: number,
  maxSteps: number = 10,
  tolerance: number = 0.0001
) {
  const iterations = [];
  let x = x0;

  for (let i = 0; i < maxSteps; i++) {
    iterations.push({ x });

    const next = g(x);

    if (Math.abs(next - x) < tolerance) {
      iterations.push({ x: next });
      break;
    }

    x = next;
  }

  return iterations;
}

function computeFalsePositionIterations(
  f: (x: number) => number,
  a: number,
  b: number,
  maxSteps: number = 10,
  tolerance: number = 0.001
) {
  const iterations = [];
  let left = a;
  let right = b;

  for (let i = 0; i < maxSteps; i++) {
    const fa = f(left);
    const fb = f(right);
    const c = (left * fb - right * fa) / (fb - fa);
    const fc = f(c);

    iterations.push({ a: left, b: right, fa, fb, c });

    if (Math.abs(fc) < tolerance) {
      break;
    }

    if (fa * fc < 0) {
      right = c;
    } else {
      left = c;
    }
  }

  return iterations;
}

function TitleSlide() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 bg-linear-to-br from-slate-900 via-purple-900/30 to-slate-900">
      <h1 className="text-5xl md:text-7xl font-bold bg-linear-to-br from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
        Hybrid Methods
      </h1>
      <h2 className="text-2xl md:text-3xl text-slate-300 mb-8">
        in Numerical Methods
      </h2>
      <div className="px-6 py-3 rounded-full bg-linear-to-br from-cyan-500 to-blue-500 text-white font-bold text-lg inline-block mb-12">
        Root-Finding Algorithms
      </div>
      <div className="flex flex-col items-center gap-3 mt-8">
        <p className="text-xl font-semibold text-cyan-300">
          Student: Yusif Aliyev
        </p>
        <p className="text-xl font-semibold text-emerald-300">
          Teacher: Günel Eyvazlı
        </p>
        <p className="text-lg text-amber-300">Numerical Methods Course</p>
        <div className="px-4 py-2 bg-white/10 rounded-lg font-mono text-white text-lg">
          Group: 6324E
        </div>
      </div>
    </div>
  );
}

function IntroductionSlide() {
  return (
    <div className="flex flex-col h-full p-8 md:p-12 bg-linear-to-br from-slate-900 to-slate-800">
      <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-br from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-8">
        What are Hybrid Methods?
      </h1>
      <div className="grid md:grid-cols-2 gap-8 flex-1">
        <div className="space-y-6">
          <p className="text-lg text-slate-300 leading-relaxed">
            Hybrid methods combine two or more classical root-finding techniques
            to achieve both
            <span className="text-emerald-400 font-bold"> reliability</span> and
            <span className="text-cyan-400 font-bold"> speed</span>.
          </p>
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
            <h3 className="text-xl font-bold text-purple-400 mb-4">
              Classical Methods:
            </h3>
            <ul className="space-y-3 text-slate-300">
              <li className="flex items-center gap-3">
                <span className="w-3 h-3 bg-cyan-400 rounded-full" /> Bisection
                Method
              </li>
              <li className="flex items-center gap-3">
                <span className="w-3 h-3 bg-emerald-400 rounded-full" />{" "}
                Iteration Method
              </li>
              <li className="flex items-center gap-3">
                <span className="w-3 h-3 bg-purple-400 rounded-full" />{" "}
                Newton-Raphson Method
              </li>
              <li className="flex items-center gap-3">
                <span className="w-3 h-3 bg-pink-400 rounded-full" /> False
                Position Method
              </li>
            </ul>
          </div>
        </div>
        <div className="bg-linear-to-br from-cyan-500/10 to-purple-500/10 rounded-xl p-6 border border-cyan-500/20">
          <h3 className="text-xl font-bold text-cyan-400 mb-4">
            Goal of Hybrid Methods
          </h3>
          <div className="bg-slate-900/50 p-4 rounded-lg mb-4">
            <BlockTex math="f(x) = 0" />
          </div>
          <p className="text-slate-300 mb-4">
            Find root <Tex math="x^*" /> where:
          </p>
          <div className="bg-slate-900/50 p-4 rounded-lg">
            <BlockTex math="f(x^*) = 0" />
          </div>
        </div>
      </div>
    </div>
  );
}

function BisectionSlide() {
  return (
    <div className="flex flex-col h-full p-8 md:p-12 bg-linear-to-br from-slate-900 via-cyan-900/20 to-slate-900">
      <h1 className="text-4xl md:text-5xl font-bold text-cyan-400 mb-6">
        Bisection Method
      </h1>
      <div className="grid md:grid-cols-2 gap-8 flex-1">
        <div className="space-y-4">
          <div className="bg-slate-800/70 p-6 rounded-xl border border-cyan-500/30">
            <h3 className="text-lg font-bold text-cyan-300 mb-4">
              Core Formula:
            </h3>
            <div className="bg-slate-900 p-4 rounded-lg">
              <BlockTex math="c = \frac{a + b}{2}" />
            </div>
          </div>
          <div className="bg-slate-800/70 p-6 rounded-xl border border-cyan-500/30">
            <h3 className="text-lg font-bold text-cyan-300 mb-4">Algorithm:</h3>
            <ol className="space-y-2 text-slate-300 text-sm">
              <li>
                1. Check: <Tex math="f(a) \cdot f(b) < 0" />
              </li>
              <li>
                2. Compute midpoint: <Tex math="c = \frac{a + b}{2}" />
              </li>
              <li>
                3. If <Tex math="f(a) \cdot f(c) < 0" /> then{" "}
                <Tex math="b = c" />
              </li>
              <li>
                4. Else <Tex math="a = c" />
              </li>
              <li>
                5. Repeat until <Tex math="|b - a| < \epsilon" />
              </li>
            </ol>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/30">
            <h3 className="text-lg font-bold text-emerald-400 mb-2">
              Advantages
            </h3>
            <ul className="text-slate-300 text-sm space-y-1">
              <li>Always converges (guaranteed)</li>
              <li>Simple to implement</li>
              <li>No derivative needed</li>
            </ul>
          </div>
          <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/30">
            <h3 className="text-lg font-bold text-red-400 mb-2">
              Disadvantages
            </h3>
            <ul className="text-slate-300 text-sm space-y-1">
              <li>Slow convergence (linear)</li>
              <li>Requires initial bracket</li>
            </ul>
          </div>
          <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-600">
            <h3 className="text-lg font-bold text-slate-300 mb-2">
              Convergence Rate:
            </h3>
            <BlockTex math="\text{Error} \leq \frac{b-a}{2^{n+1}}" />
          </div>
        </div>
      </div>
    </div>
  );
}

function BisectionAnimationSlide() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(2);
  const [tolerance, setTolerance] = useState(0.001);

  const [aInput, setAInput] = useState("1");
  const [bInput, setBInput] = useState("2");
  const [toleranceInput, setToleranceInput] = useState("0.001");

  const f = (x: number) => x * x * x - x - 2;
  const root = 1.5214;

  const iterations = computeBisectionIterations(f, a, b, 100, tolerance);
  const animation = useAnimationSteps(iterations.length, 1500);

  const handleApply = () => {
    const newA = parseFloat(aInput) || 0;
    const newB = parseFloat(bInput) || 0;
    const newTolerance = parseFloat(toleranceInput) || 0.001;
    setA(newA);
    setB(newB);
    setTolerance(newTolerance);
  };

  const points = iterations.map((iter, i) => ({
    x: iter.c,
    label: `c${i + 1}=${iter.c.toFixed(3)}`,
    color: "bg-cyan-400",
  }));

  const intervals = iterations.map((iter) => ({ a: iter.a, b: iter.b }));

  return (
    <div className="flex flex-col h-full p-6 md:p-10 bg-linear-to-br from-slate-900 via-cyan-900/20 to-slate-900">
      <h1 className="text-3xl md:text-4xl font-bold text-cyan-400 mb-4">
        Bisection Animation
      </h1>
      <div className="bg-slate-800/50 p-4 rounded-xl border border-cyan-500/30 mb-4">
        <p className="text-slate-300 mb-2">
          Solving: <Tex math="f(x) = x^3 - x - 2 = 0" /> on interval{" "}
          <Tex math={`[${a}, ${b}]`} />
        </p>
        <div className="flex gap-4 mt-3 flex-wrap items-center">
          <div className="flex items-center gap-2">
            <label className="text-slate-400 text-sm">a:</label>
            <input
              type="number"
              value={aInput}
              onChange={(e) => setAInput(e.target.value)}
              className="w-20 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm"
              step="0.1"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-slate-400 text-sm">b:</label>
            <input
              type="number"
              value={bInput}
              onChange={(e) => setBInput(e.target.value)}
              className="w-20 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm"
              step="0.1"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-slate-400 text-sm">Tolerance:</label>
            <input
              type="number"
              value={toleranceInput}
              onChange={(e) => setToleranceInput(e.target.value)}
              className="w-24 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm"
              step="0.0001"
            />
          </div>
          <button
            onClick={handleApply}
            className="px-4 py-1 bg-cyan-600 hover:bg-cyan-700 border border-cyan-500 text-white rounded text-sm font-medium transition-colors cursor-pointer"
          >
            Apply
          </button>
        </div>
      </div>

      <div className="flex-1 grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
          <h3 className="text-lg font-bold text-cyan-300 mb-3">
            Number Line Visualization
          </h3>
          <NumberLine
            points={points}
            min={a}
            max={b}
            root={root}
            activeStep={animation.step}
            intervals={intervals}
          />
        </div>

        <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
          <h3 className="text-lg font-bold text-cyan-300 mb-3">
            Current Iteration {animation.step + 1}
          </h3>
          {animation.step < iterations.length && (
            <div className="space-y-3 text-slate-300">
              <div className="bg-slate-900/50 p-3 rounded-lg">
                <BlockTex
                  math={`a = ${iterations[animation.step].a.toFixed(
                    4
                  )}, \\quad b = ${iterations[animation.step].b.toFixed(4)}`}
                />
              </div>
              <div className="bg-cyan-500/10 p-3 rounded-lg border border-cyan-500/30">
                <BlockTex
                  math={`c = \\frac{${iterations[animation.step].a.toFixed(
                    4
                  )} + ${iterations[animation.step].b.toFixed(
                    4
                  )}}{2} = ${iterations[animation.step].c.toFixed(4)}`}
                />
              </div>
              <div className="bg-purple-500/10 p-3 rounded-lg border border-purple-500/30">
                <BlockTex
                  math={`f(c) = f(${iterations[animation.step].c.toFixed(
                    4
                  )}) = ${iterations[animation.step].fc.toFixed(4)}`}
                />
              </div>
              <p className="text-sm text-slate-400">
                Since{" "}
                <Tex
                  math={`f(c) ${
                    iterations[animation.step].fc > 0 ? "> 0" : "< 0"
                  }`}
                />
                , update interval accordingly
              </p>
            </div>
          )}
        </div>
      </div>

      <AnimationControls
        isPlaying={animation.isPlaying}
        onPlay={animation.play}
        onPause={animation.pause}
        onReset={animation.reset}
        onNext={animation.nextStep}
        step={animation.step}
        totalSteps={iterations.length}
      />
    </div>
  );
}

function NewtonRaphsonSlide() {
  return (
    <div className="flex flex-col h-full p-8 md:p-12 bg-linear-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <h1 className="text-4xl md:text-5xl font-bold text-purple-400 mb-6">
        Newton-Raphson Method
      </h1>
      <div className="grid md:grid-cols-2 gap-8 flex-1">
        <div className="space-y-4">
          <div className="bg-slate-800/70 p-6 rounded-xl border border-purple-500/30">
            <h3 className="text-lg font-bold text-purple-300 mb-4">
              Iteration Formula:
            </h3>
            <div className="bg-slate-900 p-4 rounded-lg">
              <BlockTex math="x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)}" />
            </div>
          </div>
          <div className="bg-slate-800/70 p-6 rounded-xl border border-purple-500/30">
            <h3 className="text-lg font-bold text-purple-300 mb-4">
              Derivation (Taylor Series):
            </h3>
            <div className="bg-slate-900 p-3 rounded-lg text-sm space-y-2">
              <BlockTex math="f(x) \approx f(x_n) + f'(x_n)(x - x_n)" />
              <BlockTex math="0 = f(x_n) + f'(x_n)(x_{n+1} - x_n)" />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/30">
            <h3 className="text-lg font-bold text-emerald-400 mb-2">
              Advantages
            </h3>
            <ul className="text-slate-300 text-sm space-y-1">
              <li>Quadratic convergence (very fast)</li>
              <li>Efficient for smooth functions</li>
            </ul>
          </div>
          <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/30">
            <h3 className="text-lg font-bold text-red-400 mb-2">
              Disadvantages
            </h3>
            <ul className="text-slate-300 text-sm space-y-1">
              <li>
                Requires derivative <Tex math="f'(x)" />
              </li>
              <li>
                May diverge if <Tex math="f'(x_n) \approx 0" />
              </li>
              <li>Needs good initial guess</li>
            </ul>
          </div>
          <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-600">
            <h3 className="text-lg font-bold text-slate-300 mb-2">
              Convergence:
            </h3>
            <BlockTex math="e_{n+1} \approx \frac{f''(\xi)}{2f'(\xi)} e_n^2" />
          </div>
        </div>
      </div>
    </div>
  );
}

function NewtonAnimationSlide() {
  const [x0, setX0] = useState(2);
  const [tolerance, setTolerance] = useState(0.0001);

  const [x0Input, setX0Input] = useState("2");
  const [toleranceInput, setToleranceInput] = useState("0.0001");

  const f = (x: number) => x * x - 2;
  const fPrime = (x: number) => 2 * x;
  const root = Math.sqrt(2);

  const iterations = computeNewtonIterations(f, fPrime, x0, 100, tolerance);
  const animation = useAnimationSteps(iterations.length, 1500);

  const handleApply = () => {
    const newX0 = parseFloat(x0Input) || 0;
    const newTolerance = parseFloat(toleranceInput) || 0.0001;
    setX0(newX0);
    setTolerance(newTolerance);
  };

  const steps = iterations.map((iter) => ({ x: iter.x, slope: iter.fpx }));

  return (
    <div className="flex flex-col h-full p-6 md:p-10 bg-linear-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <h1 className="text-3xl md:text-4xl font-bold text-purple-400 mb-4">
        Newton-Raphson Animation
      </h1>
      <div className="bg-slate-800/50 p-4 rounded-xl border border-purple-500/30 mb-4">
        <p className="text-slate-300 mb-2">
          Solving: <Tex math="f(x) = x^2 - 2 = 0" /> (finding{" "}
          <Tex math="\sqrt{2}" />
          ), starting at <Tex math={`x_0 = ${x0}`} />
        </p>
        <div className="flex gap-4 mt-3 flex-wrap items-center">
          <div className="flex items-center gap-2">
            <label className="text-slate-400 text-sm">Initial x₀:</label>
            <input
              type="number"
              value={x0Input}
              onChange={(e) => setX0Input(e.target.value)}
              className="w-20 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm"
              step="0.1"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-slate-400 text-sm">Tolerance:</label>
            <input
              type="number"
              value={toleranceInput}
              onChange={(e) => setToleranceInput(e.target.value)}
              className="w-24 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm"
              step="0.0001"
            />
          </div>
          <button
            onClick={handleApply}
            className="px-4 py-1 bg-purple-600 hover:bg-purple-700 border border-purple-500 text-white rounded text-sm font-medium transition-colors cursor-pointer"
          >
            Apply
          </button>
        </div>
      </div>

      <div className="flex-1 grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center">
          <h3 className="text-lg font-bold text-purple-300 mb-3">
            Tangent Line Visualization
          </h3>
          <CartesianPlot
            func={f}
            steps={steps}
            activeStep={animation.step}
            xMin={0}
            xMax={3}
            yMin={-2}
            yMax={4}
          />
        </div>

        <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
          <h3 className="text-lg font-bold text-purple-300 mb-3">
            Current Iteration {animation.step + 1}
          </h3>
          {animation.step < iterations.length && (
            <div className="space-y-3 text-slate-300">
              <div className="bg-slate-900/50 p-3 rounded-lg">
                <BlockTex
                  math={`x_n = ${iterations[animation.step].x.toFixed(4)}`}
                />
              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg">
                <BlockTex
                  math={`f(x_n) = (${iterations[animation.step].x.toFixed(
                    4
                  )})^2 - 2 = ${iterations[animation.step].fx.toFixed(4)}`}
                />
              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg">
                <BlockTex
                  math={`f'(x_n) = 2 \\cdot ${iterations[
                    animation.step
                  ].x.toFixed(4)} = ${iterations[animation.step].fpx.toFixed(
                    4
                  )}`}
                />
              </div>
              <div className="bg-purple-500/10 p-3 rounded-lg border border-purple-500/30">
                <BlockTex
                  math={`x_{n+1} = ${iterations[animation.step].x.toFixed(
                    4
                  )} - \\frac{${iterations[animation.step].fx.toFixed(
                    4
                  )}}{${iterations[animation.step].fpx.toFixed(4)}} = ${
                    animation.step < iterations.length - 1
                      ? iterations[animation.step + 1].x.toFixed(4)
                      : iterations[animation.step].x.toFixed(4)
                  }`}
                />
              </div>
              <p className="text-sm text-emerald-400">
                Exact value:{" "}
                <Tex math={`\\sqrt{2} \\approx ${root.toFixed(6)}`} />
              </p>
            </div>
          )}
        </div>
      </div>

      <AnimationControls
        isPlaying={animation.isPlaying}
        onPlay={animation.play}
        onPause={animation.pause}
        onReset={animation.reset}
        onNext={animation.nextStep}
        step={animation.step}
        totalSteps={iterations.length}
      />
    </div>
  );
}

function IterationSlide() {
  return (
    <div className="flex flex-col h-full p-8 md:p-12 bg-linear-to-br from-slate-900 via-emerald-900/20 to-slate-900">
      <h1 className="text-4xl md:text-5xl font-bold text-emerald-400 mb-6">
        Fixed-Point Iteration
      </h1>
      <div className="grid md:grid-cols-2 gap-8 flex-1">
        <div className="space-y-4">
          <div className="bg-slate-800/70 p-6 rounded-xl border border-emerald-500/30">
            <h3 className="text-lg font-bold text-emerald-300 mb-4">
              Core Concept:
            </h3>
            <div className="bg-slate-900 p-4 rounded-lg space-y-3">
              <p className="text-slate-300 text-sm">
                Transform <Tex math="f(x) = 0" /> into:
              </p>
              <BlockTex math="x = g(x)" />
              <p className="text-slate-300 text-sm">Then iterate:</p>
              <BlockTex math="x_{n+1} = g(x_n)" />
            </div>
          </div>
          <div className="bg-slate-800/70 p-6 rounded-xl border border-emerald-500/30">
            <h3 className="text-lg font-bold text-emerald-300 mb-4">
              Convergence Condition:
            </h3>
            <div className="bg-slate-900 p-4 rounded-lg">
              <BlockTex math="|g'(x)| < 1 \quad \text{near root}" />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/30">
            <h3 className="text-lg font-bold text-emerald-400 mb-2">
              Advantages
            </h3>
            <ul className="text-slate-300 text-sm space-y-1">
              <li>Simple implementation</li>
              <li>No derivative needed</li>
              <li>Multiple forms possible</li>
            </ul>
          </div>
          <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/30">
            <h3 className="text-lg font-bold text-red-400 mb-2">
              Disadvantages
            </h3>
            <ul className="text-slate-300 text-sm space-y-1">
              <li>May not converge</li>
              <li>Linear convergence</li>
              <li>
                Depends on choice of <Tex math="g(x)" />
              </li>
            </ul>
          </div>
          <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-600">
            <h3 className="text-lg font-bold text-slate-300 mb-2">
              Example Transformation:
            </h3>
            <div className="text-sm">
              <BlockTex math="x^2 - 2 = 0 \implies x = \frac{2}{x}" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IterationAnimationSlide() {
  const [x0, setX0] = useState(0);
  const [tolerance, setTolerance] = useState(0.0001);

  const [x0Input, setX0Input] = useState("0");
  const [toleranceInput, setToleranceInput] = useState("0.0001");

  const g = (x: number) => Math.cos(x);
  const root = 0.7391;

  const iterations = computeIterationMethod(g, x0, 100, tolerance);
  const animation = useAnimationSteps(iterations.length, 1200);

  const handleApply = () => {
    const newX0 = parseFloat(x0Input) || 0;
    const newTolerance = parseFloat(toleranceInput) || 0.0001;
    setX0(newX0);
    setTolerance(newTolerance);
  };

  const points = iterations.map((iter, i) => ({
    x: iter.x,
    label: `x${i}=${iter.x.toFixed(3)}`,
    color: "bg-emerald-400",
  }));

  return (
    <div className="flex flex-col h-full p-6 md:p-10 bg-linear-to-br from-slate-900 via-emerald-900/20 to-slate-900">
      <h1 className="text-3xl md:text-4xl font-bold text-emerald-400 mb-4">
        Iteration Animation
      </h1>
      <div className="bg-slate-800/50 p-4 rounded-xl border border-emerald-500/30 mb-4">
        <p className="text-slate-300 mb-2">
          Solving: <Tex math="x = \\cos(x)" /> starting at{" "}
          <Tex math={`x_0 = ${x0}`} />
        </p>
        <div className="flex gap-4 mt-3 flex-wrap items-center">
          <div className="flex items-center gap-2">
            <label className="text-slate-400 text-sm">Initial x₀:</label>
            <input
              type="number"
              value={x0Input}
              onChange={(e) => setX0Input(e.target.value)}
              className="w-20 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm"
              step="0.1"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-slate-400 text-sm">Tolerance:</label>
            <input
              type="number"
              value={toleranceInput}
              onChange={(e) => setToleranceInput(e.target.value)}
              className="w-24 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm"
              step="0.0001"
            />
          </div>
          <button
            onClick={handleApply}
            className="px-4 py-1 bg-emerald-600 hover:bg-emerald-700 border border-emerald-500 text-white rounded text-sm font-medium transition-colors cursor-pointer"
          >
            Apply
          </button>
        </div>
      </div>

      <div className="flex-1 grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
          <h3 className="text-lg font-bold text-emerald-300 mb-3">
            Number Line (Spiral Convergence)
          </h3>
          <NumberLine
            points={points}
            min={0}
            max={1.2}
            root={root}
            activeStep={animation.step}
          />
          <p className="text-xs text-slate-400 mt-2 text-center">
            Watch the values spiral toward the fixed point
          </p>
        </div>

        <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
          <h3 className="text-lg font-bold text-emerald-300 mb-3">
            Current Iteration {animation.step + 1}
          </h3>
          {animation.step < iterations.length && (
            <div className="space-y-3 text-slate-300">
              <div className="bg-slate-900/50 p-3 rounded-lg">
                <BlockTex
                  math={`x_n = ${iterations[animation.step].x.toFixed(4)}`}
                />
              </div>
              <div className="bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/30">
                <BlockTex
                  math={`x_{n+1} = g(x_n) = \\cos(${iterations[
                    animation.step
                  ].x.toFixed(4)}) = ${
                    animation.step < iterations.length - 1
                      ? iterations[animation.step + 1].x.toFixed(4)
                      : iterations[animation.step].x.toFixed(4)
                  }`}
                />
              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg">
                <BlockTex
                  math={`|x_{n} - x^*| = |${iterations[
                    animation.step
                  ].x.toFixed(4)} - ${root}| = ${Math.abs(
                    iterations[animation.step].x - root
                  ).toFixed(4)}`}
                />
              </div>
              <p className="text-sm text-emerald-400">
                Fixed point: <Tex math={`x^* \\approx ${root}`} />
              </p>
            </div>
          )}
        </div>
      </div>

      <AnimationControls
        isPlaying={animation.isPlaying}
        onPlay={animation.play}
        onPause={animation.pause}
        onReset={animation.reset}
        onNext={animation.nextStep}
        step={animation.step}
        totalSteps={iterations.length}
      />
    </div>
  );
}

function FalsePositionSlide() {
  return (
    <div className="flex flex-col h-full p-8 md:p-12 bg-linear-to-br from-slate-900 via-pink-900/20 to-slate-900">
      <h1 className="text-4xl md:text-5xl font-bold text-pink-400 mb-6">
        False Position (Regula Falsi)
      </h1>
      <div className="grid md:grid-cols-2 gap-8 flex-1">
        <div className="space-y-4">
          <div className="bg-slate-800/70 p-6 rounded-xl border border-pink-500/30">
            <h3 className="text-lg font-bold text-pink-300 mb-4">
              Core Formula:
            </h3>
            <div className="bg-slate-900 p-4 rounded-lg">
              <BlockTex math="c = \frac{a \cdot f(b) - b \cdot f(a)}{f(b) - f(a)}" />
            </div>
          </div>
          <div className="bg-slate-800/70 p-6 rounded-xl border border-pink-500/30">
            <h3 className="text-lg font-bold text-pink-300 mb-4">
              Alternative Form:
            </h3>
            <div className="bg-slate-900 p-4 rounded-lg">
              <BlockTex math="c = b - \frac{f(b)(b-a)}{f(b) - f(a)}" />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/30">
            <h3 className="text-lg font-bold text-emerald-400 mb-2">
              Advantages
            </h3>
            <ul className="text-slate-300 text-sm space-y-1">
              <li>Guaranteed convergence</li>
              <li>Usually faster than bisection</li>
              <li>Uses function values smartly</li>
            </ul>
          </div>
          <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/30">
            <h3 className="text-lg font-bold text-red-400 mb-2">
              Disadvantages
            </h3>
            <ul className="text-slate-300 text-sm space-y-1">
              <li>One endpoint may get "stuck"</li>
              <li>Can be slower than bisection</li>
            </ul>
          </div>
          <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-600">
            <h3 className="text-lg font-bold text-slate-300 mb-2">
              Geometric Meaning:
            </h3>
            <p className="text-sm text-slate-400">
              Secant line through <Tex math="(a, f(a))" /> and{" "}
              <Tex math="(b, f(b))" />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FalsePositionAnimationSlide() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(2);
  const [tolerance, setTolerance] = useState(0.001);

  const [aInput, setAInput] = useState("1");
  const [bInput, setBInput] = useState("2");
  const [toleranceInput, setToleranceInput] = useState("0.001");

  const f = (x: number) => x * x * x - x - 2;
  const root = 1.5214;

  const iterations = computeFalsePositionIterations(f, a, b, 100, tolerance);
  const animation = useAnimationSteps(iterations.length, 1500);

  const handleApply = () => {
    const newA = parseFloat(aInput) || 0;
    const newB = parseFloat(bInput) || 0;
    const newTolerance = parseFloat(toleranceInput) || 0.001;
    setA(newA);
    setB(newB);
    setTolerance(newTolerance);
  };

  const points = iterations.map((iter, i) => ({
    x: iter.c,
    label: `c${i + 1}=${iter.c.toFixed(3)}`,
    color: "bg-pink-400",
  }));

  // For false position, show the interval that produced the current c value
  const intervals = iterations.map((iter) => ({ a: iter.a, b: iter.b }));

  return (
    <div className="flex flex-col h-full p-6 md:p-10 bg-linear-to-br from-slate-900 via-pink-900/20 to-slate-900">
      <h1 className="text-3xl md:text-4xl font-bold text-pink-400 mb-4">
        False Position Animation
      </h1>
      <div className="bg-slate-800/50 p-4 rounded-xl border border-pink-500/30 mb-4">
        <p className="text-slate-300 mb-2">
          Solving: <Tex math="f(x) = x^3 - x - 2 = 0" /> on interval{" "}
          <Tex math={`[${a}, ${b}]`} />
        </p>
        <div className="flex gap-4 mt-3 flex-wrap items-center">
          <div className="flex items-center gap-2">
            <label className="text-slate-400 text-sm">a:</label>
            <input
              type="number"
              value={aInput}
              onChange={(e) => setAInput(e.target.value)}
              className="w-20 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm"
              step="0.1"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-slate-400 text-sm">b:</label>
            <input
              type="number"
              value={bInput}
              onChange={(e) => setBInput(e.target.value)}
              className="w-20 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm"
              step="0.1"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-slate-400 text-sm">Tolerance:</label>
            <input
              type="number"
              value={toleranceInput}
              onChange={(e) => setToleranceInput(e.target.value)}
              className="w-24 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm"
              step="0.0001"
            />
          </div>
          <button
            onClick={handleApply}
            className="px-4 py-1 bg-pink-600 hover:bg-pink-700 border border-pink-500 text-white rounded text-sm font-medium transition-colors cursor-pointer"
          >
            Apply
          </button>
        </div>
      </div>

      <div className="flex-1 grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
          <h3 className="text-lg font-bold text-pink-300 mb-3">
            Number Line Visualization
          </h3>
          <NumberLine
            points={points}
            min={a}
            max={b}
            root={root}
            activeStep={animation.step}
            intervals={intervals}
          />
        </div>

        <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
          <h3 className="text-lg font-bold text-pink-300 mb-3">
            Current Iteration {animation.step + 1}
          </h3>
          {animation.step < iterations.length && (
            <div className="space-y-2 text-slate-300 text-sm">
              <div className="bg-slate-900/50 p-2 rounded-lg">
                <BlockTex
                  math={`a = ${iterations[animation.step].a.toFixed(
                    4
                  )}, \\quad f(a) = ${iterations[animation.step].fa.toFixed(
                    4
                  )}`}
                />
              </div>
              <div className="bg-slate-900/50 p-2 rounded-lg">
                <BlockTex
                  math={`b = ${iterations[animation.step].b.toFixed(
                    4
                  )}, \\quad f(b) = ${iterations[animation.step].fb.toFixed(
                    4
                  )}`}
                />
              </div>
              <div className="bg-pink-500/10 p-2 rounded-lg border border-pink-500/30">
                <BlockTex
                  math={`c = \\frac{(${iterations[animation.step].a.toFixed(
                    2
                  )})(${iterations[animation.step].fb.toFixed(2)}) - (${
                    iterations[animation.step].b
                  })(${iterations[animation.step].fa.toFixed(2)})}{${iterations[
                    animation.step
                  ].fb.toFixed(2)} - (${iterations[animation.step].fa.toFixed(
                    2
                  )})} = ${iterations[animation.step].c.toFixed(4)}`}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimationControls
        isPlaying={animation.isPlaying}
        onPlay={animation.play}
        onPause={animation.pause}
        onReset={animation.reset}
        onNext={animation.nextStep}
        step={animation.step}
        totalSteps={iterations.length}
      />
    </div>
  );
}

function HybridCombinationsSlide() {
  return (
    <div className="flex flex-col h-full p-8 md:p-12 bg-linear-to-br from-slate-900 via-amber-900/20 to-slate-900">
      <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-br from-amber-400 to-orange-400 bg-clip-text text-transparent mb-6">
        Hybrid Combinations
      </h1>
      <div className="grid md:grid-cols-2 gap-6 flex-1">
        <div className="bg-linear-to-br from-cyan-500/10 to-purple-500/10 p-5 rounded-xl border border-cyan-500/30">
          <h3 className="text-xl font-bold text-cyan-400 mb-3">
            Bisection + Newton
          </h3>
          <p className="text-slate-300 text-sm mb-3">
            Start with bisection for safety, switch to Newton for speed.
          </p>
          <div className="bg-slate-900/50 p-3 rounded-lg">
            <BlockTex math="\text{If } |f'(x)| > \delta \text{ use Newton}" />
          </div>
        </div>

        <div className="bg-linear-to-br from-pink-500/10 to-cyan-500/10 p-5 rounded-xl border border-pink-500/30">
          <h3 className="text-xl font-bold text-pink-400 mb-3">
            False Position + Newton
          </h3>
          <p className="text-slate-300 text-sm mb-3">
            Use regula falsi to narrow bracket, finish with Newton.
          </p>
          <div className="bg-slate-900/50 p-3 rounded-lg">
            <BlockTex math="\text{Switch when } |b-a| < \epsilon_1" />
          </div>
        </div>

        <div className="bg-linear-to-br from-emerald-500/10 to-cyan-500/10 p-5 rounded-xl border border-emerald-500/30">
          <h3 className="text-xl font-bold text-emerald-400 mb-3">
            False Position + Iteration
          </h3>
          <p className="text-slate-300 text-sm mb-3">
            Use false position to get close, refine with iteration method.
          </p>
          <div className="bg-slate-900/50 p-3 rounded-lg">
            <BlockTex math="\text{Switch when } |f(c)| < \epsilon_1" />
          </div>
        </div>

        <div className="bg-linear-to-br from-purple-500/10 to-pink-500/10 p-5 rounded-xl border border-purple-500/30">
          <h3 className="text-xl font-bold text-purple-400 mb-3">
            Bisection + Iteration
          </h3>
          <p className="text-slate-300 text-sm mb-3">
            Start with bisection to bracket root, finish with iteration.
          </p>
          <div className="bg-slate-900/50 p-3 rounded-lg">
            <BlockTex math="\text{Use } x_{n+1} = g(x_n) \text{ when close}" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SummarySlide() {
  return (
    <div className="flex flex-col h-full p-8 md:p-12 bg-linear-to-br from-slate-900 via-purple-900/30 to-slate-900">
      <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-br from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-8">
        Summary
      </h1>
      <div className="grid md:grid-cols-2 gap-8 flex-1">
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-cyan-400">Key Formulas</h3>
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-4">
            <div>
              <span className="text-cyan-300 text-sm">Bisection:</span>
              <BlockTex math="c = \frac{a + b}{2}" />
            </div>
            <div>
              <span className="text-purple-300 text-sm">Newton-Raphson:</span>
              <BlockTex math="x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)}" />
            </div>
            <div>
              <span className="text-emerald-300 text-sm">Iteration:</span>
              <BlockTex math="x_{n+1} = g(x_n)" />
            </div>
            <div>
              <span className="text-pink-300 text-sm">False Position:</span>
              <BlockTex math="c = \frac{af(b) - bf(a)}{f(b) - f(a)}" />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-emerald-400">Why Hybrid?</h3>
          <div className="bg-linear-to-br from-emerald-500/10 to-cyan-500/10 p-6 rounded-xl border border-emerald-500/30">
            <ul className="space-y-4 text-slate-300">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-emerald-400 rounded-full mt-2" />
                <span>
                  <strong className="text-emerald-400">
                    Guaranteed convergence
                  </strong>{" "}
                  from bracketing methods
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-cyan-400 rounded-full mt-2" />
                <span>
                  <strong className="text-cyan-400">Fast convergence</strong>{" "}
                  from Newton-type methods
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-purple-400 rounded-full mt-2" />
                <span>
                  <strong className="text-purple-400">Robustness</strong> by
                  switching when needed
                </span>
              </li>
            </ul>
          </div>
          <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/30 text-center">
            <p className="text-amber-300 font-bold text-lg">
              Best of both worlds!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThankYouSlide() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 bg-linear-to-br from-slate-900 via-purple-900/30 to-slate-900">
      <h1 className="text-6xl md:text-8xl font-bold bg-linear-to-br from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-8">
        Thank You!
      </h1>
      <div className="space-y-6 mb-12">
        <div className="flex flex-col items-center gap-4">
          <div className="px-6 py-3 rounded-full bg-linear-to-br from-cyan-500 to-blue-500 text-white font-bold text-xl">
            Yusif Aliyev
          </div>
          <p className="text-xl md:text-2xl text-slate-300 mt-4">
            Questions? Contact me using these links
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <a
          href="https://yusifaliyevpro.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-slate-800/50 p-4 rounded-xl border border-cyan-500/30 hover:bg-slate-700/50 hover:border-cyan-400/50 transition-all cursor-pointer"
        >
          <FaGlobe className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
          <p className="text-xs text-slate-400">Website</p>
        </a>
        <a
          href="https://github.com/yusifaliyevpro"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-slate-800/50 p-4 rounded-xl border border-slate-500/30 hover:bg-slate-700/50 hover:border-slate-400/50 transition-all cursor-pointer"
        >
          <FaGithub className="w-6 h-6 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-400">GitHub</p>
        </a>
        <a
          href="https://www.facebook.com/yusifaliyevpro"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-slate-800/50 p-4 rounded-xl border border-blue-500/30 hover:bg-slate-700/50 hover:border-blue-400/50 transition-all cursor-pointer"
        >
          <FaFacebook className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <p className="text-xs text-slate-400">Facebook</p>
        </a>
        <a
          href="https://www.linkedin.com/in/yusifaliyevpro/"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-slate-800/50 p-4 rounded-xl border border-sky-500/30 hover:bg-slate-700/50 hover:border-sky-400/50 transition-all cursor-pointer"
        >
          <FaLinkedin className="w-6 h-6 text-sky-400 mx-auto mb-2" />
          <p className="text-xs text-slate-400">LinkedIn</p>
        </a>
      </div>
    </div>
  );
}

// ============== MAIN PRESENTATION COMPONENT ==============

export default function HybridMethodsPresentation() {
  const [currentSlide, setCurrentSlide] = useQueryState(
    "p",
    parseAsInteger.withDefault(1)
  );

  const slides = [
    <TitleSlide key="title" />,
    <IntroductionSlide key="intro" />,
    <BisectionSlide key="bisection" />,
    <BisectionAnimationSlide key="bisection-anim" />,
    <NewtonRaphsonSlide key="newton" />,
    <NewtonAnimationSlide key="newton-anim" />,
    <IterationSlide key="iteration" />,
    <IterationAnimationSlide key="iteration-anim" />,
    <FalsePositionSlide key="falsepos" />,
    <FalsePositionAnimationSlide key="falsepos-anim" />,
    <HybridCombinationsSlide key="hybrid" />,
    <SummarySlide key="summary" />,
    <ThankYouSlide key="thankyou" />,
  ];

  const totalSlides = slides.length;
  const slideIndex = currentSlide - 1; // Convert 1-based to 0-based index

  const nextSlide = useCallback(() => {
    if (currentSlide < totalSlides) {
      setCurrentSlide(currentSlide + 1);
    }
  }, [currentSlide, totalSlides, setCurrentSlide]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 1) {
      setCurrentSlide(currentSlide - 1);
    }
  }, [currentSlide, setCurrentSlide]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        nextSlide();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        prevSlide();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  return (
    <div className="h-screen w-screen bg-slate-900 text-white overflow-hidden">
      {/* Slide Number - Top Right */}
      <div className="fixed top-4 right-6 text-slate-400 font-mono text-lg z-50">
        {currentSlide} / {totalSlides}
      </div>

      {/* Slide Content */}
      <div className="h-full overflow-hidden">{slides[slideIndex]}</div>
    </div>
  );
}

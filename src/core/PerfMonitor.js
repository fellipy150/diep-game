// src/core/PerfMonitor.js
const PerfMonitor = (() => {
    const FRAME_BUDGET_MS = 16.6;
    const WARN_THRESHOLD_MS = 15.0;
    const HISTORY_SIZE = 120;
    const _history = {
        frameTimes: new Float32Array(HISTORY_SIZE),
        systems: {},
        frameIndex: 0,
    };
    let _frameStart = 0;
    let _frameCount = 0;
    let _slowFrameCount = 0;
    let _enabled = true;
    const _marks = {};
    function enable()  { _enabled = true;  }
    function disable() { _enabled = false; }
    function frameStart(time) {
        if (!_enabled) return;
        _frameStart = time;
        performance.mark('frame:start');
    }
    function frameEnd() {
        if (!_enabled) return;
        performance.mark('frame:end');
        performance.measure('frame:total', 'frame:start', 'frame:end');
        const entry = performance.getEntriesByName('frame:total').at(-1);
        const dt = entry ? entry.duration : (performance.now() - _frameStart);
        const idx = _frameCount % HISTORY_SIZE;
        _history.frameTimes[idx] = dt;
        _history.frameIndex = idx;
        _frameCount++;
        if (dt > FRAME_BUDGET_MS) {
            _slowFrameCount++;
        }
        performance.clearMarks('frame:start');
        performance.clearMarks('frame:end');
        performance.clearMeasures('frame:total');
    }
    function markStart(name) {
        if (!_enabled) return;
        _marks[name] = performance.now();
        performance.mark(`${name}:start`);
    }
    function markEnd(name) {
        if (!_enabled) return 0;
        const duration = performance.now() - (_marks[name] || performance.now());
        performance.mark(`${name}:end`);
        performance.measure(name, `${name}:start`, `${name}:end`);
        if (!_history.systems[name]) {
            _history.systems[name] = new Float32Array(HISTORY_SIZE);
        }
        _history.systems[name][_history.frameIndex] = duration;
        if (duration > WARN_THRESHOLD_MS) {
            console.warn(`⚠️ PERF [${name}] ${duration.toFixed(2)}ms (budget: ${WARN_THRESHOLD_MS}ms)`);
        }
        performance.clearMarks(`${name}:start`);
        performance.clearMarks(`${name}:end`);
        performance.clearMeasures(name);
        return duration;
    }
    function report(label = 'Relatório de Performance') {
        const times = Array.from(_history.frameTimes).filter(t => t > 0);
        if (times.length === 0) { console.log('Sem dados ainda.'); return; }
        const avg  = times.reduce((a, b) => a + b, 0) / times.length;
        const max  = Math.max(...times);
        const fps  = 1000 / avg;
        const slow = ((_slowFrameCount / _frameCount) * 100).toFixed(1);
        console.group(`📊 ${label}`);
        console.log(`FPS médio     : ${fps.toFixed(1)}`);
        console.log(`Frame médio   : ${avg.toFixed(2)} ms`);
        console.log(`Frame máximo  : ${max.toFixed(2)} ms`);
        console.log(`Frames lentos : ${slow}% (>${FRAME_BUDGET_MS}ms)`);
        if (Object.keys(_history.systems).length > 0) {
            console.group('⏱️  Subsistemas (média dos últimos frames):');
            const sorted = Object.entries(_history.systems)
                .map(([name, arr]) => {
                    const a = Array.from(arr).filter(v => v > 0);
                    return { name, avg: a.reduce((x, y) => x + y, 0) / (a.length || 1) };
                })
                .sort((a, b) => b.avg - a.avg);
            for (const { name, avg: sysAvg } of sorted) {
                console.log(`${name.padEnd(20)}: ${sysAvg.toFixed(3)}ms`);
            }
            console.groupEnd();
        }
        console.groupEnd();
    }
    if (typeof window !== 'undefined') {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyP' && e.shiftKey) {
                report(`Snapshot — Frame #${_frameCount}`);
            }
        });
    }
    return { enable, disable, frameStart, frameEnd, markStart, markEnd, report };
})();
window.__perf = PerfMonitor;
export default PerfMonitor;

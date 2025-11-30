const functionPerformance = new Map<Function, string>();

export function withPerformanceLogging<T extends (...args: any[]) => any>(fn: T): T {
  return function(...args: any[]) {
    const start = performance.now();
    let result = fn(...args);
    
    const endPerformanceLog = () => {
      const end = performance.now();
      const executionTime = (end - start).toFixed(2);
      functionPerformance.set(fn, executionTime);
      console.log(`Function ${fn.name || 'anonymous'} took ${executionTime} milliseconds.n/${(new Error()).stack}`);
    };
    
    if (result instanceof Promise) {
      // 处理异步函数
      return result.then(res => {
        endPerformanceLog();
        return res;
      }).catch(err => {
        endPerformanceLog();
        throw err; // 继续抛出错误，以便调用者可以处理它
      }) as any;
    } else {
      // 处理同步函数
      endPerformanceLog();
      return result;
    }
  } as T;
}
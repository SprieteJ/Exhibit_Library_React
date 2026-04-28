import { createContext, useContext } from 'react';

const ChartContext = createContext({ chartKey: null, onMetaChange: null });

export function ChartProvider({ chartKey, onMetaChange, children }) {
  return (
    <ChartContext.Provider value={{ chartKey, onMetaChange }}>
      {children}
    </ChartContext.Provider>
  );
}

export function useChartContext() {
  return useContext(ChartContext);
}
